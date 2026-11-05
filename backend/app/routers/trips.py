import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks, Request
from fastapi.responses import StreamingResponse, Response
from beanie import PydanticObjectId

from app.schemas.trip import TripCreate, TripOut, CustomBookingRequest
from app.models.trip import Trip
from app.models.user import User
from app.dependencies import get_current_user
from app.agents.graph import travel_planner_graph

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trips", tags=["Trips"])

TERMINAL_TRIP_STATUSES = {"PLANNED", "BUDGET_WARNING", "FAILED"}

async def safe_get_trip(trip_id: str) -> Optional[Trip]:
    """Safely retrieves a Trip document by ID without raising PydanticObjectId validation errors for invalid string IDs."""
    if not PydanticObjectId.is_valid(trip_id):
        return None
    try:
        return await Trip.get(trip_id)
    except Exception as e:
        logger.warning(f"Failed to fetch trip {trip_id}: {e}")
        return None


async def get_owned_trip(trip_id: str, current_user: User) -> Trip:
    """Return a trip owned by the authenticated user without exposing ownership."""
    trip = await safe_get_trip(trip_id)
    if not trip or trip.user_id != str(current_user.id):
        # Treat another user's trip as missing to avoid leaking its existence.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


def _trip_out(trip: Trip) -> TripOut:
    return TripOut(
        id=str(trip.id),
        user_id=trip.user_id,
        origin=trip.origin,
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        total_budget=trip.total_budget,
        travel_pace=trip.travel_pace,
        preferences=trip.preferences,
        transit_mode=getattr(trip, "transit_mode", "ALL"),
        prompt=getattr(trip, "prompt", None),
        travelers=getattr(trip, "travelers", 1) or 1,
        trip_type=getattr(trip, "trip_type", "Solo") or "Solo",
        status=trip.status,
        transit_details=trip.transit_details,
        lodging_details=trip.lodging_details,
        daily_itinerary=trip.daily_itinerary,
        total_estimated_cost=trip.total_estimated_cost,
        confirmed_bookings=trip.confirmed_bookings,
        node_logs=trip.node_logs,
        created_at=trip.created_at,
        data_errors=getattr(trip, "data_errors", []),
    )


def _append_unique_errors(existing: List[dict], new_errors: List[dict]) -> None:
    for error in new_errors:
        if error not in existing:
            existing.append(error)

