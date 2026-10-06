import calendar
from datetime import date

AMBER_THRESHOLD_MONTHS = 18

STATUS_META = {
    "GREEN": {"label": "Green", "hex": "#2e7d32", "desc": f"More than {AMBER_THRESHOLD_MONTHS} months to End of Support"},
    "AMBER": {"label": "Amber", "hex": "#f9a825", "desc": f"Less than {AMBER_THRESHOLD_MONTHS} months to End of Support"},
    "RED":   {"label": "Red",   "hex": "#c62828", "desc": "Past End of Support"},
    "BLUE":  {"label": "Blue",  "hex": "#1565c0", "desc": "Extended Support"},
}


def add_months(d: date, months: int) -> date:
    total = d.month - 1 + months
    year = d.year + total // 12
    month = total % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def compute_status(eol_date: date, extended_support_date: date | None, today: date | None = None) -> str:
    today = today or date.today()
    if extended_support_date and eol_date < today <= extended_support_date:
        return "BLUE"
    if today > eol_date:
        return "RED"
    threshold = add_months(today, AMBER_THRESHOLD_MONTHS)
    if eol_date <= threshold:
        return "AMBER"
    return "GREEN"
