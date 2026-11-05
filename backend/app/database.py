from pymongo import AsyncMongoClient
from beanie import init_beanie
import logging

from app.config import settings
from app.models.user import User
from app.models.trip import Trip

logger = logging.getLogger(__name__)

async def init_db():
    """Initialize MongoDB connection and Beanie ODM models with robust timeout and fallback."""
    db_name = settings.DB_NAME
    if "/" in settings.MONGODB_URI.split("://")[-1]:
        uri_db = settings.MONGODB_URI.split("/")[-1].split("?")[0]
        if uri_db:
            db_name = uri_db

    # 1. Attempt primary MongoDB Atlas connection with 10s timeout
    try:
        client = AsyncMongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=10000)
        await client.admin.command('ping')
        await init_beanie(database=client[db_name], document_models=[User, Trip])
        logger.info(f"Successfully connected to MongoDB Atlas and initialized Beanie ODM ({db_name})")
        return
    except Exception as e:
        logger.warning(f"MongoDB Atlas connection attempt failed: {e}. Trying fallback...")

    # 2. Fallback to local MongoDB instance if Atlas is unavailable
    try:
        fallback_client = AsyncMongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=3000)
        await fallback_client.admin.command('ping')
        await init_beanie(database=fallback_client[db_name], document_models=[User, Trip])
        logger.info("Successfully connected to local MongoDB instance and initialized Beanie ODM")
    except Exception as fallback_err:
        logger.error(
            f"Could not connect to MongoDB Atlas or local MongoDB ({fallback_err}). "
            "Please check network connection and MongoDB Atlas access."
        )
