import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from app.agents.state import TravelPlanState
from app.config import settings
from app.services.location_resolver import resolve_location

logger = logging.getLogger(__name__)


def _fallback_parse_prompt(prompt: str, reference_date: datetime) -> Dict:
    """Heuristic fallback parser when LLM is unavailable or unparseable."""
    data: Dict = {}
    p_lower = prompt.lower()

    # Destination & Origin patterns
    to_match = re.search(r"\bto\s+([A-Za-z\s,]+?)(?:\s+(?:from|under|for|with|in|by|via|on|\$|₹|rs|inr|starting)|$)", prompt, re.IGNORECASE)
    from_match = re.search(r"\bfrom\s+([A-Za-z\s,]+?)(?:\s+(?:to|under|for|with|in|by|via|on|\$|₹|rs|inr|starting)|$)", prompt, re.IGNORECASE)
    if to_match:
        data["destination"] = to_match.group(1).strip()
    if from_match:
        data["origin"] = from_match.group(1).strip()

    # Budget pattern (INR: ₹ / Rs / INR / k, or USD: $)
    inr_match = re.search(r"(?:₹|rs\.?\s*|inr\s*)(\d[\d,]*(?:\.\d{2})?)", prompt, re.IGNORECASE)
    k_match = re.search(r"(\d+(?:\.\d+)?)\s*k\b", prompt, re.IGNORECASE)
    usd_match = re.search(r"(?:\$|usd\s*)(\d[\d,]*(?:\.\d{2})?)", prompt, re.IGNORECASE)
    generic_match = re.search(r"(?:under|within|budget\s*(?:of|for)?|around|cap\s*of)\s*(?:₹|rs\.?|inr\s*|\$)?\s*(\d[\d,]*)", prompt, re.IGNORECASE)

    if inr_match:
        try:
            data["total_budget"] = float(inr_match.group(1).replace(",", ""))
        except ValueError:
            pass
    elif k_match:
        try:
            data["total_budget"] = float(k_match.group(1)) * 1000.0
        except ValueError:
            pass
    elif usd_match:
        try:
            data["total_budget"] = float(usd_match.group(1).replace(",", ""))
        except ValueError:
            pass
    elif generic_match:
        try:
            val = float(generic_match.group(1).replace(",", ""))
            if val > 100:
                data["total_budget"] = val
        except ValueError:
            pass

    # Transit mode preference
    has_train = bool(re.search(r"\b(train|rail|railway|irctc|vande bharat|rajdhani|shatabdi|express)\b", p_lower))
    has_flight = bool(re.search(r"\b(flight|fly|plane|air|indigo|air india)\b", p_lower))
    if has_train and has_flight:
        data["transit_mode"] = "ALL"
    elif has_train:
        data["transit_mode"] = "TRAIN"
    elif has_flight:
        data["transit_mode"] = "FLIGHT"
    else:
        data["transit_mode"] = "ALL"

    # Travelers & party size pattern
    travelers = 1
    trip_type = "Solo"

    people_match = re.search(r"(?:for|with)\s+(\d+)\s*(?:people|persons|adults|travelers|guests|friends|passengers)?", prompt, re.IGNORECASE)
    explicit_people = re.search(r"\b(\d+)\s*(?:people|persons|adults|travelers|guests|friends|passengers)\b", prompt, re.IGNORECASE)

    if explicit_people:
        travelers = max(1, min(10, int(explicit_people.group(1))))
    elif people_match:
        try:
            travelers = max(1, min(10, int(people_match.group(1))))
        except ValueError:
            pass

    if re.search(r"\b(couple|honeymoon|two of us|partner|wife|husband)\b", p_lower):
        travelers = max(travelers, 2)
        trip_type = "Couple"
    elif re.search(r"\b(family|kids|children|parents)\b", p_lower):
        travelers = max(travelers, 3)
        trip_type = "Family"
    elif re.search(r"\b(friends|gang|group|colleagues|buddies)\b", p_lower):
        travelers = max(travelers, 3)
        trip_type = "Friends"
    elif re.search(r"\b(business|workcation|conference|client)\b", p_lower):
        trip_type = "Business"
    elif travelers == 2:
        trip_type = "Couple"
    elif travelers > 2:
        trip_type = "Friends"
    else:
        trip_type = "Solo"

    data["travelers"] = travelers
    data["trip_type"] = trip_type

    # Duration pattern
    days_match = re.search(r"(\d+)\s*-?\s*day", prompt, re.IGNORECASE)
    duration_days = int(days_match.group(1)) if days_match else 7

    start_dt = reference_date + timedelta(days=14)
    data["start_date"] = start_dt.strftime("%Y-%m-%d")
    data["end_date"] = (start_dt + timedelta(days=duration_days)).strftime("%Y-%m-%d")

    # Pace
    if re.search(r"\b(relaxed|slow|leisure|easy)\b", p_lower):
        data["travel_pace"] = "Relaxed"
    elif re.search(r"\b(packed|fast|intense|action)\b", p_lower):
        data["travel_pace"] = "Fast-Paced"
    else:
        data["travel_pace"] = "Balanced"

    # Preferences
    prefs = []
    tag_map = {
        "Food & Dining": ["food", "dining", "culinary", "restaurant", "eat", "biryani", "thali", "street food", "dosa"],
        "Culture & History": ["culture", "history", "historic", "temple", "shrine", "heritage", "fort", "palace", "ghat"],
        "Art & Museums": ["art", "museum", "gallery", "exhibit", "monument"],
        "Nightlife": ["nightlife", "bar", "club", "party", "pub"],
        "Nature & Outdoors": ["nature", "outdoor", "hike", "mountain", "beach", "park", "wildlife", "safari"],
        "Shopping": ["shopping", "boutique", "market", "bazaar", "mall"],
    }
    for tag, keywords in tag_map.items():
        if any(kw in p_lower for kw in keywords):
            prefs.append(tag)
    if prefs:
        data["preferences"] = prefs

    return data


