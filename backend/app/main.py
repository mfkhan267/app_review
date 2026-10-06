from datetime import date
from io import BytesIO
from typing import Optional

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import crud, schemas
from .auth import create_token, require_admin, verify_password
from .database import Base, SessionLocal, engine, get_db, wait_for_db
from .seed_data import seed_catalog_if_empty, seed_if_empty

app = FastAPI(title="EOS Review API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
        seed_catalog_if_empty(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}


# --- Auth -----------------------------------------------------------------

@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(body: schemas.LoginRequest):
    if not verify_password(body.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect admin password")
    return schemas.LoginResponse(token=create_token(), expires_in=8 * 60 * 60)


# --- Apps (read: open / user mode) -----------------------------------------

@app.get("/api/apps", response_model=list[schemas.AppOut])
def api_list_apps(
    platform: Optional[str] = None,
    tech_name: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
):
    apps = crud.list_apps(db, platform=platform, tech_name=tech_name, q=q)
    return [crud.app_out(a) for a in apps]


@app.get("/api/apps/{app_pk}", response_model=schemas.AppOut)
def api_get_app(app_pk: int, db: Session = Depends(get_db)):
    obj = crud.get_app(db, app_pk)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "App not found")
    return crud.app_out(obj)


@app.get("/api/summary", response_model=schemas.SummaryOut)
def api_summary(db: Session = Depends(get_db)):
    apps = crud.list_apps(db)
    return crud.build_summary(apps)


# --- Apps (write: admin mode only) -----------------------------------------

@app.post("/api/apps", response_model=schemas.AppOut, dependencies=[Depends(require_admin)])
def api_create_app(body: schemas.AppCreate, db: Session = Depends(get_db)):
    if crud.get_app_by_app_id(db, body.app_id):
        raise HTTPException(status.HTTP_409_CONFLICT, f"app_id '{body.app_id}' already exists")
    obj = crud.create_app(db, body)
    return crud.app_out(obj)


@app.put("/api/apps/{app_pk}", response_model=schemas.AppOut, dependencies=[Depends(require_admin)])
def api_update_app(app_pk: int, body: schemas.AppUpdate, db: Session = Depends(get_db)):
    obj = crud.get_app(db, app_pk)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "App not found")
    obj = crud.update_app(db, obj, body)
    return crud.app_out(obj)


@app.delete("/api/apps/{app_pk}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def api_delete_app(app_pk: int, db: Session = Depends(get_db)):
    obj = crud.get_app(db, app_pk)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "App not found")
    crud.delete_app(db, obj)


# --- Component-level upgrade plan (RED/AMBER owners, admin mode) -----------

@app.patch(
    "/api/components/{component_id}/upgrade-plan",
    response_model=schemas.ComponentOut,
    dependencies=[Depends(require_admin)],
)
def api_update_upgrade_plan(component_id: int, body: schemas.UpgradePlanUpdate, db: Session = Depends(get_db)):
    component = crud.get_component(db, component_id)
    if not component:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Component not found")
    component = crud.update_component_upgrade_plan(db, component, body)
    return crud.component_out(component)


# --- Technology catalog ----------------------------------------------------
# The organization's approved technology list (EOSS = End of Standard
# Support, EOES = End of Extended Support). Read is open so the dropdown in
# the onboarding/edit form - and a reference view for anyone - can use it;
# writes are admin-only.

@app.get("/api/catalog", response_model=list[schemas.TechCatalogOut])
def api_list_catalog(component_type: Optional[str] = None, db: Session = Depends(get_db)):
    return [schemas.TechCatalogOut.model_validate(c) for c in crud.list_catalog(db, component_type)]


@app.post("/api/catalog", response_model=schemas.TechCatalogOut, dependencies=[Depends(require_admin)])
def api_create_catalog_entry(body: schemas.TechCatalogCreate, db: Session = Depends(get_db)):
    try:
        obj = crud.create_catalog_entry(db, body)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"{body.component_type} '{body.tech_name} {body.version}' is already in the catalog",
        )
    return schemas.TechCatalogOut.model_validate(obj)


@app.put("/api/catalog/{entry_id}", response_model=schemas.TechCatalogOut, dependencies=[Depends(require_admin)])
def api_update_catalog_entry(entry_id: int, body: schemas.TechCatalogCreate, db: Session = Depends(get_db)):
    obj = crud.get_catalog_entry(db, entry_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Catalog entry not found")
    try:
        obj = crud.update_catalog_entry(db, obj, body)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"{body.component_type} '{body.tech_name} {body.version}' is already in the catalog",
        )
    return schemas.TechCatalogOut.model_validate(obj)


@app.delete("/api/catalog/{entry_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def api_delete_catalog_entry(entry_id: int, db: Session = Depends(get_db)):
    obj = crud.get_catalog_entry(db, entry_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Catalog entry not found")
    crud.delete_catalog_entry(db, obj)


# --- Bulk onboarding / dataset refresh via Excel (admin mode) --------------
# One row per component (an app with an Application + Database + OS layer
# is 3 rows sharing the same app_id). Rows are grouped back into apps and
# upserted - a re-import fully replaces each app_id's component set.

REQUIRED_COLUMNS = [
    "app_id", "app_name", "platform", "app_owner", "app_owner_email",
    "platform_owner", "component_type", "tech_name", "eol_date",
]

APP_FIELDS = ["app_id", "app_name", "platform", "app_owner", "app_owner_email",
              "platform_owner", "platform_owner_email"]
COMPONENT_FIELDS = ["component_type", "tech_name", "version", "eol_date", "extended_support_date"]


@app.post("/api/apps/import", response_model=schemas.ImportResult, dependencies=[Depends(require_admin)])
async def api_import_apps(file: UploadFile, db: Session = Depends(get_db)):
    content = await file.read()
    try:
        df = pd.read_excel(BytesIO(content))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Could not read Excel file: {e}")

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Missing required column(s): {missing}")

    df = df.where(pd.notnull(df), None)

    rows_by_app: dict[str, dict] = {}
    errors: list[str] = []
    for i, record in enumerate(df.to_dict(orient="records"), start=2):  # row 1 = header
        app_id = record.get("app_id")
        if not app_id:
            errors.append(f"Row {i}: missing app_id")
            continue
        for date_col in ("eol_date", "extended_support_date"):
            if record.get(date_col) is not None:
                try:
                    record[date_col] = pd.to_datetime(record[date_col]).date().isoformat()
                except Exception:  # noqa: BLE001
                    errors.append(f"Row {i}: invalid {date_col}")
                    continue

        entry = rows_by_app.setdefault(app_id, {f: record.get(f) for f in APP_FIELDS})
        entry.setdefault("components", [])
        entry["components"].append({f: record.get(f) for f in COMPONENT_FIELDS})

    created, updated, upsert_errors = crud.upsert_from_rows(db, rows_by_app)
    return schemas.ImportResult(apps_created=created, apps_updated=updated, errors=errors + upsert_errors)
