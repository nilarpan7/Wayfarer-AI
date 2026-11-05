import pytest
from app.agents.budget_validator import budget_validator_node, route_after_budget


@pytest.mark.asyncio
async def test_budget_validator_within_budget():
    state = {
        "total_budget": 50000.0,
        "selected_transit": [{"title": "IndiGo 6E-204", "price": 8000.0}],
        "selected_lodging": [{"title": "Grand Hotel", "price": 4000.0}],
        "itinerary_schedule": [
            {"day_number": 1, "estimated_daily_cost": 1500.0},
            {"day_number": 2, "estimated_daily_cost": 1200.0},
        ],
        "start_date": "2026-11-01",
        "end_date": "2026-11-03",
        "iteration_count": 1,
    }

    result = await budget_validator_node(state)
    assert result["is_feasible"] is True
    assert len(result["rejection_reasons"]) == 0
    # 8000 (transit) + 4000 * 2 nights (lodging) + 2700 (activities) = 18700
    assert result["current_total_spend"] == 18700.0

    state["is_feasible"] = result["is_feasible"]
    route = route_after_budget(state)
    assert route == "consolidator"


@pytest.mark.asyncio
async def test_budget_validator_exceeds_budget():
    state = {
        "total_budget": 10000.0,
        "selected_transit": [{"title": "Air India AI-101", "price": 12000.0}],
        "selected_lodging": [{"title": "Luxury Resort", "price": 6000.0}],
        "itinerary_schedule": [
            {"day_number": 1, "estimated_daily_cost": 2000.0},
        ],
        "start_date": "2026-11-01",
        "end_date": "2026-11-03",
        "iteration_count": 1,
    }

    result = await budget_validator_node(state)
    assert result["is_feasible"] is False
    assert len(result["rejection_reasons"]) > 0

    state["is_feasible"] = result["is_feasible"]
    route = route_after_budget(state)
    # Under 3 retries, should route back to supervisor for re-optimization
    assert route == "supervisor"

