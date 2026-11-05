import pytest
from app.services.location_resolver import resolve_location, suggest_locations


@pytest.mark.asyncio
async def test_resolve_known_location_delhi():
    loc = await resolve_location("New Delhi")
    assert loc is not None
    assert loc["airport_code"] == "DEL"
    assert loc["country"] == "India"
    assert "lat" in loc and "lon" in loc


@pytest.mark.asyncio
async def test_resolve_known_location_goa():
    loc = await resolve_location("Goa")
    assert loc is not None
    assert loc["airport_code"] == "GOI"
    assert loc["country"] == "India"


@pytest.mark.asyncio
async def test_resolve_unknown_location_fallback():
    # An unknown location that's not in the static directory will attempt OSRM/nominatim or return empty if offline
    loc = await resolve_location("xyznonexistentcity12345")
    # Should safely return falsy (empty dict or None) without throwing an unhandled exception
    assert not loc


def test_suggest_locations_empty_query():
    suggestions = suggest_locations("")
    assert len(suggestions) > 0
    # Should contain popular hubs like Delhi, Mumbai
    cities = [s["city"] for s in suggestions]
    assert any("Delhi" in c for c in cities)


def test_suggest_locations_by_code():
    suggestions = suggest_locations("DEL")
    assert len(suggestions) > 0
    assert any(s.get("airport_code") == "DEL" for s in suggestions)


def test_suggest_locations_by_name():
    suggestions = suggest_locations("Jaipur")
    assert len(suggestions) > 0
    assert any("Jaipur" in s["city"] for s in suggestions)

