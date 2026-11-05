import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.concurrency import run_in_threadpool

from app.schemas.auth import (
    UserRegister,
    UserLogin,
    GoogleAuthRequest,
    Token,
    UserOut,
)
from app.models.user import User
from app.services.auth_service import (
    GoogleTokenError,
    create_access_token,
    get_password_hash,
    verify_google_id_token,
    verify_password,
)
from app.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _normalize_email(email: str) -> str:
    return email.strip().lower()


async def _find_user_by_email(email: str) -> Optional[User]:
    """Look up a user by normalized email, tolerating legacy mixed-case records."""
    normalized = _normalize_email(email)
    user = await User.find_one(User.email == normalized)
    if user is None and email != normalized:
        user = await User.find_one(User.email == email)
    return user


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        picture=user.picture,
        auth_provider=user.auth_provider,
        preferred_currency=user.preferred_currency,
    )


def _issue_token(user: User) -> Token:
    token = create_access_token(subject=str(user.id), email=user.email)
    return Token(access_token=token, user=_to_user_out(user))


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    email = _normalize_email(user_in.email)

    if await _find_user_by_email(email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    try:
        hashed_pwd = get_password_hash(user_in.password)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password is too long.",
        )

    full_name = (user_in.full_name or "").strip() or email.split("@")[0]
    user = User(
        email=email,
        hashed_password=hashed_pwd,
        full_name=full_name,
        auth_provider="password",
    )
    await user.insert()

    return _issue_token(user)


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    user = await _find_user_by_email(user_in.email)

    # Same response for unknown email and wrong password (no account enumeration).
    if user is None or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    return _issue_token(user)


@router.post("/google", response_model=Token)
async def google_sign_in(payload: GoogleAuthRequest):
    """
    Exchange a verified Google ID token for a Wayfarer access token.

    This is what makes Google sign-in a real backend identity instead of a
    frontend-only session.
    """
    try:
        claims = await run_in_threadpool(verify_google_id_token, payload.id_token)
    except GoogleTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = _normalize_email(claims["email"])
    name = (claims.get("name") or "").strip() or email.split("@")[0]
    picture = claims.get("picture")

    user = await _find_user_by_email(email)
    if user is None:
        user = User(
            email=email,
            hashed_password=None,
            full_name=name,
            picture=picture,
            auth_provider="google",
        )
        await user.insert()
        logger.info("Created account from verified Google identity: %s", email)
    else:
        # Google verified this email address, so link it to the existing account.
        changed = False
        if not user.full_name and name:
            user.full_name = name
            changed = True
        if picture and user.picture != picture:
            user.picture = picture
            changed = True
        if user.hashed_password is None and user.auth_provider != "google":
            user.auth_provider = "google"
            changed = True
        if changed:
            await user.save()

    return _issue_token(user)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return _to_user_out(current_user)
