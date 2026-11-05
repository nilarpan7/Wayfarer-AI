import pytest
from app.agents.graph import create_travel_planner_graph
from app.agents.supervisor import supervisor_node


def test_create_travel_planner_graph():
    graph = create_travel_planner_graph()
    assert graph is not None
    # Verify nodes exist in compiled graph
    node_keys = list(graph.nodes.keys())
    for expected in ["supervisor", "transit_agent", "lodging_agent", "sightseeing_agent", "budget_validator", "consolidator"]:
        assert expected in node_keys


@pytest.mark.asyncio
async def test_supervisor_missing_fields_validation():
    # Test that missing required fields return data_errors instead of fabricating defaults
    state = {
        "origin": "",
        "destination": "Goa",
        "start_date": "",
        "end_date": "",
        "total_budget": 0.0,
        "iteration_count": 0,
        "prompt": "",
    }
    result = await supervisor_node(state)
    errors = result.get("data_errors", [])
    assert len(errors) >= 3
    error_codes = [e["code"] for e in errors]
    assert "missing_origin" in error_codes
    assert "missing_dates" in error_codes
    assert "missing_budget" in error_codes

