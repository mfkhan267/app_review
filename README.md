# Technology Lifecycle & EOS Command Center

A professional, executive-style web app for tracking End-of-Support (EOS)
status across Web apps, backend Apps, and Databases — for Business/Platform
owners, Application owners, and quarterly CTO review.

**Stack:** React (Vite) + Recharts, served by nginx &middot; FastAPI backend
&middot; PostgreSQL &middot; all three run with Docker Compose.

## 1. What it looks like

A dark navy header with the assessment date, a sticky tab bar, and five views:

| Tab | What it's for |
|---|---|
| **Executive Dashboard** | Portfolio-wide KPIs: Green/Amber/Red/Blue counts, a health donut, drill-down cards per technology layer, a forward-looking "quarters until EOS" chart, and a ranked list of your most-deployed tech/version combos. |
| **Applications / Databases / Operating Systems** | One focused view per technology layer, with its own mini KPI row, filters, and table — instead of one wide table with every column at once. |
| **Owner Remediation** | Every Red/Amber item grouped by the Application Owner responsible for it — a worklist, not a spreadsheet. Shows who's behind and whether a plan is on file. |
| **Tech Catalog** | The organization's approved technology list — one row per technology/version with its EOSS and EOES dates. This is what powers the dropdown in the onboarding/edit form (see §3a below). |

User Mode sees all six tabs read-only. Admin Mode (password login) adds
onboarding, editing, Excel import, and the "Submit/Update plan" actions.

## 2. Data model: Apps and Components

A single "application" (e.g. Payroll App) is rarely one technology — it's
usually a runtime, a database, and an OS, each on its own support lifecycle.
So each **App** (identity + owners) has one or more **Components**, and
status/EOS date/plan all live per component:

```
App: Payroll App (APP-002)
  owners: K. Das (app owner), S. Iyer (platform owner)
  ├─ Component: Application — Java 11       → RED   (EOS already reached)
  ├─ Component: Database    — PostgreSQL 14 → GREEN
  └─ Component: OS          — RHEL 8        → GREEN
```

Every chart, card, and table on every tab is derived client-side from this
same `apps[]` list (one API call), so the whole dashboard stays consistent.

## 3a. Technology Catalog (approved versions, auto-filled dates)

Rather than typing a tech name, version, and two dates by hand every time,
the **Tech Catalog** tab maintains the organization's approved technology
list — one row per `component_type` + `tech_name` + `version`, with:

- **EOSS date** — End of Standard Support
- **EOES date** — End of Extended Support (optional)

