import logging
from langgraph.graph import StateGraph, END
from app.agents.state import TravelPlanState
from app.agents.supervisor import supervisor_node
from app.agents.transit_agent import transit_agent_node
from app.agents.lodging_agent import lodging_agent_node
from app.agents.sightseeing_agent import sightseeing_agent_node
from app.agents.budget_validator import budget_validator_node, route_after_budget
from app.agents.consolidator import consolidator_node

logger = logging.getLogger(__name__)

def create_travel_planner_graph():
    """Build and compile the LangGraph StateGraph workflow."""
    workflow = StateGraph(TravelPlanState)

    # Add Nodes
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("transit_agent", transit_agent_node)
    workflow.add_node("lodging_agent", lodging_agent_node)
    workflow.add_node("sightseeing_agent", sightseeing_agent_node)
    workflow.add_node("budget_validator", budget_validator_node)
    workflow.add_node("consolidator", consolidator_node)

    # Set Entry Point
    workflow.set_entry_point("supervisor")

    # Conditional routing after supervisor: skip pipeline if supervisor returned errors
    def route_after_supervisor(state: TravelPlanState) -> str:
        """Skip downstream agents when supervisor detected missing required fields."""
        errors = state.get("data_errors", [])
        if errors:
            return "consolidator"
        return "transit_agent"

    workflow.add_conditional_edges(
        "supervisor",
        route_after_supervisor,
        {
            "transit_agent": "transit_agent",
            "consolidator": "consolidator",
        }
    )
    workflow.add_edge("transit_agent", "lodging_agent")
    workflow.add_edge("lodging_agent", "sightseeing_agent")
    workflow.add_edge("sightseeing_agent", "budget_validator")

    # Conditional Routing from Budget Validator
    workflow.add_conditional_edges(
        "budget_validator",
        route_after_budget,
        {
            "supervisor": "supervisor",
            "consolidator": "consolidator"
        }
    )

    # Consolidator terminates workflow
    workflow.add_edge("consolidator", END)

    app_graph = workflow.compile()
    logger.info("LangGraph Travel Planner StateGraph compiled successfully.")
    return app_graph

# Expose compiled graph singleton
travel_planner_graph = create_travel_planner_graph()
