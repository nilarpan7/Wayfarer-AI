from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class TripCreate(BaseModel):
    origin: Optional[str] = ""
    destination: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    total_budget: Optional[float] = 25000.0
    travel_pace: str = "Relaxed"
    transit_mode: Optional[str] = "ALL"  # "ALL", "FLIGHT", "TRAIN"
    preferences: List[str] = Field(default_factory=list)
    prompt: Optional[str] = None  # Natural language prompt if used
    travelers: int = 1
    trip_type: Optional[str] = "Solo"  # "Solo", "Couple", "Family", "Friends", "Business"

class BookingOptionSchema(BaseModel):
    booking_type: str  # "FLIGHT", "TRAIN", "HOTEL", "EVENT"
    provider: str
    title: str
    price: float
    currency: str = "INR"
    booking_url: str
    details: Optional[Dict] = None

class ItineraryDaySchema(BaseModel):
    day_number: int
    date: str
    morning_activity: Dict
    afternoon_activity: Dict
    evening_activity: Dict
    transit_notes: str = ""
    estimated_daily_cost: float = 0.0

class CustomBookingRequest(BaseModel):
    booking_type: str  # FLIGHT, HOTEL, ACTIVITY
    provider: str
    title: str
    price: float
    currency: str = "INR"
    booking_url: str

class TripOut(BaseModel):
    id: str
    user_id: str
    origin: str
    destination: str
    start_date: str
    end_date: str
    total_budget: float
    travel_pace: str
    transit_mode: Optional[str] = "ALL"
    preferences: List[str]
    prompt: Optional[str] = None
    travelers: int = 1
    trip_type: Optional[str] = "Solo"
    status: str
    transit_details: List[Dict] = Field(default_factory=list)
    lodging_details: List[Dict] = Field(default_factory=list)
    daily_itinerary: List[Dict] = Field(default_factory=list)
    total_estimated_cost: float = 0.0
    confirmed_bookings: List[Dict] = Field(default_factory=list)
    node_logs: List[str] = Field(default_factory=list)
    created_at: datetime
    data_errors: List[Dict] = Field(default_factory=list)