async def run_agent_workflow_in_background(trip_id: str, initial_state: dict):
    """Executes the LangGraph StateGraph workflow step by step and updates MongoDB."""
    trip: Optional[Trip] = None
    try:
        trip = await safe_get_trip(trip_id)
        if not trip:
            return

        is_feasible = True
        data_errors = list(getattr(trip, "data_errors", []))
        data_error_seen = bool(data_errors)
        async for event in travel_planner_graph.astream(initial_state):
            for node_name, node_state in event.items():
                if not isinstance(node_state, dict):
                    continue

                new_logs = node_state.get("node_logs", [])
                if new_logs:
                    trip.node_logs.extend(new_logs)

                node_errors = node_state.get("data_errors", []) or []
                if node_errors:
                    _append_unique_errors(data_errors, node_errors)
                    data_error_seen = True
                    for error in node_errors:
                        if isinstance(error, dict):
                            error_message = error.get("message", str(error))
                        else:
                            error_message = str(error)
                        visible_log = f"❌ {node_name}: {error_message}"
                        if not any(error_message in log for log in trip.node_logs):
                            trip.node_logs.append(visible_log)
                
                if "destination" in node_state and node_state["destination"]:
                    trip.destination = node_state["destination"]
                if "origin" in node_state and node_state["origin"]:
                    trip.origin = node_state["origin"]
                if "start_date" in node_state and node_state["start_date"]:
                    trip.start_date = node_state["start_date"]
                if "end_date" in node_state and node_state["end_date"]:
                    trip.end_date = node_state["end_date"]
                if "total_budget" in node_state and node_state["total_budget"]:
                    trip.total_budget = float(node_state["total_budget"])
                if "travel_pace" in node_state and node_state["travel_pace"]:
                    trip.travel_pace = node_state["travel_pace"]
                if "transit_mode" in node_state and node_state["transit_mode"]:
                    trip.transit_mode = node_state["transit_mode"]
                if "travelers" in node_state and node_state["travelers"]:
                    trip.travelers = int(node_state["travelers"])
                if "trip_type" in node_state and node_state["trip_type"]:
                    trip.trip_type = str(node_state["trip_type"])
                if "preferences" in node_state and node_state["preferences"] is not None:
                    trip.preferences = node_state["preferences"]

                if "selected_transit" in node_state:
                    trip.transit_details = node_state["selected_transit"]
                if "selected_lodging" in node_state:
                    trip.lodging_details = node_state["selected_lodging"]
                if "itinerary_schedule" in node_state:
                    trip.daily_itinerary = node_state["itinerary_schedule"]
                if "current_total_spend" in node_state and not data_error_seen:
                    trip.total_estimated_cost = node_state["current_total_spend"]
                if "is_feasible" in node_state and not data_error_seen:
                    is_feasible = node_state["is_feasible"]

                trip.data_errors = data_errors
                await trip.save()

                # Do not allow downstream fallback calculations to turn a
                # live-data failure into a successful-looking plan.
                if data_error_seen:
                    break
                await asyncio.sleep(0.5)

            if data_error_seen:
                break

        if data_error_seen:
            trip.status = "FAILED"
        elif not is_feasible or (trip.total_estimated_cost > trip.total_budget * 1.05):
            trip.status = "BUDGET_WARNING"
        else:
            trip.status = "PLANNED"

        trip.data_errors = data_errors
        await trip.save()
        logger.info(f"Trip {trip_id} state machine finished with status: {trip.status}.")
    except Exception as e:
        logger.error(f"Error in LangGraph execution for trip {trip_id}: {e}")
        if trip is None:
            trip = await safe_get_trip(trip_id)
        if trip:
            trip.status = "FAILED"
            failure = {
                "source": "workflow",
                "code": "execution_failed",
                "message": str(e),
            }
            trip.data_errors = list(getattr(trip, "data_errors", []))
            _append_unique_errors(trip.data_errors, [failure])
            trip.node_logs.append(f"❌ Workflow failure: {str(e)}")
            await trip.save()

