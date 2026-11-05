import logging
from typing import Dict
from datetime import datetime
from app.agents.state import TravelPlanState
from app.agents.tools.serpapi_tools import search_hotels

logger = logging.getLogger(__name__)

async def lodging_agent_node(state: TravelPlanState) -> Dict:
    """
    Accommodation Agent Node:
    Fetches stays based on proximity to transit hubs and adaptive budget caps.
    """
    destination = state["destination"]
    start_date = state["start_date"]
    end_date = state["end_date"]
    budget = float(state.get("total_budget", 25000.0))
    travelers = max(1, int(state.get("travelers") or 1))
    iteration = int(state.get("iteration_count", 0))
    
    try:
        d1 = datetime.strptime(start_date, "%Y-%m-%d")
        d2 = datetime.strptime(end_date, "%Y-%m-%d")
        total_nights = (d2 - d1).days
    except Exception as exc:
        error = {
            "source": "lodging_agent",
            "code": "invalid_dates",
            "message": f"Lodging search requires valid YYYY-MM-DD dates: {exc}",
        }
        logger.error(error["message"])
        return {
            "selected_lodging": [],
            "data_errors": [error],
            "node_logs": [f"❌ Accommodation Agent: {error['message']}"],
        }

    if total_nights <= 0:
        error = {
            "source": "lodging_agent",
            "code": "invalid_dates",
            "message": "Check-out date must be after check-in date.",
        }
        logger.error(error["message"])
        return {
            "selected_lodging": [],
            "data_errors": [error],
            "node_logs": [f"❌ Accommodation Agent: {error['message']}"],
        }
    
    # Adaptive budget allocation:
    # Check if transit options were already selected by transit_agent
    transit_options = state.get("selected_transit", [])
    transit_cost = float(transit_options[0]["price"]) if transit_options else 0.0

    # Remaining funds after transit is accounted for
    remaining_after_transit = max(0.0, budget - transit_cost)

    # Allocate lodging share of remaining funds (leaving room for dining/activities)
    if iteration > 1:
        lodging_ratio = 0.45
        lodging_budget_pool = remaining_after_transit * lodging_ratio
    else:
        lodging_ratio = 0.65
        lodging_budget_pool = max(remaining_after_transit * lodging_ratio, budget * 0.35)

    max_nightly = max(500.0, lodging_budget_pool / float(total_nights))
    
    logger.info(
        f"Lodging Agent searching stays in {destination} "
        f"(Nightly Cap: INR {max_nightly:,.2f}/nt across {total_nights} nights, Pool: INR {lodging_budget_pool:,.2f})"
    )
    
    hotels = await search_hotels(
        location=destination,
        check_in_date=start_date,
        check_out_date=end_date,
        adults=travelers,
        max_price_per_night=max_nightly
    )
    
    if not hotels:
        error = {
            "source": "lodging_agent",
            "code": "no_real_options",
            "message": f"No live lodging options were returned for {destination}.",
        }
        log_entry = f"❌ Accommodation Agent: {error['message']}"
        logger.error(log_entry)
        return {
            "selected_lodging": [],
            "data_errors": [error],
            "node_logs": [log_entry],
        }

    if iteration > 1 and hotels:
        # Prioritize absolute cheapest stay on re-optimization
        hotels.sort(key=lambda h: float(h.get("price", 0.0)))

    primary_stay = hotels[0]
    log_entry = (
        f"✓ Accommodation Agent: Discovered {len(hotels)} verified stays in {destination}. "
        f"Recommended primary: {primary_stay['title']} — INR {primary_stay['price']:,.2f}/night "
        f"(INR {primary_stay['price'] * total_nights:,.2f} total for {total_nights} nights)"
    )
    logger.info(log_entry)

    return {
        "selected_lodging": hotels,
        "node_logs": [log_entry]
    }