async def parse_prompt_intent(prompt: str, reference_date: datetime) -> Dict:
    """Use Gemini LLM to parse natural language prompt, falling back to heuristic parsing."""
    today_str = reference_date.strftime("%Y-%m-%d")
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key":
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.1,
            )
            extraction_prompt = f"""You are the Supervisor Travel Agent for an India-focused travel platform. Extract trip parameters from the user's travel request.
User request: "{prompt}"
Today's reference date: {today_str}

Return ONLY a JSON object with these keys (do not wrap in markdown or backticks):
{{
  "origin": "string city or airport/station name, or null (e.g. 'Delhi', 'DEL', 'Mumbai')",
  "destination": "string destination city or state, or null (e.g. 'Goa', 'Jaipur')",
  "start_date": "YYYY-MM-DD or null. If relative (e.g. 'next week', 'in November'), calculate relative to today {today_str}",
  "end_date": "YYYY-MM-DD or null. If duration is given (e.g. 5 days), end_date = start_date + duration",
  "total_budget": 25000.0 (float in INR or null),
  "travelers": 2 (integer number of travelers/people, default 1),
  "trip_type": "Solo | Couple | Family | Friends | Business",
  "transit_mode": "ALL" | "FLIGHT" | "TRAIN",
  "travel_pace": "Relaxed | Balanced | Fast-Paced or null",
  "preferences": ["Food & Dining", "Culture & History", "Art & Museums", "Nightlife", "Nature & Outdoors", "Shopping"] (array of matching strings)
}}"""
            response = await llm.ainvoke(extraction_prompt)
            content = response.content.strip()
            # Remove any markdown code fences if present
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\s*", "", content)
                content = re.sub(r"\s*```$", "", content)
            parsed = json.loads(content)
            if isinstance(parsed, dict) and (parsed.get("destination") or parsed.get("origin") or parsed.get("total_budget")):
                return parsed
        except Exception as exc:
            logger.warning(f"Gemini prompt extraction failed ({exc}); using heuristic fallback.")

    return _fallback_parse_prompt(prompt, reference_date)


