import logging
from typing import Dict, Tuple, Optional
from app.services.location_resolver import resolve_location

logger = logging.getLogger(__name__)

async def geocode_address(address: str) -> Optional[Tuple[float, float]]:
    """Geocode address/city name to (latitude, longitude) using resolved location directory + Nominatim."""
    try:
        resolved = await resolve_location(address)
        if resolved and "lat" in resolved and "lon" in resolved:
            return (float(resolved["lat"]), float(resolved["lon"]))
    except Exception as e:
        logger.error(f"Geocoding error for '{address}': {e}")
    return None
