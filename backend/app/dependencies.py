from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from beanie import PydanticObjectId

from app.services.auth_service import decode_access_token
from app.models.user import User

security = HTTPBearer(auto_error=False)


def unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def resolve_user_from_token(token: Optional[str]) -> User:
    """
    Resolve the owner of a bearer token.

    Raises 401 for any missing, malformed, expired, or unknown credential.
    There is no demo/fallback identity: authentication either succeeds with a
    real persisted user or fails.
    """
    payload = decode_access_token(token or "")
    if not payload:
        raise unauthorized("Invalid or expired authentication token.")

    user_id = payload.get("sub")
    if not user_id or not PydanticObjectId.is_valid(user_id):
        raise unauthorized("Invalid authentication token subject.")

    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise unauthorized("Authenticated user no longer exists.")

    return user


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    if credentials is None or not credentials.credentials:
        raise unauthorized("Not authenticated.")
    if (credentials.scheme or "").lower() != "bearer":
        raise unauthorized("Unsupported authorization scheme.")

    return await resolve_user_from_token(credentials.credentials)
