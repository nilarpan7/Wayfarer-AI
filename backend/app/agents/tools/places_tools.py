import httpx
import logging
from typing import List, Dict, Optional

from app.config import settings
from app.services.location_resolver import resolve_location

logger = logging.getLogger(__name__)

# Valid Table A types supported as filters in Google Places API (New) searchNearby
BASE_TOURIST_TYPES = [
    "tourist_attraction",
    "historical_landmark",
    "historical_place",
    "museum",
    "park",
]

PREF_TYPE_MAP = {
    "Food & Dining": ["restaurant", "cafe"],
    "Culture & History": ["historical_landmark", "historical_place", "hindu_temple", "tourist_attraction", "cultural_landmark"],
    "Art & Museums": ["art_gallery", "museum", "cultural_center"],
    "Nightlife": ["bar", "night_club"],
    "Nature & Outdoors": ["park", "hiking_area", "national_park"],
    "Shopping": ["shopping_mall", "market"],
}


async def _fetch_serpapi_attractions(destination_query: str) -> List[Dict]:
    """Fetch live attractions from SerpAPI Google Maps as a secondary real-time source."""
    if not settings.SERPAPI_API_KEY or settings.SERPAPI_API_KEY == "your-serpapi-key":
        return []

    try:
        params = {
            "engine": "google_maps",
            "q": f"top attractions in {destination_query}",
            "api_key": settings.SERPAPI_API_KEY,
            "hl": "en",
        }
        async with httpx.AsyncClient(timeout=12.0) as client:
            logger.info("Sightseeing Agent querying live SerpAPI Google Maps for: %s", destination_query)
            resp = await client.get("https://serpapi.com/search.json", params=params)
            if resp.status_code != 200:
                logger.warning("SerpAPI Google Maps attractions request returned status %s: %s", resp.status_code, resp.text[:200])
                return []

            data = resp.json()
            attractions: List[Dict] = []
            for place in data.get("local_results", []):
                title = place.get("title")
                gps = place.get("gps_coordinates") or {}
                p_lat = gps.get("latitude")
                p_lng = gps.get("longitude")
                if not title or p_lat is None or p_lng is None:
                    continue

                attractions.append({
                    "name": title,
                    "category": place.get("type") or "Attraction",
                    "lat": p_lat,
                    "lng": p_lng,
                    "rating": place.get("rating"),
                    "reviews_count": place.get("reviews"),
                    "maps_url": place.get("links", {}).get("directions") or f"https://www.google.com/maps/search/?api=1&query={p_lat},{p_lng}",
                })
            return attractions
    except Exception as exc:
        logger.warning("SerpAPI Google Maps attractions search failed: %s", exc)
        return []


async def get_attractions(
    destination: str,
    preferences: Optional[List[str]] = None,
) -> List[Dict]:
    """Fetch verified live tourist attractions and POIs from Google Places API or SerpAPI Maps."""
    loc_info = await resolve_location(destination)
    lat = loc_info.get("lat")
    lng = loc_info.get("lon")
    if lat is None or lng is None:
        logger.error(
            "Attractions lookup failed: %s",
            {
                "source": "places",
                "code": "location_unresolved",
                "message": f"Cannot retrieve attractions without verified coordinates for '{destination}'.",
            },
        )
        return []

    dest_label = loc_info.get("formatted_query") or loc_info.get("city") or destination

    # Build types list strictly using Table A types
    included_types = list(BASE_TOURIST_TYPES)
    if preferences:
        for pref in preferences:
            matched_types = PREF_TYPE_MAP.get(pref, [])
            for t in matched_types:
                if t not in included_types:
                    included_types.append(t)

    attractions: List[Dict] = []

    # 1. Primary: Google Places API (New)
    if settings.GOOGLE_PLACES_API_KEY and settings.GOOGLE_PLACES_API_KEY != "your-google-places-key":
        url = "https://places.googleapis.com/v1/places:searchNearby"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": (
                "places.id,places.displayName,places.formattedAddress,places.location,"
                "places.rating,places.userRatingCount,places.types"
            ),
        }

        # Try with filtered types first, then fall back to base types if custom types are rejected
        attempts = [
            {"includedTypes": included_types[:10]},
            {"includedTypes": BASE_TOURIST_TYPES},
            {},  # without includedTypes filter
        ]

        async with httpx.AsyncClient(timeout=10.0) as client:
            for attempt_body in attempts:
                body = {
                    **attempt_body,
                    "maxResultCount": 20,
                    "locationRestriction": {
                        "circle": {
                            "center": {"latitude": lat, "longitude": lng},
                            "radius": 25000.0,
                        }
                    },
                }

                try:
                    resp = await client.post(url, json=body, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        for place in data.get("places", []):
                            name = place.get("displayName", {}).get("text")
                            place_location = place.get("location", {})
                            p_lat = place_location.get("latitude")
                            p_lng = place_location.get("longitude")
                            if not name or p_lat is None or p_lng is None:
                                continue

                            types = place.get("types", [])
                            attraction = {
                                "name": name,
                                "category": types[0].replace("_", " ").title() if types else "Attraction",
                                "lat": p_lat,
                                "lng": p_lng,
                                "maps_url": f"https://www.google.com/maps/search/?api=1&query={p_lat},{p_lng}",
                            }
                            if place.get("rating") is not None:
                                attraction["rating"] = place["rating"]
                            attractions.append(attraction)

                        if attractions:
                            break  # Successfully gathered attractions
                    else:
                        logger.warning(
                            "Google Places searchNearby attempt failed with %s: %s",
                            resp.status_code,
                            resp.text[:300],
                        )
                except Exception as req_err:
                    logger.warning("Google Places API request error: %s", req_err)

    # 2. Secondary live fallback: SerpAPI Google Maps
    if len(attractions) < 3:
        logger.info("Attempting secondary live source (SerpAPI Maps) for attractions in '%s'", dest_label)
        serp_attractions = await _fetch_serpapi_attractions(dest_label)
        if serp_attractions:
            seen_names = {a["name"].lower() for a in attractions}
            for sa in serp_attractions:
                if sa["name"].lower() not in seen_names:
                    attractions.append(sa)
                    seen_names.add(sa["name"].lower())

    if not attractions:
        logger.error(
            "Attractions lookup returned no real results: %s",
            {
                "source": "places_tools",
                "code": "no_results",
                "message": f"No live attractions were found for '{destination}'.",
            },
        )
        return []

    logger.info(
        "Places tools retrieved %s real live POIs for '%s'",
        len(attractions),
        dest_label,
    )
    return attractions
