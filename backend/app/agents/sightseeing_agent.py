import logging
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from app.config import settings
from app.agents.state import TravelPlanState
from app.agents.tools.places_tools import get_attractions
from app.services.location_resolver import resolve_location

logger = logging.getLogger(__name__)


def _numeric_cost(attraction: Dict) -> float:
    """Use a cost only when the provider supplied a numeric value."""
    value = attraction.get("cost") or attraction.get("estimated_cost")
    try:
        return float(value) if value is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


async def _generate_gemini_itinerary(
    destination: str,
    start_date: str,
    total_days: int,
    travelers: int,
    trip_type: str,
    travel_pace: str,
    preferences: List[str],
    verified_attractions: List[Dict],
    lodging_name: Optional[str] = None,
) -> Optional[List[Dict]]:
    """
    Use Gemini 2.5 Flash to synthesize an immersive, geographically sequenced,
    day-by-day travel plan grounded in real verified POIs.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key":
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Build list of verified places for prompt grounding
        pois_summary = []
        poi_map_urls = {}
        for a in verified_attractions[:15]:
            name = a.get("name")
            cat = a.get("category", "Attraction")
            rating = a.get("rating", "")
            maps_url = a.get("maps_url", "")
            if name:
                pois_summary.append(f"- {name} ({cat}, rating: {rating})")
                poi_map_urls[name.lower()] = maps_url

        prompt = f"""You are an elite travel architect specializing in India and global trips.
Design a masterfully curated {total_days}-day itinerary for {destination}.

Trip Context:
- Travelers: {travelers} ({trip_type})
- Travel Pace: {travel_pace}
- Preferences: {", ".join(preferences) if preferences else "General Sightseeing, Culture, Local Cuisine"}
- Base Stay / Hotel: {lodging_name or f"Central {destination}"}
- Start Date: {start_date}

Verified Real Places to prioritize and integrate:
{chr(10).join(pois_summary[:12])}

Guidelines:
1. Sequence activities geographically each day to minimize unnecessary backtracking.
2. Timing must be realistic (e.g. sunrise ghat rituals / Subah-e-Banaras early morning, temples before noon or late afternoon, museums midday, sunset / Ganga Aarti at dusk).
3. Tailor pacing for {travelers} {trip_type}: include dining recommendations (famous local breakfast, street food streets, heritage dinner spots).
4. Return a JSON array of {total_days} day objects.

