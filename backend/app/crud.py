from collections import Counter
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .status import compute_status


def _base_query(db: Session):
    return db.query(models.App).options(joinedload(models.App.components))


def list_apps(
    db: Session,
    platform: Optional[str] = None,
    tech_name: Optional[str] = None,
    q: Optional[str] = None,
) -> list[models.App]:
    query = _base_query(db)
    if platform:
        query = query.filter(models.App.platform == platform)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (models.App.app_name.ilike(like))
            | (models.App.app_id.ilike(like))
            | (models.App.app_owner.ilike(like))
            | (models.App.platform_owner.ilike(like))
        )
    apps = query.order_by(models.App.app_id).all()
    if tech_name:
        apps = [a for a in apps if any(c.tech_name == tech_name for c in a.components)]
    return apps


def get_app(db: Session, app_pk: int) -> Optional[models.App]:
    return _base_query(db).filter(models.App.id == app_pk).first()


def get_app_by_app_id(db: Session, app_id: str) -> Optional[models.App]:
    return _base_query(db).filter(models.App.app_id == app_id).first()


def get_component(db: Session, component_id: int) -> Optional[models.Component]:
    return db.query(models.Component).filter(models.Component.id == component_id).first()


def _app_fields(data: schemas.AppBase) -> dict:
    return {
        "app_id": data.app_id,
        "app_name": data.app_name,
        "platform": data.platform,
        "app_owner": data.app_owner,
        "app_owner_email": data.app_owner_email,
        "platform_owner": data.platform_owner,
        "platform_owner_email": data.platform_owner_email,
    }


def create_app(db: Session, data: schemas.AppCreate) -> models.App:
    obj = models.App(**_app_fields(data))
    obj.components = [models.Component(**c.model_dump()) for c in data.components]
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_app(db: Session, obj: models.App, data: schemas.AppUpdate) -> models.App:
    """Full edit: updates app fields and replaces the whole component set.
    Existing component-level upgrade plans are intentionally dropped on a
    full replace, since versions/dates may have changed underneath them -
    use PATCH /components/{id}/upgrade-plan for in-place plan updates."""
    for field, value in _app_fields(data).items():
        setattr(obj, field, value)
    obj.components = [models.Component(**c.model_dump()) for c in data.components]
    db.commit()
    db.refresh(obj)
    return obj


def update_component_upgrade_plan(
    db: Session, component: models.Component, data: schemas.UpgradePlanUpdate
) -> models.Component:
    component.upgrade_plan = data.upgrade_plan
    component.upgrade_target_date = data.upgrade_target_date
    db.commit()
    db.refresh(component)
    return component


def delete_app(db: Session, obj: models.App) -> None:
    db.delete(obj)
    db.commit()


def upsert_from_rows(db: Session, rows_by_app: dict[str, dict]) -> tuple[int, int, list[str]]:
    """Bulk upsert used by the Excel import endpoint. Each value is a dict
    with app fields plus a 'components' list; matches/replaces by app_id."""
    created, updated, errors = 0, 0, []
    for app_id, raw in rows_by_app.items():
        try:
            payload = schemas.AppCreate(**raw)
        except Exception as e:  # noqa: BLE001
            errors.append(f"{app_id}: {e}")
            continue

        existing = get_app_by_app_id(db, payload.app_id)
        if existing:
            update_app(db, existing, payload)
            updated += 1
        else:
            create_app(db, payload)
            created += 1
    return created, updated, errors


def component_out(c: models.Component, today: Optional[date] = None) -> schemas.ComponentOut:
    return schemas.ComponentOut(
        id=c.id,
        component_type=c.component_type,
        tech_name=c.tech_name,
        version=c.version,
        eol_date=c.eol_date,
        extended_support_date=c.extended_support_date,
        upgrade_plan=c.upgrade_plan,
        upgrade_target_date=c.upgrade_target_date,
        status=compute_status(c.eol_date, c.extended_support_date, today),
    )


def app_out(obj: models.App, today: Optional[date] = None) -> schemas.AppOut:
    return schemas.AppOut(
        id=obj.id,
        app_id=obj.app_id,
        app_name=obj.app_name,
        platform=obj.platform,
        app_owner=obj.app_owner,
        app_owner_email=obj.app_owner_email,
        platform_owner=obj.platform_owner,
        platform_owner_email=obj.platform_owner_email,
        components=[component_out(c, today) for c in obj.components],
        created_at=obj.created_at,
        updated_at=obj.updated_at,
    )


def list_catalog(db: Session, component_type: Optional[str] = None) -> list[models.TechCatalog]:
    query = db.query(models.TechCatalog)
    if component_type:
        query = query.filter(models.TechCatalog.component_type == component_type)
    return query.order_by(models.TechCatalog.component_type, models.TechCatalog.tech_name,
                           models.TechCatalog.version).all()


def get_catalog_entry(db: Session, entry_id: int) -> Optional[models.TechCatalog]:
    return db.query(models.TechCatalog).filter(models.TechCatalog.id == entry_id).first()


def create_catalog_entry(db: Session, data: schemas.TechCatalogCreate) -> models.TechCatalog:
    obj = models.TechCatalog(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_catalog_entry(
    db: Session, obj: models.TechCatalog, data: schemas.TechCatalogCreate
) -> models.TechCatalog:
    for field, value in data.model_dump().items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_catalog_entry(db: Session, obj: models.TechCatalog) -> None:
    db.delete(obj)
    db.commit()


def build_summary(apps: list[models.App], today: Optional[date] = None) -> schemas.SummaryOut:
    components = [c for a in apps for c in a.components]
    statuses = [compute_status(c.eol_date, c.extended_support_date, today) for c in components]
    by_status = dict(Counter(statuses))
    for s in ("GREEN", "AMBER", "RED", "BLUE"):
        by_status.setdefault(s, 0)
    by_platform = dict(Counter(a.platform for a in apps))
    by_tech_name = dict(Counter(c.tech_name for c in components))
    return schemas.SummaryOut(
        total_apps=len(apps),
        total_components=len(components),
        by_status=by_status,
        by_platform=by_platform,
        by_tech_name=by_tech_name,
    )
