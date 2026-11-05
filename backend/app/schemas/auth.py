from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# bcrypt truncates beyond 72 bytes, so cap the password there.
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 72

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
    )
    full_name: Optional[str] = Field(default=None, max_length=120)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)

class GoogleAuthRequest(BaseModel):
    """Google OIDC ID token forwarded by the frontend for verification."""
    id_token: str = Field(min_length=1, max_length=8192)

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    picture: Optional[str] = None
    auth_provider: str = "password"
    preferred_currency: str = "INR"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