When onboarding or editing an app, each component row has a "Technology
(approved catalog)" dropdown, scoped to the component's layer. Picking an
entry auto-fills the technology name, version, and both dates (shown
read-only, since they're now sourced from the catalog) — so the resulting
Green/Amber/Red/Blue status is always derived consistently from one source
of truth instead of a hand-typed date that can drift between apps using the
"same" technology.

Picking **"Custom / not in catalog"** reverts that component to free-text
entry, for anything not yet catalogued. Admin Mode can add, edit, or delete
catalog entries directly from the Tech Catalog tab. The seeded catalog
(`seed_catalog_if_empty` in `backend/app/seed_data.py`) is a starting
template — replace the dates with your organization's actual
vendor-published lifecycle dates.

## 3. Status logic (RAG + Blue)

| Status  | Meaning                                | Rule                                                   |
|---------|------------------------------------------|---------------------------------------------------------|
| 🟢 Green | More than 18 months to End of Support     | `eol_date` > today + 18 months                           |
| 🟡 Amber | Less than 18 months to End of Support     | today < `eol_date` ≤ today + 18 months                   |
| 🔴 Red   | Past End of Support                       | today > `eol_date` (and not covered below)               |
| 🔵 Blue  | Extended Support                          | today is between `eol_date` and `extended_support_date`  |

Change the threshold in `backend/app/status.py` (`AMBER_THRESHOLD_MONTHS`).
The "Support ends" column always shows the one date that's actually live
right now (the extended date once a component is Blue, otherwise the EOS
date) instead of two columns.

## 4. Dataset schema

**App** (one record per application): `app_id`, `app_name`, `platform`
(`Web`/`App`/`Database`), `app_owner` + `_email`, `platform_owner` + `_email`.

**Component** (one or more per app): `component_type`
(`Application`/`Database`/`OS`), `tech_name`, `version`, `eol_date`,
`extended_support_date`, plus `upgrade_plan` / `upgrade_target_date` set by
the owner in Admin Mode.

`data/apps_sample.xlsx` has one row per **component** (an app with 3
components is 3 rows sharing the same `app_id`) — ready to import as-is, or
as a template for your own dataset.

**Tech Catalog entry** (see §3a): `component_type`, `tech_name`, `version`,
`eoss_date`, `eoes_date` (optional), `notes` (optional). Unique per
`component_type` + `tech_name` + `version`.

## 5. Run it

```bash
cp .env.example .env     # edit ADMIN_PASSWORD at minimum
docker compose up --build
```

- Frontend: **http://localhost:3000**
- Backend API docs (Swagger): **http://localhost:8000/docs**
- Postgres: localhost:5432 (credentials in `.env`)

On first boot the backend auto-creates its tables and seeds 9 sample apps
(22 components) so the dashboard isn't empty. Delete the `eos_db_data`
Docker volume (`docker compose down -v`) to reset.

## 6. Admin Mode

Password-protected (top-right "Admin Login"). Adds, across all tabs:
- **Onboard application** — add a new app with one or more components.
- **Edit app** — opens the full form (also where you **delete** an app).
- **Import Excel** — bulk upload a `.xlsx` (one row per component); apps
  are upserted by `app_id` and their component list is replaced.
- **Submit / Update plan** — on any Red/Amber component row, or from the
  Owner Remediation worklist — records the upgrade plan and target date.

### A note on Admin Mode auth (MVP)

Admin Mode currently uses **one shared password** for everyone who edits
data — administrators and owners alike. That's intentionally simple for an
MVP; it is not per-owner identity. The API is already shaped for a clean
follow-up (e.g. a magic-link or SSO token scoped to one `app_owner_email`,
restricted to `PATCH /api/components/{id}/upgrade-plan` on their own
components) without changing the frontend much — worth doing before this
goes beyond a small trusted group.

## 7. API reference (also at `/docs`)

| Method | Path                                   | Auth  | Purpose                        |
|--------|-------------------------------------------|-------|-----------------------------------|
| POST   | `/api/auth/login`                          | -     | Exchange admin password for a token |
| GET    | `/api/apps`                                | -     | List apps + components (filters: `platform`, `tech_name`, `q`) |
| GET    | `/api/apps/{id}`                           | -     | One app with its components        |
| GET    | `/api/summary`                             | -     | Component counts by status / platform / tech |
| POST   | `/api/apps`                                | admin | Onboard a new app + its components |
| PUT    | `/api/apps/{id}`                           | admin | Full edit (replaces component list) |
| DELETE | `/api/apps/{id}`                           | admin | Remove an app and its components   |
| PATCH  | `/api/components/{id}/upgrade-plan`        | admin | Owner updates one component's plan |
| POST   | `/api/apps/import`                         | admin | Bulk upsert from an uploaded `.xlsx` (long format: one row per component) |
| GET    | `/api/catalog`                             | -     | List the technology catalog (filter: `component_type`) |
| POST   | `/api/catalog`                             | admin | Add a catalog entry |
| PUT    | `/api/catalog/{id}`                        | admin | Edit a catalog entry |
| DELETE | `/api/catalog/{id}`                        | admin | Remove a catalog entry |

```bash
TOKEN=$(curl -s -X POST localhost:8000/api/auth/login \
  -H "Content-Type: application/json" -d '{"password":"changeme"}' | jq -r .token)

curl -X POST localhost:8000/api/apps/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@data/apps_sample.xlsx"
```

## 8. Using MySQL instead of Postgres

1. Replace the `db` service image in `docker-compose.yml` with `mysql:8`.
2. Add `pymysql` to `backend/requirements.txt`.
3. Set `DATABASE_URL=mysql+pymysql://user:pass@db:3306/eos_db`.

No model or API code changes needed — SQLAlchemy handles the rest.

## 9. Quarterly CTO review workflow

1. Before the review, ask admins/owners to refresh the dataset (Import
   Excel, or edits in Admin Mode) and confirm plans are current on the
   Owner Remediation tab.
2. Open the Executive Dashboard — the KPI row, health donut, and lifecycle
   chart are the at-a-glance view to present directly.
3. Drill into a specific technology layer (Applications/Databases/OS) or
   the Owner Remediation worklist for the detail behind any number.

## 10. What's deliberately left out of this MVP

- Per-owner authentication (see §6) — currently one shared admin password.
- Automated email reminders to Red/Amber owners (adapt the earlier
  `send_alerts.py` script from this project's static-site version to call
  `GET /api/apps`, flatten components, and filter on `status`).
- Audit history / change log on edits.
- Role-based access (e.g. read-only CTO view vs. full admin) beyond the
  current User/Admin split.

These are natural next steps once the MVP is validated with real users.
