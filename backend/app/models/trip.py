from beanie import Document, Indexed
from pydantic import Field
from typing import List, Dict, Optional
from datetime import datetime, timezone

class Trip(Document):
    user_id: Indexed(str)
    origin: str
    destination: str
    start_date: str
    end_date: str
    total_budget: float
    travel_pace: str = "Relaxed"
    transit_mode: str = "ALL"  # ALL, FLIGHT, TRAIN
    preferences: List[str] = Field(default_factory=list)
    prompt: Optional[str] = None
    travelers: int = 1
    trip_type: str = "Solo"
    
    status: str = "GENERATING"  # GENERATING, PLANNED, BUDGET_WARNING, FAILED
    
    # LangGraph Artifacts
    transit_details: List[Dict] = Field(default_factory=list)
    lodging_details: List[Dict] = Field(default_factory=list)
    daily_itinerary: List[Dict] = Field(default_factory=list)
    total_estimated_cost: float = 0.0
    
    # Direct Booking Overrides & Confirmed Bookings
    confirmed_bookings: List[Dict] = Field(default_factory=list)
    node_logs: List[str] = Field(default_factory=list)
    data_errors: List[Dict] = Field(default_factory=list)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "trips"
