from datetime import datetime
from typing import Optional

def calculate_age(birthdate: Optional[str], as_of: Optional[str] = None) -> int:
    if not birthdate:
        return 40
    try:
        birth_dt = datetime.strptime(birthdate.split("T")[0], "%Y-%m-%d")
        if as_of:
            now_dt = datetime.strptime(as_of.split("T")[0], "%Y-%m-%d")
        else:
            now_dt = datetime(2026, 7, 4)
        return now_dt.year - birth_dt.year - ((now_dt.month, now_dt.day) < (birth_dt.month, birth_dt.day))
    except Exception:
        return 40
