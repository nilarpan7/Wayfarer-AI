from beanie import Document, Indexed
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

class User(Document):
    email: Indexed(str, unique=True)
    # None for accounts created through an OAuth provider (no local password).
    hashed_password: Optional[str] = None
    full_name: Optional[str] = None
    picture: Optional[str] = None
    # "password" | "google"
    auth_provider: str = "password"
    preferred_currency: str = "INR"
    created_at: datetime = Field(default_factory=_utcnow)

    class Settings:
        name = "users"
