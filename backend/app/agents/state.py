from typing import TypedDict, Annotated, List, Dict, Optional
import operator

class TravelPlanState(TypedDict):
    trip_id: str
    user_id: str
    origin: str
    destination: str
    start_date: str
    end_date: str
    total_budget: float
    travel_pace: str
    preferences: List[str]
    prompt: Optional[str]
    transit_mode: Optional[str]  # "ALL", "FLIGHT", "TRAIN"
    travelers: int  # Number of people traveling (1-10)
    trip_type: Optional[str]  # "Solo", "Couple", "Family", "Friends", "Business"
    
    # Domain Agent Artifacts
    selected_transit: List[Dict]
    selected_lodging: List[Dict]
    itinerary_schedule: List[Dict]
    
    # Validation & Financial Control
    current_total_spend: float
    is_feasible: bool
    rejection_reasons: List[str]
    iteration_count: int
    
    # SSE Stream Logs
    node_logs: Annotated[List[str], operator.add]

    # Structured real-data availability and provider errors
    data_errors: Annotated[List[Dict], operator.add]
