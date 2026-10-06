from datetime import date

from sqlalchemy.orm import Session

from . import models


def _app(app_id, app_name, platform, app_owner, app_owner_email,
         platform_owner, platform_owner_email, components):
    return models.App(
        app_id=app_id, app_name=app_name, platform=platform,
        app_owner=app_owner, app_owner_email=app_owner_email,
        platform_owner=platform_owner, platform_owner_email=platform_owner_email,
        components=[models.Component(**c) for c in components],
    )


def _c(component_type, tech_name, version, eol_date, extended_support_date=None):
    return dict(component_type=component_type, tech_name=tech_name, version=version,
                eol_date=eol_date, extended_support_date=extended_support_date)


def seed_if_empty(db: Session) -> None:
    if db.query(models.App).count() > 0:
        return

    apps = [
        _app("APP-001", "Customer Portal", "Web", "R. Fernandes", "r.fernandes@example.com",
             "A. Menon", "a.menon@example.com", [
                 _c("Application", "React", "18", date(2029, 1, 1)),
                 _c("OS", "Ubuntu", "22.04", date(2027, 4, 1)),
             ]),
        _app("APP-002", "Payroll App", "App", "K. Das", "k.das@example.com",
             "S. Iyer", "s.iyer@example.com", [
                 _c("Application", "Java", "11", date(2026, 9, 1)),
                 _c("Database", "PostgreSQL", "14", date(2028, 11, 1)),
                 _c("OS", "RHEL", "8", date(2029, 5, 31)),
             ]),
        _app("DB-001", "Legacy CRM Database", "Database", "V. Nair", "v.nair@example.com",
             "N. Pillai", "n.pillai@example.com", [
                 _c("Database", "Oracle", "11g", date(2024, 1, 1)),
                 _c("OS", "Oracle Linux", "6", date(2024, 3, 1)),
             ]),
        _app("APP-003", "Inventory System", "App", "M. Thomas", "m.thomas@example.com",
             "P. Krishnan", "p.krishnan@example.com", [
                 _c("Application", ".NET Framework", "4.5", date(2025, 1, 14), date(2027, 1, 14)),
                 _c("Database", "SQL Server", "2014", date(2026, 7, 9)),
                 _c("OS", "Windows Server", "2012", date(2023, 10, 10)),
             ]),
        _app("WEB-001", "Internal Wiki", "Web", "D. Varghese", "d.varghese@example.com",
             "J. George", "j.george@example.com", [
                 _c("Application", "PHP", "7.4", date(2026, 1, 6)),
                 _c("Database", "MySQL", "5.7", date(2025, 10, 31)),
                 _c("OS", "Ubuntu", "18.04", date(2028, 4, 30)),
             ]),
        _app("DB-002", "HR Analytics Database", "Database", "K. Das", "k.das@example.com",
             "S. Iyer", "s.iyer@example.com", [
                 _c("Database", "SQL Server", "2016", date(2027, 7, 11)),
                 _c("OS", "Windows Server", "2016", date(2027, 1, 12)),
             ]),
        _app("WEB-002", "Sales Dashboard", "Web", "V. Nair", "v.nair@example.com",
             "N. Pillai", "n.pillai@example.com", [
                 _c("Application", "Angular", "12", date(2030, 1, 1)),
                 _c("OS", "Ubuntu", "22.04", date(2027, 4, 1)),
             ]),
        _app("DB-003", "Order Processing Database", "Database", "M. Thomas", "m.thomas@example.com",
             "P. Krishnan", "p.krishnan@example.com", [
                 _c("Database", "MySQL", "5.7", date(2023, 10, 21), date(2026, 10, 31)),
                 _c("OS", "CentOS", "7", date(2024, 6, 30)),
             ]),
        _app("APP-005", "Vendor Management App", "App", "M. Thomas", "m.thomas@example.com",
             "P. Krishnan", "p.krishnan@example.com", [
                 _c("Application", "Node.js", "14", date(2026, 11, 30)),
                 _c("Database", "PostgreSQL", "13", date(2028, 11, 1)),
                 _c("OS", "RHEL", "8", date(2029, 5, 31)),
             ]),
    ]
    for a in apps:
        db.add(a)
    db.commit()


