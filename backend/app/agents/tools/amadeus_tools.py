import httpx
import logging
from typing import List, Dict, Optional

from app.config import settings
from app.services.location_resolver import resolve_location

logger = logging.getLogger(__name__)


async def search_flights(
    origin: str,
    destination: str,
    start_date: str,
    end_date: Optional[str] = None,
    adults: int = 1,
    max_transit_budget: Optional[float] = None,
) -> List[Dict]:
    """Search only live flight options through SerpAPI Google Flights."""
    transit_options: List[Dict] = []

    orig_loc = await resolve_location(origin)
    dest_loc = await resolve_location(destination)
    if not orig_loc or not dest_loc:
        logger.error(
            "Flight search failed: %s",
            {
                "source": "serpapi_flights",
                "code": "location_unresolved",
                "message": "Origin and destination must both resolve to verified locations.",
            },
        )
        return []

    orig_code = orig_loc.get("airport_code")
    dest_code = dest_loc.get("airport_code")
    if not orig_code or not dest_code:
        logger.error(
            "Flight search failed: %s",
            {
                "source": "serpapi_flights",
                "code": "airport_code_unavailable",
                "message": "Verified airport codes are unavailable for the requested locations.",
            },
        )
        return []

    if not settings.SERPAPI_API_KEY or settings.SERPAPI_API_KEY == "your-serpapi-key":
        logger.error(
            "Flight search unavailable: %s",
            {
                "source": "serpapi_flights",
                "code": "api_key_unavailable",
                "message": "SERPAPI_API_KEY is not configured.",
            },
        )
        return []

    try:
        params = {
            "engine": "google_flights",
            "departure_id": orig_code,
            "arrival_id": dest_code,
            "outbound_date": start_date,
            "currency": "INR",
            "hl": "en",
            "api_key": settings.SERPAPI_API_KEY,
            "adults": adults,
        }
        if end_date:
            params["return_date"] = end_date
            params["type"] = "1"
        else:
            params["type"] = "2"

        async with httpx.AsyncClient(timeout=12.0) as client:
            logger.info("Transit Agent querying Google Flights: %s → %s", orig_code, dest_code)
            resp = await client.get("https://serpapi.com/search.json", params=params)
            if resp.status_code != 200:
                logger.error(
                    "SerpAPI Flights failed: %s",
                    {
                        "source": "serpapi_flights",
                        "code": "api_error",
                        "message": f"HTTP status {resp.status_code}.",
                    },
                )
                return []

            data = resp.json()
            if data.get("error"):
                logger.error(
                    "SerpAPI Flights failed: %s",
                    {
                        "source": "serpapi_flights",
                        "code": "api_error",
                        "message": str(data["error"]),
                    },
                )
                return []

            best_flights = data.get("best_flights", []) or data.get("other_flights", [])
            for flight_group in best_flights[:4]:
                flights_list = flight_group.get("flights", [])
                raw_price = flight_group.get("price")
                if not flights_list or raw_price is None:
                    continue
                try:
                    price = float(raw_price)
                except (TypeError, ValueError):
                    continue
                first_flight = flights_list[0]
                airline = first_flight.get("airline")
                if not airline:
                    continue
                flight_num = first_flight.get("flight_number", "")
                dep_airport = first_flight.get("departure_airport", {}).get("name")
                arr_airport = first_flight.get("arrival_airport", {}).get("name")
                transit_options.append(
                    {
                        "booking_type": "FLIGHT",
                        "provider": f"{airline} {flight_num}".strip(),
                        "title": f"Flight: {orig_code} to {dest_code} ({airline})",
                        "price": price,
                        "currency": "INR",
                        "booking_url": (
                            flight_group.get("link")
                            or f"https://www.google.com/travel/flights?q=Flights%20from%20{orig_code}%20to%20{dest_code}%20on%20{start_date}"
                        ),
                        "details": {
                            "transit_mode": "Commercial Flight",
                            "airline": airline,
                            "flight_number": flight_num,
                            "departure_airport": dep_airport,
                            "arrival_airport": arr_airport,
                            "departure_date": start_date,
                            "return_date": end_date,
                        },
                    }
                )
    except Exception as exc:
        logger.error(
            "SerpAPI Flights failed: %s",
            {
                "source": "serpapi_flights",
                "code": "api_error",
                "message": str(exc),
            },
        )
        return []

    if not transit_options:
        logger.error(
            "Flight search returned no real results: %s",
            {
                "source": "serpapi_flights",
                "code": "no_results",
                "message": f"No live flights were found from {orig_code} to {dest_code}.",
            },
        )

    if max_transit_budget:
        transit_options.sort(key=lambda option: (0 if option["price"] <= max_transit_budget else 1, option["price"]))
    else:
        transit_options.sort(key=lambda option: option["price"])
    return transit_options