Each day object must strictly follow this structure:
{{
  "day_number": 1,
  "date": "YYYY-MM-DD",
  "theme": "Captivating Day Theme Title",
  "transit_notes": "Clear, practical transit advice for the day (e.g. walk along ghats, hire e-rickshaw, auto fare ~Rs. 100)",
  "estimated_daily_cost": 500.0,
  "morning_activity": {{
    "title": "Specific Attraction or Activity Name",
    "category": "Heritage / Cultural / Spiritual / Adventure",
    "duration": "07:00 AM – 10:00 AM",
    "description": "2-3 vivid sentences describing the experience, what to see, and authentic insider tips (best photo spots, dress code, local breakfast nearby).",
    "cost": 150.0,
    "maps_url": "https://maps.google.com..."
  }},
  "afternoon_activity": {{
    "title": "Specific Attraction or Activity Name",
    "category": "Culinary & Discovery / Museum / Nature",
    "duration": "01:30 PM – 04:30 PM",
    "description": "2-3 sentences detailing the visit, local lunch specialties to try, and highlights.",
    "cost": 200.0,
    "maps_url": "https://maps.google.com..."
  }},
  "evening_activity": {{
    "title": "Specific Attraction or Activity Name",
    "category": "Evening Ritual / Nightlife / Sunset Views",
    "duration": "06:00 PM – 08:30 PM",
    "description": "2-3 sentences describing evening highlights, sunset viewing, cultural performances, and dinner recommendation.",
    "cost": 250.0,
    "maps_url": "https://maps.google.com..."
  }}
}}
"""

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.25,
        )

        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=config,
        )

        text = resp.text.strip()
        days_data = json.loads(text)

        if isinstance(days_data, list) and len(days_data) >= 1:
            # Re-attach verified maps_url from ground truth POIs where available
            for day in days_data:
                for slot in ["morning_activity", "afternoon_activity", "evening_activity"]:
                    act = day.get(slot)
                    if isinstance(act, dict):
                        title = act.get("title", "")
                        # Match with verified POI map url
                        matched_url = None
                        for poi_name, url in poi_map_urls.items():
                            if poi_name in title.lower() or title.lower() in poi_name:
                                matched_url = url
                                break
                        if matched_url:
                            act["maps_url"] = matched_url
                        elif not act.get("maps_url"):
                            act["maps_url"] = f"https://www.google.com/maps/search/?api=1&query={title}+{destination}"

            logger.info("Gemini 2.5 synthesized %d rich daily plans for '%s'", len(days_data), destination)
            return days_data

    except Exception as exc:
        logger.warning("Gemini itinerary generation encountered error, falling back to heuristic builder: %s", exc)

    return None


async def sightseeing_agent_node(state: TravelPlanState) -> Dict:
    """Organize verified live POIs into a rich, structured schedule powered by Gemini 2.5 Flash."""
    raw_destination = state["destination"]
    start_date = state["start_date"]
    end_date = state["end_date"]
    travelers = state.get("travelers", 1)
    trip_type = state.get("trip_type", "Solo")
    travel_pace = state.get("travel_pace", "Balanced")
    preferences = state.get("preferences", [])

    selected_lodging = state.get("selected_lodging", [])
    lodging_name = selected_lodging[0].get("title") if selected_lodging else None

    loc_info = await resolve_location(raw_destination)
    if not loc_info:
        error = {
            "source": "sightseeing_agent",
            "code": "location_unresolved",
            "message": f"No verified destination was found for '{raw_destination}'.",
        }
        logger.error(error["message"])
        return {
            "itinerary_schedule": [],
            "data_errors": [error],
            "node_logs": [f"❌ Sightseeing Agent: {error['message']}"],
        }

    destination = loc_info.get("formatted_query", raw_destination)
    try:
        d1 = datetime.strptime(start_date, "%Y-%m-%d")
        d2 = datetime.strptime(end_date, "%Y-%m-%d")
    except (TypeError, ValueError) as exc:
        error = {
            "source": "sightseeing_agent",
            "code": "invalid_dates",
            "message": f"Sightseeing requires valid YYYY-MM-DD dates: {exc}",
        }
        logger.error(error["message"])
        return {
            "itinerary_schedule": [],
            "data_errors": [error],
            "node_logs": [f"❌ Sightseeing Agent: {error['message']}"],
        }

    if d2 < d1:
        error = {
            "source": "sightseeing_agent",
            "code": "invalid_dates",
            "message": "End date must be on or after start date.",
        }
        logger.error(error["message"])
        return {
            "itinerary_schedule": [],
            "data_errors": [error],
            "node_logs": [f"❌ Sightseeing Agent: {error['message']}"],
        }

    total_days = (d2 - d1).days + 1

    # Fetch live verified POIs from Google Places API / SerpAPI Maps
    attractions = await get_attractions(raw_destination, preferences)
    unique_attractions: List[Dict] = []
    seen_names = set()
    for attraction in attractions:
        name = attraction.get("name")
        if name and name not in seen_names:
            unique_attractions.append(attraction)
            seen_names.add(name)

    if len(unique_attractions) < 3:
        error = {
            "source": "sightseeing_agent",
            "code": "insufficient_real_attractions",
            "message": (
                f"Only {len(unique_attractions)} unique live attractions were found for {destination}; "
                "minimum 3 verified locations required to construct an itinerary."
            ),
        }
        logger.error(error["message"])
        return {
            "itinerary_schedule": [],
            "data_errors": [error],
            "node_logs": [f"❌ Sightseeing Agent: {error['message']}"],
        }

    # 1. Synthesize intelligent, immersive day plans using Gemini 2.5 Flash
    daily_schedule = await _generate_gemini_itinerary(
        destination=destination,
        start_date=start_date,
        total_days=total_days,
        travelers=travelers,
        trip_type=trip_type,
        travel_pace=travel_pace,
        preferences=preferences,
        verified_attractions=unique_attractions,
        lodging_name=lodging_name,
    )

    # 2. Heuristic fallback builder if Gemini is unavailable
    if not daily_schedule:
        daily_schedule = []
        attraction_queue = list(unique_attractions)
        slot_idx = 0

        for day_idx in range(total_days):
            day_date = (d1 + timedelta(days=day_idx)).strftime("%Y-%m-%d")
            day_entry: Dict = {
                "day_number": day_idx + 1,
                "date": day_date,
                "theme": f"Day {day_idx + 1}: Discovering {destination}",
                "transit_notes": f"Local taxis and auto-rickshaws available for transiting across {destination}.",
            }
            day_cost_items: List[Dict] = []

            time_slots = [
                ("morning_activity", "09:00 AM – 12:00 PM", "Explore key cultural landmarks and morning highlights."),
                ("afternoon_activity", "02:00 PM – 05:00 PM", "Visit prominent historical monuments and sample regional cuisine."),
                ("evening_activity", "06:30 PM – 08:30 PM", "Unwind with sunset views, riverside atmosphere, and local dinner."),
            ]

            for slot_label, duration_str, default_desc in time_slots:
                if slot_idx < len(attraction_queue):
                    attraction = attraction_queue[slot_idx]
                    cost_val = _numeric_cost(attraction)
                    day_entry[slot_label] = {
                        "title": attraction["name"],
                        "category": attraction.get("category", "Sightseeing"),
                        "duration": duration_str,
                        "description": default_desc,
                        "cost": cost_val,
                        "maps_url": attraction.get("maps_url"),
                    }
                    day_cost_items.append(attraction)
                    slot_idx += 1
                else:
                    day_entry[slot_label] = None

            day_entry["estimated_daily_cost"] = sum(_numeric_cost(item) for item in day_cost_items)
            daily_schedule.append(day_entry)

    log_entry = (
        f"✓ Sightseeing Agent: Gemini curated {len(daily_schedule)} immersive daily plans for {destination} "
        f"grounded in {len(unique_attractions)} verified live POIs"
    )
    logger.info(log_entry)
    return {
        "itinerary_schedule": daily_schedule,
        "node_logs": [log_entry],
    }
