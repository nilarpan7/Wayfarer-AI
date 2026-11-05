import logging
from typing import Dict, List
from app.agents.state import TravelPlanState
from app.agents.tools.amadeus_tools import search_flights
from app.agents.tools.train_tools import search_trains

logger = logging.getLogger(__name__)

async def transit_agent_node(state: TravelPlanState) -> Dict:
    """
    Transit & Logistics Agent Node:
    Queries live flight and train transit options in INR (₹) and selects the best fit for user budget.
    Supports multimodal transit: 'ALL' (both flights and trains), 'FLIGHT', and 'TRAIN'.
    """
    origin = state["origin"]
    destination = state["destination"]
    start_date = state["start_date"]
    end_date = state["end_date"]
    budget = float(state.get("total_budget", 25000.0))
    iteration = int(state.get("iteration_count", 0))
    transit_mode = str(state.get("transit_mode") or "ALL").upper()
    travelers = max(1, int(state.get("travelers") or 1))
    
    # Calculate target transit budget ceiling (35% of total budget, or tighter on re-optimization)
    if iteration > 1:
        max_transit_budget = budget * 0.30
    else:
        max_transit_budget = budget * 0.40
    
    logger.info(
        f"Transit Agent searching transit [{transit_mode}] for {travelers} traveler{'s' if travelers > 1 else ''}: "
        f"{origin} -> {destination} (Transit Cap: INR {max_transit_budget:,.2f})"
    )

    flight_options: List[Dict] = []
    train_options: List[Dict] = []

    if transit_mode in ("ALL", "FLIGHT"):
        flight_options = await search_flights(
            origin=origin,
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            adults=travelers,
            max_transit_budget=max_transit_budget
        )
        if travelers > 1 and flight_options:
            for fl in flight_options:
                if "details" in fl and isinstance(fl["details"], dict):
                    fl["details"]["passengers"] = travelers

    if transit_mode in ("ALL", "TRAIN"):
        train_options = await search_trains(
            origin=origin,
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            max_transit_budget=max_transit_budget
        )
        if travelers > 1 and train_options:
            for tr in train_options:
                single_fare = float(tr.get("price", 0.0))
                tr["price"] = round(single_fare * travelers, 2)
                if "details" in tr and isinstance(tr["details"], dict):
                    tr["details"]["passengers"] = travelers
                    tr["details"]["single_passenger_fare"] = single_fare
    
    all_options: List[Dict] = []
    if transit_mode == "ALL":
        if flight_options and train_options:
            if iteration > 1:
                # Re-optimization pass: prioritize the absolute lowest-cost transit option
                combined = flight_options + train_options
                combined.sort(key=lambda x: float(x.get("price", 0.0)))
                all_options = combined
            else:
                # Normal pass: Provide both top flight and top train so traveler has flight and train options
                all_options.append(flight_options[0])
                all_options.append(train_options[0])
                if len(train_options) > 1:
                    all_options.append(train_options[1])
                if len(flight_options) > 1:
                    all_options.append(flight_options[1])
        elif flight_options:
            all_options = flight_options
        elif train_options:
            all_options = train_options
    elif transit_mode == "FLIGHT":
        all_options = flight_options
    elif transit_mode == "TRAIN":
        all_options = train_options
    else:
        all_options = flight_options + train_options

    if iteration > 1 and all_options:
        all_options.sort(key=lambda x: float(x.get("price", 0.0)))

    if not all_options:
        error = {
            "source": "transit_agent",
            "code": "no_real_options",
            "message": f"No live transit options ({transit_mode}) were returned for {origin} -> {destination}.",
        }
        log_entry = f"❌ Transit Agent: {error['message']}"
        logger.error(log_entry)
        return {
            "selected_transit": [],
            "data_errors": [error],
            "node_logs": [log_entry],
        }

    summary_items = []
    if flight_options:
        summary_items.append(f"{len(flight_options)} flight(s)")
    if train_options:
        summary_items.append(f"{len(train_options)} train(s)")
    summary_str = " & ".join(summary_items) if summary_items else "transit options"

    primary = all_options[0]
    primary_mode = primary.get("booking_type", "TRANSIT")
    log_entry = (
        f"✓ Transit Agent: Found {summary_str}. Selected primary [{primary_mode}] "
        f"{primary['title']} — INR {primary['price']:,.2f}"
    )
    logger.info(log_entry)

    return {
        "selected_transit": all_options,
        "node_logs": [log_entry]
    }
