import httpx
import logging
import math
import re
from typing import List, Dict, Optional

from app.config import settings
from app.services.location_resolver import resolve_location

logger = logging.getLogger(__name__)


async def search_hotels(
    location: str,
    check_in_date: str,
    check_out_date: str,
    adults: int = 1,
    max_price_per_night: Optional[float] = None,
) -> List[Dict]:
    """Search live hotel accommodations through SerpAPI Google Hotels."""
    hotels: List[Dict] = []

    loc_info = await resolve_location(location)
    if not loc_info or not loc_info.get("formatted_query"):
        logger.error(
            "Hotel search failed: %s",
            {
                "source": "serpapi_hotels",
                "code": "location_unresolved",
                "message": f"No verified location was found for '{location}'.",
            },
        )
        return []

    resolved_query = loc_info["formatted_query"]
    if not settings.SERPAPI_API_KEY or settings.SERPAPI_API_KEY == "your-serpapi-key":
        logger.error(
            "Hotel search unavailable: %s",
            {
                "source": "serpapi_hotels",
                "code": "api_key_unavailable",
                "message": "SERPAPI_API_KEY is not configured.",
            },
        )
        return []

    try:
        params = {
            "engine": "google_hotels",
            "q": f"hotels in {resolved_query}",
            "check_in_date": check_in_date,
            "check_out_date": check_out_date,
            "adults": max(1, adults),
            "currency": "INR",
            "api_key": settings.SERPAPI_API_KEY,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            logger.info("Lodging Agent querying Google Hotels for: %s", resolved_query)
            resp = await client.get("https://serpapi.com/search.json", params=params)
            if resp.status_code != 200:
                logger.error(
                    "SerpAPI Hotels failed: %s",
                    {
                        "source": "serpapi_hotels",
                        "code": "api_error",
                        "message": f"HTTP status {resp.status_code}.",
                    },
                )
                return []

            data = resp.json()
            if data.get("error"):
                logger.error(
                    "SerpAPI Hotels failed: %s",
                    {
                        "source": "serpapi_hotels",
                        "code": "api_error",
                        "message": str(data["error"]),
                    },
                )
                return []

            for prop in data.get("properties", []):
                name = prop.get("name")
                rate_info = prop.get("rate_per_night") or {}
                raw_rate = (
                    rate_info.get("extracted_before_taxes_fees")
                    or rate_info.get("extracted_before_taxes")
                    or rate_info.get("extracted_lowest")
                )
                if raw_rate is None:
                    str_rate = rate_info.get("before_taxes_fees") or rate_info.get("lowest")
                    if str_rate:
                        match = re.search(r"(\d[\d,]*)", str(str_rate))
                        if match:
                            raw_rate = match.group(1).replace(",", "")

                if not name or raw_rate is None:
                    continue
                try:
                    rate = float(raw_rate)
                except (TypeError, ValueError):
                    continue

                rating = prop.get("overall_rating")
                safe_link = prop.get("link") or f"https://www.google.com/travel/hotels?q=hotels+in+{resolved_query.replace(' ', '+')}"
                rooms_count = max(1, math.ceil(adults / 2))
                hotel = {
                    "booking_type": "HOTEL",
                    "provider": name,
                    "title": f"{name} ({rating}/5)" if rating is not None else name,
                    "price": rate,
                    "currency": "INR",
                    "booking_url": safe_link,
                    "details": {
                        "nightly_rate": rate,
                        "location": resolved_query,
                        "check_in": check_in_date,
                        "check_out": check_out_date,
                        "guests": adults,
                        "rooms": rooms_count,
                    },
                }
                if rating is not None:
                    hotel["details"]["rating"] = rating
                hotels.append(hotel)

            # Sort hotels prioritizing options within or closest to budget cap, then by price
            if max_price_per_night is not None:
                hotels.sort(key=lambda x: (0 if x["price"] <= max_price_per_night * 1.5 else 1, x["price"]))
            else:
                hotels.sort(key=lambda x: x["price"])

            hotels = hotels[:5]
    except Exception as exc:
        logger.error(
            "SerpAPI Hotels failed: %s",
            {
                "source": "serpapi_hotels",
                "code": "api_error",
                "message": str(exc),
            },
        )
        return []

    if not hotels:
        logger.error(
            "Hotel search returned no real results: %s",
            {
                "source": "serpapi_hotels",
                "code": "no_results",
                "message": f"No live hotels matched '{resolved_query}' for the requested dates and budget.",
            },
        )
    return hotels
