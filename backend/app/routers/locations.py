from typing import List, Dict, Optional
from fastapi import APIRouter, Query
from app.services.location_resolver import suggest_locations

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/suggest", response_model=List[Dict])
async def get_location_suggestions(
    q: Optional[str] = Query(default="", description="Search query for city or airport code"),
    limit: int = Query(default=8, ge=1, le=20)
):
    """Returns fast autocomplete suggestions for origins and destinations."""
    return suggest_locations(query=q or "", limit=limit)

