import os
import time

import jwt
from fastapi import Header, HTTPException, status

# --- MVP auth model -----------------------------------------------------
# A single shared ADMIN_PASSWORD (set via env var, see docker-compose.yml)
# gates "Admin Mode" for the whole app: administrators onboarding new apps
# AND application/business owners updating their upgrade plans all use the
# same Admin Mode login for now. This keeps the MVP simple - it is not
# per-owner authentication. A natural v2 upgrade is per-owner magic-link or
# SSO login so an owner can only edit their own app(s); the API is already
# shaped (PATCH /api/apps/{id}/upgrade-plan) to make that swap later
# straightforward without changing the frontend contract much.
# --------------------------------------------------------------------------

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
TOKEN_TTL_SECONDS = 8 * 60 * 60  # 8 hours


def create_token() -> str:
    payload = {"role": "admin", "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_password(password: str) -> bool:
    return password == ADMIN_PASSWORD


def require_admin(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing admin token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired admin token")
    return True
