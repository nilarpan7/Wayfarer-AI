from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

# Values that must never be used as a signing key outside local development.
INSECURE_JWT_SECRETS = {
    "",
    "changeme",
    "secret",
    "super-secret-jwt-key",
    "super-secret-jwt-key-wayfarer-ai-2026",
    "your-super-secret-jwt-key",
}

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Wayfarer AI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    # "development" | "production". Controls security fail-fast checks.
    ENVIRONMENT: str = "development"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    FRONTEND_URL: Optional[str] = None
    
    # Database - MongoDB Atlas
    MONGODB_URI: str = "mongodb://localhost:27017/wayfarer_ai"
    DB_NAME: str = "wayfarer_ai"
    
    # Auth / JWT
    JWT_SECRET: str = "super-secret-jwt-key-wayfarer-ai-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "wayfarer-ai"
    JWT_AUDIENCE: str = "wayfarer-ai-app"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Google OAuth (required to accept Google sign-in from the frontend)
    GOOGLE_CLIENT_ID: Optional[str] = None
    
    # LLM - Gemini (AI Studio)
    GEMINI_API_KEY: Optional[str] = None
    
    # External APIs
    AMADEUS_API_KEY: Optional[str] = None
    AMADEUS_API_SECRET: Optional[str] = None
    SERPAPI_API_KEY: Optional[str] = None
    GOOGLE_PLACES_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() in {"production", "prod", "staging"}

    @property
    def allowed_origins(self) -> List[str]:
        """CORS origins, including FRONTEND_URL when provided."""
        origins = [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS if origin.strip()]
        if self.FRONTEND_URL:
            frontend = self.FRONTEND_URL.strip().rstrip("/")
            if frontend and frontend not in origins:
                origins.append(frontend)
        return origins

    @model_validator(mode="after")
    def _validate_security(self) -> "Settings":
        if self.is_production:
            if self.JWT_SECRET.strip().lower() in INSECURE_JWT_SECRETS:
                raise ValueError(
                    "JWT_SECRET must be set to a strong, unique value when ENVIRONMENT is production."
                )
            if len(self.JWT_SECRET.strip()) < 32:
                raise ValueError(
                    "JWT_SECRET must be at least 32 characters long when ENVIRONMENT is production."
                )
        return self

settings = Settings()