@router.post("/create", response_model=TripOut)
async def create_trip(
    trip_in: TripCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    try:
        initial_log = (
            f"✓ Supervisor: Received natural trip request: '{trip_in.prompt}'"
            if trip_in.prompt
            else f"✓ Supervisor: Received trip plan request for {trip_in.destination}"
        )
        travelers_val = max(1, getattr(trip_in, "travelers", 1) or 1)
        trip_type_val = getattr(trip_in, "trip_type", "Solo") or "Solo"

        trip = Trip(
            user_id=str(current_user.id),
            origin=trip_in.origin or "",
            destination=trip_in.destination or "",
            start_date=trip_in.start_date or "",
            end_date=trip_in.end_date or "",
            total_budget=trip_in.total_budget or 25000.0,
            travel_pace=trip_in.travel_pace or "Relaxed",
            transit_mode=trip_in.transit_mode or "ALL",
            preferences=trip_in.preferences or [],
            prompt=trip_in.prompt,
            travelers=travelers_val,
            trip_type=trip_type_val,
            status="GENERATING",
            node_logs=[initial_log],
            data_errors=[],
        )
        
        await trip.insert()

        initial_state = {
            "trip_id": str(trip.id),
            "user_id": str(current_user.id),
            "origin": trip_in.origin,
            "destination": trip_in.destination,
            "start_date": trip_in.start_date,
            "end_date": trip_in.end_date,
            "total_budget": trip_in.total_budget or 25000.0,
            "travel_pace": trip_in.travel_pace,
            "transit_mode": trip_in.transit_mode or "ALL",
            "preferences": trip_in.preferences,
            "prompt": trip_in.prompt,
            "travelers": travelers_val,
            "trip_type": trip_type_val,
            "selected_transit": [],
            "selected_lodging": [],
            "itinerary_schedule": [],
            "current_total_spend": 0.0,
            "is_feasible": True,
            "rejection_reasons": [],
            "iteration_count": 0,
            "node_logs": [f"✓ Supervisor: Received request for {trip_in.destination}"],
            "data_errors": [],
        }

        background_tasks.add_task(run_agent_workflow_in_background, str(trip.id), initial_state)

        return _trip_out(trip)
    except Exception as e:
        logger.error(f"Error creating trip: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{trip_id}/stream")
async def stream_trip_execution(
    trip_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Server-Sent Events (SSE) streaming endpoint delivering real-time agent execution logs."""
    await get_owned_trip(trip_id, current_user)

    async def event_generator():
        last_log_count = 0
        while True:
            if await request.is_disconnected():
                break
                
            try:
                trip = await safe_get_trip(trip_id)
                if not trip or trip.user_id != str(current_user.id):
                    # The initial lookup already enforced ownership. If the
                    # document disappears or changes owner while streaming,
                    # close without exposing another user's data.
                    break

                logs = trip.node_logs
                if len(logs) > last_log_count:
                    new_logs = logs[last_log_count:]
                    last_log_count = len(logs)
                    payload = {
                        "status": trip.status,
                        "new_logs": new_logs,
                        "transit": trip.transit_details,
                        "lodging": trip.lodging_details,
                        "itinerary": trip.daily_itinerary,
                        "total_cost": trip.total_estimated_cost,
                        "travelers": getattr(trip, "travelers", 1) or 1,
                        "trip_type": getattr(trip, "trip_type", "Solo") or "Solo",
                        "data_errors": getattr(trip, "data_errors", []),
                    }
                    yield f"data: {json.dumps(payload)}\n\n"

                if trip.status in TERMINAL_TRIP_STATUSES:
                    yield f"data: {json.dumps({'status': trip.status, 'finished': True, 'data_errors': getattr(trip, 'data_errors', [])})}\n\n"
                    break
            except Exception as e:
                logger.error(f"Error streaming SSE for trip {trip_id}: {e}")
                break
                
            await asyncio.sleep(1.0)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(trip_id: str, current_user: User = Depends(get_current_user)):
    try:
        trip = await get_owned_trip(trip_id, current_user)
        return _trip_out(trip)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[TripOut])
async def list_trips(current_user: User = Depends(get_current_user)):
    try:
        trips = await Trip.find(Trip.user_id == str(current_user.id)).sort("-created_at").to_list()
        return [
            _trip_out(t)
            for t in trips
        ]
    except Exception:
        return []

@router.post("/{trip_id}/custom-booking")
async def add_custom_booking(
    trip_id: str,
    booking_req: CustomBookingRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        trip = await get_owned_trip(trip_id, current_user)
        
        new_booking = {
            "booking_type": booking_req.booking_type,
            "provider": booking_req.provider,
            "title": booking_req.title,
            "price": booking_req.price,
            "currency": booking_req.currency,
            "booking_url": booking_req.booking_url,
        }
        trip.confirmed_bookings.append(new_booking)
        await trip.save()
        return {"status": "success", "confirmed_bookings": trip.confirmed_bookings}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{trip_id}/export/pdf")
async def export_trip_pdf(
    trip_id: str,
    current_user: User = Depends(get_current_user),
):
    """Generates a complete, multi-page formatted PDF itinerary document."""
    trip = await get_owned_trip(trip_id, current_user)
    try:
        import io
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
            HRFlowable,
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        dest = trip.destination or "Destination"
        filename_dest = "".join(
            character if character.isalnum() or character in " -_" else "_"
            for character in dest
        ).strip() or "Travel_Plan"

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#1e1b4b"),
            fontName="Helvetica-Bold",
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#4b5563"),
            fontName="Helvetica",
        )
        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#312e81"),
            fontName="Helvetica-Bold",
            spaceBefore=12,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#1f2937"),
        )
        bold_body = ParagraphStyle(
            "BoldBody",
            parent=body_style,
            fontName="Helvetica-Bold",
        )

        story = []

        # Header Banner
        story.append(Paragraph("WAYFARER AI &mdash; Autonomous Travel Itinerary", title_style))
        story.append(Spacer(1, 4))
        story.append(
            Paragraph(
                f"Generated on {trip.created_at.strftime('%B %d, %Y')} | Multi-Agent Swarm Intelligence",
                subtitle_style,
            )
        )
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4f46e5"), spaceAfter=12))

        travelers_count = max(1, getattr(trip, "travelers", 1) or 1)
        trip_type_str = getattr(trip, "trip_type", "Solo") or "Solo"
        budget_per_p = trip.total_budget / travelers_count
        spend_per_p = trip.total_estimated_cost / travelers_count

        # Overview Table
        summary_data = [
            [
                Paragraph("<b>Destination:</b>", bold_body),
                Paragraph(dest, body_style),
                Paragraph("<b>Origin:</b>", bold_body),
                Paragraph(trip.origin or "—", body_style),
            ],
            [
                Paragraph("<b>Travel Dates:</b>", bold_body),
                Paragraph(f"{trip.start_date} to {trip.end_date}", body_style),
                Paragraph("<b>Party Size:</b>", bold_body),
                Paragraph(f"{travelers_count} Traveler{'s' if travelers_count > 1 else ''} ({trip_type_str})", body_style),
            ],
            [
                Paragraph("<b>Allocated Budget:</b>", bold_body),
                Paragraph(f"INR {trip.total_budget:,.2f}" + (f" (INR {budget_per_p:,.2f}/p)" if travelers_count > 1 else ""), body_style),
                Paragraph("<b>Estimated Spend:</b>", bold_body),
                Paragraph(f"INR {trip.total_estimated_cost:,.2f}" + (f" (INR {spend_per_p:,.2f}/p)" if travelers_count > 1 else ""), body_style),
            ],
        ]
        summary_table = Table(summary_data, colWidths=[110, 155, 110, 155])
        summary_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        story.append(summary_table)
        story.append(Spacer(1, 14))

        # Transit Details
        if trip.transit_details:
            story.append(Paragraph("Transit & Transport Options", section_heading))
            transit_rows = [
                [
                    Paragraph("<b>Mode</b>", bold_body),
                    Paragraph("<b>Details / Carrier</b>", bold_body),
                    Paragraph("<b>Price (INR)</b>", bold_body),
                ]
            ]
            for t in trip.transit_details:
                b_type = t.get("booking_type", "TRANSIT")
                title = t.get("title") or t.get("provider") or "Transit option"
                price_val = float(t.get("price") or 0.0)
                transit_rows.append([
                    Paragraph(f"[{b_type}]", body_style),
                    Paragraph(title, body_style),
                    Paragraph(f"₹ {price_val:,.2f}", body_style),
                ])
            transit_table = Table(transit_rows, colWidths=[80, 340, 110])
            transit_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e7ff")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#c7d2fe")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ])
            )
            story.append(transit_table)
            story.append(Spacer(1, 12))

        # Lodging Details
        if trip.lodging_details:
            story.append(Paragraph("Accommodations & Stays", section_heading))
            hotel_rows = [
                [
                    Paragraph("<b>Hotel / Stay</b>", bold_body),
                    Paragraph("<b>Location</b>", bold_body),
                    Paragraph("<b>Nightly Rate</b>", bold_body),
                ]
            ]
            for h in trip.lodging_details:
                h_name = h.get("title") or h.get("provider") or "Hotel stay"
                h_loc = h.get("details", {}).get("location") or dest
                rate = float(h.get("price") or 0.0)
                hotel_rows.append([
                    Paragraph(h_name, body_style),
                    Paragraph(h_loc, body_style),
                    Paragraph(f"₹ {rate:,.2f} / nt", body_style),
                ])
            hotel_table = Table(hotel_rows, colWidths=[260, 160, 110])
            hotel_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3e8ff")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e9d5ff")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ])
            )
            story.append(hotel_table)
            story.append(Spacer(1, 12))

        # Full Daily Itinerary
        if trip.daily_itinerary:
            story.append(Paragraph("Daily Itinerary & POI Exploration", section_heading))
            for day in trip.daily_itinerary:
                day_num = day.get("day_number", 1)
                day_date = day.get("date", "")
                day_cost = float(day.get("estimated_daily_cost") or 0.0)

                m_act = day.get("morning_activity") or {}
                a_act = day.get("afternoon_activity") or {}
                e_act = day.get("evening_activity") or {}

                m_title = m_act.get("title") if isinstance(m_act, dict) else str(m_act)
                a_title = a_act.get("title") if isinstance(a_act, dict) else str(a_act)
                e_title = e_act.get("title") if isinstance(e_act, dict) else str(e_act)

                day_header = [
                    [
                        Paragraph(f"<b>Day {day_num} &mdash; {day_date}</b>", bold_body),
                        Paragraph(f"Estimated Activities: ₹ {day_cost:,.2f}", bold_body),
                    ]
                ]
                day_head_table = Table(day_header, colWidths=[380, 150])
                day_head_table.setStyle(
                    TableStyle([
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
                        ("LINEBELOW", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("LEFTPADDING", (0, 0), (-1, -1), 6),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ])
                )
                story.append(day_head_table)

                day_items = []
                if m_title:
                    day_items.append([Paragraph("Morning:", bold_body), Paragraph(m_title, body_style)])
                if a_title:
                    day_items.append([Paragraph("Afternoon:", bold_body), Paragraph(a_title, body_style)])
                if e_title:
                    day_items.append([Paragraph("Evening:", bold_body), Paragraph(e_title, body_style)])

                if day_items:
                    day_schedule_table = Table(day_items, colWidths=[90, 440])
                    day_schedule_table.setStyle(
                        TableStyle([
                            ("TOPPADDING", (0, 0), (-1, -1), 3),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                            ("LEFTPADDING", (0, 0), (-1, -1), 8),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                        ])
                    )
                    story.append(day_schedule_table)
                story.append(Spacer(1, 6))

        # Footer
        story.append(Spacer(1, 16))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=8))
        story.append(
            Paragraph(
                "Wayfarer AI &bull; Autonomous Multi-Agent Travel Engine &bull; Real-Time Live Data",
                ParagraphStyle("Footer", parent=subtitle_style, alignment=1),
            )
        )

        doc.build(story)
        buffer.seek(0)
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Wayfarer_{filename_dest}.pdf"},
        )
    except Exception as e:
        logger.exception(f"PDF export error for trip {trip_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to export trip as PDF.",
        )


@router.get("/{trip_id}/export/calendar")
async def export_trip_calendar(
    trip_id: str,
    current_user: User = Depends(get_current_user),
):
    """Generates an RFC 5545 .ics iCalendar file for importing trip into Apple/Google Calendar."""
    trip = await get_owned_trip(trip_id, current_user)
    try:
        dest = trip.destination or "Destination"
        filename = "".join(c if c.isalnum() or c in "-_" else "_" for c in dest).strip() or "Trip"

        t_count = max(1, getattr(trip, "travelers", 1) or 1)
        cal_title = f"Wayfarer Trip - {dest}" + (f" ({t_count} Travelers)" if t_count > 1 else "")
        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Wayfarer AI//Autonomous Travel Planner//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            f"X-WR-CALNAME:{cal_title}",
            "X-WR-TIMEZONE:Asia/Kolkata",
        ]

        now_utc = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

        for day in trip.daily_itinerary or []:
            day_date = day.get("date")
            if not day_date:
                continue
            clean_date = day_date.replace("-", "")
            day_num = day.get("day_number", 1)

            slots = [
                ("Morning", day.get("morning_activity"), "093000", "123000"),
                ("Afternoon", day.get("afternoon_activity"), "140000", "170000"),
                ("Evening", day.get("evening_activity"), "183000", "213000"),
            ]

            for slot_name, act, t_start, t_end in slots:
                if not act or not isinstance(act, dict):
                    continue
                title = act.get("title")
                if not title:
                    continue

                category = act.get("category") or "Sightseeing"
                maps_url = act.get("maps_url") or ""
                cost = act.get("cost")
                cost_str = f"Estimated Cost: INR {cost}" if cost else ""
                desc = f"{category} - {cost_str}\\n{maps_url}".strip()
                uid = f"wayfarer-{trip.id}-d{day_num}-{slot_name.lower()}@wayfarer.ai"

                lines.extend([
                    "BEGIN:VEVENT",
                    f"UID:{uid}",
                    f"DTSTAMP:{now_utc}",
                    f"DTSTART:{clean_date}T{t_start}",
                    f"DTEND:{clean_date}T{t_end}",
                    f"SUMMARY:Day {day_num} {slot_name}: {title}",
                    f"DESCRIPTION:{desc}",
                    f"LOCATION:{dest}",
                    "STATUS:CONFIRMED",
                    "END:VEVENT",
                ])

        lines.append("END:VCALENDAR")
        ics_content = "\r\n".join(lines)

        return Response(
            content=ics_content,
            media_type="text/calendar",
            headers={"Content-Disposition": f"attachment; filename=Wayfarer_{filename}.ics"},
        )
    except Exception as e:
        logger.exception(f"Calendar export error for trip {trip_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to export calendar file.",
        )
