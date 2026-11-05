from datetime import datetime, timezone
import pytest
from app.agents.supervisor import _fallback_parse_prompt


def test_fallback_parse_prompt_delhi_to_goa():
    ref_date = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    prompt = "Plan a 5-day trip from New Delhi to Goa under ₹30,000 with relaxed pace"
    parsed = _fallback_parse_prompt(prompt, ref_date)

    assert parsed.get("destination") == "Goa"
    assert parsed.get("origin") == "New Delhi"
    assert parsed.get("total_budget") == 30000.0
    assert parsed.get("travel_pace") == "Relaxed"
    assert parsed.get("start_date") == "2026-11-15"
    assert parsed.get("end_date") == "2026-11-20"


def test_fallback_parse_prompt_train_mode():
    ref_date = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    prompt = "Trip to Jaipur from Mumbai by train under 15k"
    parsed = _fallback_parse_prompt(prompt, ref_date)

    assert parsed.get("destination") == "Jaipur"
    assert parsed.get("origin") == "Mumbai"
    assert parsed.get("transit_mode") == "TRAIN"
    assert parsed.get("total_budget") == 15000.0


def test_fallback_parse_prompt_flight_and_food():
    ref_date = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    prompt = "Fly to Kochi from Bangalore for culinary food and dining experience"
    parsed = _fallback_parse_prompt(prompt, ref_date)

    assert parsed.get("destination") == "Kochi"
    assert parsed.get("origin") == "Bangalore"
    assert parsed.get("transit_mode") == "FLIGHT"
    assert "Food & Dining" in parsed.get("preferences", [])


def test_fallback_parse_prompt_party_size_couple():
    ref_date = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    prompt = "Romantic honeymoon trip for 2 to Goa with my partner under 50k"
    parsed = _fallback_parse_prompt(prompt, ref_date)

    assert parsed.get("destination") == "Goa"
    assert parsed.get("travelers") == 2
    assert parsed.get("trip_type") == "Couple"
    assert parsed.get("total_budget") == 50000.0


def test_fallback_parse_prompt_party_size_family():
    ref_date = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    prompt = "Family vacation with kids for 4 people to Jaipur under 60000"
    parsed = _fallback_parse_prompt(prompt, ref_date)

    assert parsed.get("destination") == "Jaipur"
    assert parsed.get("travelers") == 4
    assert parsed.get("trip_type") == "Family"
    assert parsed.get("total_budget") == 60000.0


def test_fallback_parse_prompt_party_size_solo_default():
    ref_date = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    prompt = "Solo backpacking trip to Manali under 20k"
    parsed = _fallback_parse_prompt(prompt, ref_date)

    assert parsed.get("destination") == "Manali"
    assert parsed.get("travelers") == 1
    assert parsed.get("trip_type") == "Solo"