def _t(component_type, tech_name, version, eoss_date, eoes_date=None, notes=None):
    return models.TechCatalog(
        component_type=component_type, tech_name=tech_name, version=version,
        eoss_date=eoss_date, eoes_date=eoes_date, notes=notes,
    )


def seed_catalog_if_empty(db: Session) -> None:
    """Starter technology catalog (EOSS/EOES = End of Standard/Extended
    Support). Treat this as a template - replace with your organization's
    actual vendor-published lifecycle dates."""
    if db.query(models.TechCatalog).count() > 0:
        return

    entries = [
        # Application layer
        _t("Application", "Java", "11", date(2026, 9, 1), notes="LTS"),
        _t("Application", "Java", "17", date(2029, 9, 1), notes="LTS - approved for new projects"),
        _t("Application", "Java", "21", date(2031, 9, 1), notes="LTS - latest"),
        _t("Application", ".NET Framework", "4.5", date(2025, 1, 14), date(2027, 1, 14)),
        _t("Application", ".NET", "6", date(2024, 11, 12)),
        _t("Application", ".NET", "8", date(2026, 11, 10), notes="LTS - approved for new projects"),
        _t("Application", "PHP", "7.4", date(2026, 1, 6)),
        _t("Application", "PHP", "8.2", date(2027, 12, 8)),
        _t("Application", "Node.js", "14", date(2026, 11, 30)),
        _t("Application", "Node.js", "18", date(2027, 4, 30)),
        _t("Application", "Node.js", "20", date(2028, 4, 30), notes="LTS - approved for new projects"),
        _t("Application", "React", "17", date(2026, 3, 1)),
        _t("Application", "React", "18", date(2029, 1, 1), notes="Approved for new projects"),
        _t("Application", "Angular", "12", date(2026, 5, 1)),
        _t("Application", "Angular", "17", date(2029, 5, 1), notes="Approved for new projects"),

        # Database layer
        _t("Database", "PostgreSQL", "13", date(2025, 11, 13)),
        _t("Database", "PostgreSQL", "14", date(2026, 11, 12)),
        _t("Database", "PostgreSQL", "16", date(2028, 11, 9), notes="Approved for new projects"),
        _t("Database", "MySQL", "5.7", date(2023, 10, 21)),
        _t("Database", "MySQL", "8.0", date(2026, 4, 30), notes="Approved for new projects"),
        _t("Database", "SQL Server", "2014", date(2024, 7, 9)),
        _t("Database", "SQL Server", "2016", date(2026, 7, 14)),
        _t("Database", "SQL Server", "2019", date(2030, 1, 8), notes="Approved for new projects"),
        _t("Database", "Oracle", "11g", date(2024, 1, 1)),
        _t("Database", "Oracle", "19c", date(2027, 4, 30), notes="Approved for new projects"),

        # OS layer
        _t("OS", "Windows Server", "2012", date(2023, 10, 10)),
        _t("OS", "Windows Server", "2016", date(2027, 1, 12)),
        _t("OS", "Windows Server", "2019", date(2029, 1, 9), notes="Approved for new projects"),
        _t("OS", "RHEL", "8", date(2029, 5, 31)),
        _t("OS", "RHEL", "9", date(2032, 5, 31), notes="Approved for new projects"),
        _t("OS", "Ubuntu", "18.04", date(2028, 4, 30)),
        _t("OS", "Ubuntu", "22.04", date(2027, 4, 1)),
        _t("OS", "CentOS", "7", date(2024, 6, 30)),
        _t("OS", "Oracle Linux", "6", date(2024, 3, 1)),
        _t("OS", "Oracle Linux", "8", date(2029, 7, 1), notes="Approved for new projects"),
    ]
    for e in entries:
        db.add(e)
    db.commit()
