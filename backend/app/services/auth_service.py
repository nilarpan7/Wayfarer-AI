import jwt
import logging
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt only consumes the first 72 bytes of a password.
BCRYPT_MAX_BYTES = 72

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")

_google_jwks_client: Optional[jwt.PyJWKClient] = None


class GoogleTokenError(Exception):
    """Raised when a Google ID token cannot be verified."""


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    if not hashed_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        # Malformed/legacy hash stored in the database.
        return False


def get_password_hash(password: str) -> str:
    if len(password.encode("utf-8")) > BCRYPT_MAX_BYTES:
        raise ValueError("Password is too long.")
    return pwd_context.hash(password)


def create_access_token(
    subject: str,
    email: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Issue a signed access token for a known user id."""
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: Dict[str, Any] = {
        "sub": subject,
        "email": email,
        "type": "access",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Validate an access token. Returns None when the token is not usable."""
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
            options={"require": ["exp", "iat", "sub"]},
        )
    except jwt.PyJWTError:
        return None

    if payload.get("type") != "access":
        return None
    if not payload.get("sub"):
        return None
    return payload


def _get_google_jwks_client() -> jwt.PyJWKClient:
    global _google_jwks_client
    if _google_jwks_client is None:
        _google_jwks_client = jwt.PyJWKClient(GOOGLE_JWKS_URL, cache_keys=True)
    return _google_jwks_client


def verify_google_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verify a Google OIDC ID token against Google's published signing keys.

    This performs a blocking HTTPS request the first time a signing key is seen,
    so callers inside async handlers should run it in a threadpool.

    Raises GoogleTokenError when the token is missing, malformed, expired,
    issued for another client, or tied to an unverified email address.
    """
    if not id_token:
        raise GoogleTokenError("Missing Google ID token.")
    if not settings.GOOGLE_CLIENT_ID:
        raise GoogleTokenError("Google sign-in is not configured on this server.")

    try:
        signing_key = _get_google_jwks_client().get_signing_key_from_jwt(id_token)
        claims = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.GOOGLE_CLIENT_ID,
            options={"require": ["exp", "iat", "aud", "iss", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise GoogleTokenError("Invalid or expired Google ID token.") from exc
    except Exception as exc:  # network/JWKS failures
        logger.warning("Google ID token verification failed: %s", exc)
        raise GoogleTokenError("Could not verify Google ID token right now.") from exc

    if claims.get("iss") not in GOOGLE_ISSUERS:
        raise GoogleTokenError("Unexpected Google ID token issuer.")

    email = claims.get("email")
    if not email:
        raise GoogleTokenError("Google account did not provide an email address.")

    email_verified = claims.get("email_verified")
    if isinstance(email_verified, str):
        email_verified = email_verified.strip().lower() == "true"
    if not email_verified:
        raise GoogleTokenError("Google account email address is not verified.")

    return claims
