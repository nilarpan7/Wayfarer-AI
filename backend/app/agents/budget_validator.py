import logging
from typing import Dict
from datetime import datetime
from app.agents.state import TravelPlanState

logger = logging.getLogger(__name__)

async def budget_validator_node(state: TravelPlanState) -> Dict:
    """
    Budget & Constraint Agent (Validator):
    Performs rigorous financial control (Total Spend ≤ User Budget).
    """
    user_budget = float(state.get("total_budget", 25000.0))
    travelers = max(1, int(state.get("travelers") or 1))
    transit_options = state.get("selected_transit", [])
    lodging_options = state.get("selected_lodging", [])
    daily_schedule = state.get("itinerary_schedule", [])
    start_date = state.get("start_date", "")
    end_date = state.get("end_date", "")
    iteration = int(state.get("iteration_count", 1))
    
    try:
        d1 = datetime.strptime(start_date, "%Y-%m-%d")
        d2 = datetime.strptime(end_date, "%Y-%m-%d")
        total_nights = max(1, (d2 - d1).days)
    except Exception:
        total_nights = max(1, len(daily_schedule))
    
    transit_cost = float(transit_options[0]["price"]) if transit_options else 0.0
    lodging_nightly = float(lodging_options[0]["price"]) if lodging_options else 0.0
    lodging_total = lodging_nightly * total_nights if lodging_options else 0.0
    activities_total = sum(float(day.get("estimated_daily_cost") or 0.0) for day in daily_schedule)
    
    total_spend = transit_cost + lodging_total + activities_total
    is_budget_exceeded = total_spend > user_budget
    rejection_reasons = []

    breakdown_items = []
    if transit_options:
        breakdown_items.append(f"Transit INR {transit_cost:,.2f}")
    else:
        breakdown_items.append("Transit INR 0.00 (none selected)")
    if lodging_options:
        breakdown_items.append(f"Lodging INR {lodging_total:,.2f} ({total_nights} nights @ INR {lodging_nightly:,.2f}/nt)")
    else:
        breakdown_items.append("Lodging INR 0.00 (none selected)")
    breakdown_items.append(f"Activities INR {activities_total:,.2f}")
    breakdown_str = " + ".join(breakdown_items)
    
    if is_budget_exceeded:
        excess = total_spend - user_budget
        rejection_reasons.append(
            f"Estimated spend (INR {total_spend:,.2f}) exceeds requested budget (INR {user_budget:,.2f}) by INR {excess:,.2f}. "
            f"Breakdown: {breakdown_str}."
        )
    
    is_feasible = not is_budget_exceeded
    per_person_str = f" (~INR {total_spend/travelers:,.2f}/person for {travelers} travelers)" if travelers > 1 else ""
    
    if is_feasible:
        log_entry = f"✓ Budget Guardian: Total spend INR {total_spend:,.2f}{per_person_str} / INR {user_budget:,.2f} [PASSED ✓ — Within Budget]"
    elif iteration < 3:
        log_entry = f"⚠️ Budget Guardian: Total spend INR {total_spend:,.2f}{per_person_str} / INR {user_budget:,.2f} [EXCEEDED by INR {total_spend - user_budget:,.2f}] — Triggering re-optimization pass #{iteration + 1}..."
    else:
        log_entry = f"❌ Budget Guardian: Budget limit cannot be satisfied after 3 passes. Minimum spend is INR {total_spend:,.2f}{per_person_str} (exceeds INR {user_budget:,.2f} budget). Flagging plan with BUDGET_WARNING."
        
    logger.info(log_entry)

    return {
        "current_total_spend": round(total_spend, 2),
        "is_feasible": is_feasible,
        "rejection_reasons": rejection_reasons,
        "node_logs": [log_entry]
    }

def route_after_budget(state: TravelPlanState) -> str:
    """Conditional Edge router function for LangGraph StateGraph."""
    is_feasible = state.get("is_feasible", True)
    iteration = state.get("iteration_count", 1)
    
    if is_feasible:
        return "consolidator"
    elif iteration < 3:
        return "supervisor"
    else:
        # Max retries exhausted, proceed to consolidator to package best-effort plan with explicit warning
        return "consolidator"
