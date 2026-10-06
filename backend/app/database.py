import os
import time

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Default targets the Postgres service defined in docker-compose.yml.
# To use MySQL instead, set DATABASE_URL to e.g.
#   mysql+pymysql://user:pass@host:3306/dbname
# and add `pymysql` to requirements.txt - no other code changes needed.
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+psycopg2://eos_user:eos_password@db:5432/eos_db"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def wait_for_db(retries: int = 30, delay: float = 2.0):
    """Retry loop so the backend container doesn't crash-loop while Postgres
    is still starting up."""
    last_err = None
    for _ in range(retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(delay)
    raise RuntimeError(f"Database not reachable after {retries} retries: {last_err}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