async def supervisor_node(state: TravelPlanState) -> Dict:
    """
    Supervisor Orchestrator Node:
    Parses natural language prompts or decomposes user constraints, resolves locations,
    and adaptively modifies parameters on re-optimization passes.
    """
    iteration = int(state.get("iteration_count", 0))
    origin = state.get("origin") or ""
    raw_dest = state.get("destination") or ""
    start_date = state.get("start_date") or ""
    end_date = state.get("end_date") or ""
    raw_budget = state.get("total_budget")
    budget = float(raw_budget) if raw_budget is not None else 0.0
    travel_pace = state.get("travel_pace") or "Balanced"
    transit_mode = str(state.get("transit_mode") or "ALL").upper()
    preferences = list(state.get("preferences") or [])
    travelers = max(1, int(state.get("travelers") or 1))
    trip_type = str(state.get("trip_type") or "Solo")
    prompt = state.get("prompt")
    data_errors: List[Dict] = []

    # If this is the initial pass and a natural-language prompt was provided, parse it
    if iteration == 0 and prompt and prompt.strip():
        reference_date = datetime.now(timezone.utc)
        parsed = await parse_prompt_intent(prompt.strip(), reference_date)
        
        if parsed.get("destination"):
            raw_dest = str(parsed["destination"]).strip()
        if parsed.get("origin"):
            origin = str(parsed["origin"]).strip()
        if parsed.get("start_date"):
            start_date = str(parsed["start_date"]).strip()
        if parsed.get("end_date"):
            end_date = str(parsed["end_date"]).strip()
        if parsed.get("total_budget"):
            try:
                parsed_budget = float(parsed["total_budget"])
                if parsed_budget > 0:
                    budget = parsed_budget
            except (ValueError, TypeError):
                pass
        if parsed.get("transit_mode"):
            transit_mode = str(parsed["transit_mode"]).upper()
        if parsed.get("travel_pace"):
            travel_pace = str(parsed["travel_pace"]).strip()
        if parsed.get("preferences") and isinstance(parsed["preferences"], list) and len(parsed["preferences"]) > 0:
            preferences = parsed["preferences"]
        if parsed.get("travelers"):
            try:
                p_travelers = int(parsed["travelers"])
                if p_travelers > 0:
                    travelers = p_travelers
            except (ValueError, TypeError):
                pass
        if parsed.get("trip_type"):
            trip_type = str(parsed["trip_type"]).strip()

    # Validate required fields — return errors instead of silently fabricating values
    if not origin:
        err = {
            "source": "supervisor",
            "code": "missing_origin",
            "message": "No origin city specified. Please provide your departure city.",
        }
        logger.error(err["message"])
        data_errors.append(err)

    if not start_date or not end_date:
        err = {
            "source": "supervisor",
            "code": "missing_dates",
            "message": "Travel dates not specified. Please provide start and end dates.",
        }
        logger.error(err["message"])
        data_errors.append(err)

    if budget <= 0:
        err = {
            "source": "supervisor",
            "code": "missing_budget",
            "message": "No valid budget specified. Please provide your travel budget.",
        }
        logger.error(err["message"])
        data_errors.append(err)

    # If any required fields are missing, abort early
    if data_errors:
        return {
            "origin": origin,
            "destination": raw_dest,
            "start_date": start_date,
            "end_date": end_date,
            "total_budget": budget,
            "travel_pace": travel_pace,
            "transit_mode": transit_mode,
            "preferences": preferences,
            "iteration_count": iteration + 1,
            "data_errors": data_errors,
            "node_logs": [f"❌ Supervisor: {e['message']}" for e in data_errors],
        }

    # Ensure destination is present
    if not raw_dest or not raw_dest.strip():
        err = {
            "source": "supervisor",
            "code": "missing_destination",
            "message": "No destination could be identified from your request. Please specify a destination.",
        }
        logger.error(err["message"])
        return {
            "origin": origin,
            "destination": raw_dest,
            "start_date": start_date,
            "end_date": end_date,
            "total_budget": budget,
            "travel_pace": travel_pace,
            "transit_mode": transit_mode,
            "preferences": preferences,
            "iteration_count": iteration + 1,
            "data_errors": [err],
            "node_logs": [f"❌ Supervisor: {err['message']}"],
        }

    # Resolve destination location
    dest_loc = await resolve_location(raw_dest)
    if not dest_loc:
        err = {
            "source": "supervisor",
            "code": "location_unresolved",
            "message": f"Could not verify destination '{raw_dest}'. Please check the city or country name.",
        }
        logger.error(err["message"])
        return {
            "origin": origin,
            "destination": raw_dest,
            "start_date": start_date,
            "end_date": end_date,
            "total_budget": budget,
            "travelers": travelers,
            "trip_type": trip_type,
            "travel_pace": travel_pace,
            "transit_mode": transit_mode,
            "preferences": preferences,
            "iteration_count": iteration + 1,
            "data_errors": [err],
            "node_logs": [f"❌ Supervisor: {err['message']}"],
        }

    dest_name = dest_loc.get("formatted_query", raw_dest)
    party_str = f"{travelers} traveler{'s' if travelers > 1 else ''} ({trip_type})"

    if iteration == 0:
        if prompt and prompt.strip():
            log_entry = (
                f"✓ Supervisor: Parsed natural prompt -> {dest_name} from {origin} ({start_date} -> {end_date}) "
                f"for {party_str}, Transit: {transit_mode}, Target Budget: INR {budget:,.2f}, Pace: {travel_pace}"
            )
        else:
            log_entry = (
                f"✓ Supervisor: Decomposed intent for {dest_name} from {origin} ({start_date} -> {end_date}) "
                f"for {party_str}, Transit: {transit_mode}, Target Budget: INR {budget:,.2f}"
            )
    else:
        if travel_pace == "Fast-Paced":
            travel_pace = "Balanced"
        elif travel_pace == "Balanced" and iteration > 1:
            travel_pace = "Relaxed"
        log_entry = (
            f"✓ Supervisor: Re-optimizing parameters [Pass #{iteration + 1}]: "
            f"Adjusted pace to '{travel_pace}', enforcing stricter budget allocations"
        )
        
    logger.info(log_entry)

    return {
        "origin": origin,
        "destination": dest_name,
        "start_date": start_date,
        "end_date": end_date,
        "total_budget": budget,
        "travelers": travelers,
        "trip_type": trip_type,
        "travel_pace": travel_pace,
        "transit_mode": transit_mode,
        "preferences": preferences,
        "iteration_count": iteration + 1,
        "node_logs": [log_entry],
        "data_errors": data_errors,
    }

