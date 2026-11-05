import logging
from typing import Dict
from app.agents.state import TravelPlanState
from app.services.location_resolver import resolve_location

logger = logging.getLogger(__name__)

async def consolidator_node(state: TravelPlanState) -> Dict:
    """
    Consolidator Node:
    Aggregates final transit options, hotel options, daily schedule, and sets feasibility status.
    """
    raw_dest = state["destination"]
    total_spend = state.get("current_total_spend", 0.0)
    user_budget = state.get("total_budget", 0.0)
    is_feasible = state.get("is_feasible", True)
    
    loc_info = await resolve_location(raw_dest)
    dest_name = loc_info.get("formatted_query", raw_dest)
    
    if is_feasible:
        log_entry = f"✓ Consolidator: Finalized travel plan for {dest_name} — Total INR {total_spend:,.2f} (Savings: INR {max(0.0, user_budget - total_spend):,.2f})"
    else:
        log_entry = f"⚠️ Consolidator: Finalized Best-Effort plan for {dest_name} — Total INR {total_spend:,.2f} exceeds target INR {user_budget:,.2f}. Review recommendations."
        
    logger.info(log_entry)

    return {
        "node_logs": [log_entry]
    }
