"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { SwarmTelemetryConsole } from "@/components/telemetry/swarm-telemetry-console";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plane,
  Train,
  Hotel,
  Calendar,
  Download,
  ExternalLink,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Plus,
  Share2,
  Check,
  Sparkles,
  AlertTriangle,
  MapPin,
  Utensils,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Wallet,
  Info,
  ChefHat,
  Landmark,
  Lightbulb,
  ShieldCheck,
  TrainFront,
  Users,
  Zap,
} from "lucide-react";

interface ActivityDetail {
  title?: string;
  category?: string;
  description?: string;
  cost?: number | string | null;
  duration?: string | null;
  maps_url?: string | null;
}

interface DailyScheduleItem {
  day_number?: number;
  date?: string;
  theme?: string | null;
  morning_activity?: ActivityDetail | null;
  afternoon_activity?: ActivityDetail | null;
  evening_activity?: ActivityDetail | null;
  transit_notes?: string | null;
  estimated_daily_cost?: number | null;
}

interface TransitDetailItem {
  booking_type?: string;
  provider?: string;
  title?: string;
  price?: number;
  currency?: string;
  booking_url?: string;
  details?: {
    transit_mode?: string;
    airline?: string;
    flight_number?: string;
    departure_airport?: string;
    arrival_airport?: string;
    departure_date?: string;
    return_date?: string;
    train_number?: string;
    train_name?: string;
    class_type?: string;
    departure_station?: string;
    arrival_station?: string;
    duration?: string;
    departure_time?: string;
    arrival_time?: string;
  };
}

interface LodgingDetailItem {
  booking_type?: string;
  provider?: string;
  title?: string;
  price?: number;
  price_per_night?: number;
  currency?: string;
  booking_url?: string;
  rating?: number | null;
  location?: string;
  details?: {
    nightly_rate?: number;
    location?: string;
    check_in?: string;
    check_out?: string;
    rating?: number;
  };
}

interface TripDocument {
  id: string;
  user_id?: string;
  origin?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  total_estimated_cost?: number;
  travel_pace?: string;
  transit_mode?: string;
  preferences?: string[];
  prompt?: string | null;
  travelers?: number;
  trip_type?: string;
  status?: string;
  transit_details?: TransitDetailItem[];
  lodging_details?: LodgingDetailItem[];
  daily_itinerary?: DailyScheduleItem[];
  confirmed_bookings?: Array<Record<string, unknown>>;
  node_logs?: string[];
  created_at?: string;
  data_errors?: Array<{ source?: string; code?: string; message?: string }>;
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const { logs, status, transit, lodging, itinerary, totalCost, dataErrors, isFinished } =
    useSSEStream(tripId);

  const [tripData, setTripData] = useState<TripDocument | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedHotelIndex, setSelectedHotelIndex] = useState<number>(0);
  const [selectedTransitIndex, setSelectedTransitIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"single" | "all">("single");
  const [showAllHotels, setShowAllHotels] = useState<boolean>(false);

  // Custom booking override state
  const [customType, setCustomType] = useState("FLIGHT");
  const [customTitle, setCustomTitle] = useState("");
  const [customProvider, setCustomProvider] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingCal, setIsExportingCal] = useState(false);

  const handleShareTrip = async () => {
    if (typeof window === "undefined") return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Wayfarer Itinerary: ${tripData?.destination || "Trip"}`,
          text: `Check out my autonomous itinerary for ${tripData?.destination || "my trip"} on Wayfarer AI!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleExportCalendar = async () => {
    setIsExportingCal(true);
    try {
      const response = await apiFetch(`/api/v1/trips/${tripId}/export/calendar`);
      if (!response.ok) {
        throw new Error("Unable to export calendar.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeDest = tripData?.destination?.replace(/[^a-zA-Z0-9_-]/g, "_") || "Trip";
      link.download = `Wayfarer_${safeDest}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Calendar export error:", err);
      alert("Unable to generate calendar file.");
    } finally {
      setIsExportingCal(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const response = await apiFetch(`/api/v1/trips/${tripId}/export/pdf`);
      if (!response.ok) {
        throw new Error("Unable to export PDF itinerary.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeDest = tripData?.destination?.replace(/[^a-zA-Z0-9_-]/g, "_") || "Travel_Plan";
      link.download = `Wayfarer_${safeDest}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    // Initial fetch of trip data (authenticated)
    apiFetch(`/api/v1/trips/${tripId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.destination) {
          setTripData(data);
        }
      })
      .catch(() => {});
  }, [tripId]);

  // Combine the authenticated trip snapshot with live stream data.
  const currentStatus =
    status !== "IDLE" ? status : tripData?.status || "LOADING";
  const displayTransit = (
    transit.length > 0 ? transit : tripData?.transit_details || []
  ) as TransitDetailItem[];
  const displayLodging = (
    lodging.length > 0 ? lodging : tripData?.lodging_details || []
  ) as LodgingDetailItem[];
  const displayItinerary = (
    itinerary.length > 0 ? itinerary : tripData?.daily_itinerary || []
  ) as DailyScheduleItem[];
  const displayLogs = logs.length > 0 ? logs : tripData?.node_logs || [];

  const targetBudget = Number(tripData?.total_budget) || 0;
  const currentTotalSpend =
    Number(totalCost) > 0
      ? Number(totalCost)
      : Number(tripData?.total_estimated_cost) || 0;
  const savings = Math.max(0, targetBudget - currentTotalSpend);

  const getMapsUrl = (title?: string | null, url?: string | null) => {
    if (url && url !== "#" && url.startsWith("http")) return url;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title || "Attraction"} ${tripData?.destination || ""}`.trim())}`;
  };

  const getFlightUrl = (bookingUrl?: string | null) => {
    if (bookingUrl && bookingUrl !== "#" && bookingUrl.startsWith("http")) return bookingUrl;
    return `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(tripData?.origin || "")}+to+${encodeURIComponent(tripData?.destination || "")}`;
  };

  const getHotelUrl = (hotelTitle?: string | null, bookingUrl?: string | null) => {
    if (bookingUrl && bookingUrl !== "#" && bookingUrl.startsWith("http")) return bookingUrl;
    return `https://www.google.com/travel/search?q=${encodeURIComponent(`${hotelTitle || "Hotels"} ${tripData?.destination || ""}`.trim())}`;
  };

  const handleCustomBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch(`/api/v1/trips/${tripId}/custom-booking`, {
        method: "POST",
        body: JSON.stringify({
          booking_type: customType,
          title: customTitle,
          provider: customProvider,
          price: Number(customPrice),
          currency: "INR",
          booking_url: customUrl,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to save custom booking.");
      }
      setShowOverrideModal(false);
      // Reload page to refresh details
      window.location.reload();
    } catch {
      setShowOverrideModal(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Planner Hub</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleShareTrip}
            className="px-3.5 py-2 rounded-full glass border border-border/50 text-xs font-bold hover:bg-accent/40 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-[#C84B22]" />}
            <span>{copiedLink ? "Link Copied!" : "Share"}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCalendar}
            disabled={isExportingCal}
            className="px-3.5 py-2 rounded-full glass border border-border/50 text-xs font-bold hover:bg-accent/40 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isExportingCal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5 text-blue-400" />}
            <span>{isExportingCal ? "Generating..." : "Calendar (.ics)"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowOverrideModal(true)}
            className="px-3.5 py-2 rounded-full glass border border-border/50 text-xs font-bold hover:bg-accent/40 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-[#C84B22]" />
            <span>Add Booking</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-full glass border border-border/50 text-xs font-bold hover:bg-accent/40 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>{isExporting ? "Exporting..." : "PDF Pass"}</span>
          </button>
        </div>
      </div>

      {/* Editorial Trip Header Card with Motion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative rounded-[28px] p-8 lg:p-10 glass-card overflow-hidden border border-border/40 shadow-sm"
      >
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#C84B22]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#C84B22]/10 text-[#C84B22] border border-[#C84B22]/20 backdrop-blur-md inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                <span>Curated Travel Itinerary</span>
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-accent/60 border border-border/40 text-foreground">
                👥 {tripData?.travelers || 1} {(tripData?.travelers || 1) === 1 ? "Traveler" : "Travelers"}{tripData?.trip_type ? ` · ${tripData.trip_type}` : ""}
              </span>
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {tripData?.start_date && tripData?.end_date
                  ? `${tripData.start_date} — ${tripData.end_date}`
                  : "Dates pending"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif tracking-tight text-foreground">
              <span className="text-[#C84B22]">{tripData?.destination || "Loading trip…"}</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Origin: <strong className="text-foreground">{tripData?.origin || "Unavailable"}</strong> · Pace: <strong className="text-foreground">{tripData?.travel_pace || "Not set"}</strong> · Party: <strong className="text-foreground">{tripData?.travelers || 1} Guest{(tripData?.travelers || 1) > 1 ? "s" : ""} ({tripData?.trip_type || "Solo"})</strong>
            </p>
          </div>

          {/* Budget & Live Status */}
          <div className="flex items-center gap-4 bg-accent/30 p-4 rounded-2xl border border-border/40">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Optimized Total
              </p>
              <p className="text-2xl font-bold font-heading text-[#C84B22] tabular-nums">
                ₹{currentTotalSpend.toLocaleString("en-IN")}
              </p>
              {(tripData?.travelers || 1) > 1 && (
                <p className="text-xs text-muted-foreground tabular-nums">
                  ~₹{Math.round(currentTotalSpend / (tripData?.travelers || 1)).toLocaleString("en-IN")} / person
                </p>
              )}
              <p className="text-[11px] text-emerald-500 font-semibold tabular-nums">
                {targetBudget > 0
                  ? `₹${savings.toLocaleString("en-IN")} under budget`
                  : "Budget pending"}
              </p>
            </div>

            <div className="border-l border-border/50 pl-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Planning Status
              </p>
              {currentStatus === "GENERATING" || currentStatus === "RUNNING" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C84B22]/15 text-[#C84B22] text-xs font-bold">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Agents Running
                </span>
              ) : currentStatus === "FAILED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Live Data Unavailable
                </span>
              ) : currentStatus === "BUDGET_WARNING" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Budget Warning
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="h-3 w-3" />
                  Plan Confirmed
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Visual Multi-Agent Execution Progress Tracker */}
      <div className="glass-card rounded-[24px] p-5 border border-border/40 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-border/40">
          <div className="flex items-center gap-2 font-bold font-heading">
            <Sparkles className="h-4 w-4 text-[#C84B22]" />
            <span>Multi-Agent Swarm Pipeline</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {isFinished ? "Pipeline Complete" : "Autonomous Real-Time Synthesis"}
          </span>
        </div>

        {/* 5-Node Progress Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: "supervisor", label: "Supervisor", sub: "Route & Intent", icon: Zap, done: displayLogs.some(l => l.includes("Supervisor")) || isFinished },
            { id: "transit", label: "Transit Agent", sub: "Flights & IRCTC", icon: TrainFront, done: displayTransit.length > 0 || isFinished },
            { id: "lodging", label: "Lodging Agent", sub: "Google Hotels", icon: Hotel, done: displayLodging.length > 0 || isFinished },
            { id: "sightseeing", label: "Sightseeing", sub: "Places POIs", icon: Landmark, done: displayItinerary.length > 0 || isFinished },
            { id: "budget", label: "Budget Guard", sub: "Cost Audit", icon: ShieldCheck, done: isFinished },
          ].map((stage, idx) => {
            const isDone = stage.done;
            const isCurrent = !isDone && !isFinished && (
              idx === 0 || [
                displayLogs.some(l => l.includes("Supervisor")),
                displayTransit.length > 0,
                displayLodging.length > 0,
                displayItinerary.length > 0
              ][idx - 1]
            );

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-2xl border text-xs transition-all ${
                  isDone
                    ? "bg-[#C84B22]/10 border-[#C84B22]/30 text-[#C84B22]"
                    : isCurrent
                    ? "bg-[#C84B22]/15 border-[#C84B22] text-[#C84B22] shadow-sm animate-pulse"
                    : "bg-accent/20 border-border/40 text-muted-foreground opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <stage.icon className="h-4 w-4" />
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-[#C84B22]" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#C84B22]" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-border/80" />
                  )}
                </div>
                <p className="font-bold truncate text-xs">{stage.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{stage.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optimization & Adjustment Alert for Unfulfilled Real-Time Constraints */}
      {currentStatus === "FAILED" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-rose-300 shadow-lg">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-foreground text-sm">Real-Time Search Needs Adjustment</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {dataErrors.length > 0
                  ? dataErrors.map((e) => e.message).join("; ")
                  : "Live inventory providers found no available flights or hotels matching these strict constraints. Try expanding your budget ceiling or choosing flexible dates."}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-bold transition-all shrink-0 self-start sm:self-auto text-xs"
          >
            Adjust Dates & Budget
          </button>
        </div>
      )}

      {/* Real-time LangGraph Multi-Agent Telemetry Swarm Console */}
      <SwarmTelemetryConsole
        logs={displayLogs}
        status={currentStatus}
        isFinished={isFinished}
        dataErrors={dataErrors}
      />

      {/* Main Grid: Left Itinerary (2 cols) + Right Sticky Passes (1 col) */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left: Day-by-Day Clustered Timeline & Local Guide (2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Main Daily Itinerary Card */}
          <div className="glass-card rounded-[28px] p-6 sm:p-8 border border-border/40 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-[#C84B22]" />
                  <span>Geo-Clustered Routing & Sightseeing</span>
                </p>
                <h2 className="text-xl font-bold font-heading">
                  Daily Itinerary & Route Flow
                </h2>
              </div>

              {/* View Mode & Day Selector Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex p-0.5 bg-accent/30 rounded-full border border-border/40 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode("single")}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      viewMode === "single"
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Day-by-Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("all")}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      viewMode === "all"
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All Days
                  </button>
                </div>

                {viewMode === "single" && displayItinerary.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto no-scrollbar p-0.5 bg-accent/40 rounded-full border border-border/40">
                    {displayItinerary.map((day, idx: number) => {
                      const dayNum = day.day_number || idx + 1;
                      const isActive = activeDay === dayNum;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveDay(dayNum)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            isActive
                              ? "bg-[#C84B22] text-white shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Day {dayNum}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Day Schedule or Full Itinerary */}
            {displayItinerary.length > 0 ? (
              (viewMode === "single"
                ? displayItinerary.filter((d) => (d.day_number || 1) === activeDay)
                : displayItinerary
              ).map((day, dayIdx: number) => {
                const dayNum = day.day_number || dayIdx + 1;
                return (
                  <div key={dayIdx} className="space-y-4 pb-6 border-b border-border/30 last:border-b-0 last:pb-0">
                    {/* Day Theme & Header Banner */}
                    <div className="p-4 rounded-2xl bg-accent/30 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-xl bg-[#C84B22]/15 text-[#C84B22] font-bold text-xs flex items-center justify-center font-heading">
                          D{dayNum}
                        </span>
                        <div>
                          <h3 className="font-bold font-heading text-sm sm:text-base text-foreground">
                            {day.theme || `Day ${dayNum}: Exploring ${tripData?.destination || "Destination"}`}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium tabular-nums">
                            <Calendar className="h-3 w-3 text-muted-foreground/70" />
                            <span>{day.date || `Day ${dayNum}`}</span>
                          </p>
                        </div>
                      </div>

                      {typeof day.estimated_daily_cost === "number" && day.estimated_daily_cost > 0 && (
                        <span className="text-xs font-semibold text-[#C84B22] bg-[#C84B22]/10 px-2.5 py-1 rounded-full border border-[#C84B22]/20 self-start sm:self-auto tabular-nums">
                          Est. Activities: ₹{Number(day.estimated_daily_cost).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    {/* Transit Mobility Advice */}
                    {day.transit_notes && (
                      <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-blue-400">Transit & Mobility: </span>
                          <span className="text-muted-foreground leading-relaxed">{day.transit_notes}</span>
                        </div>
                      </div>
                    )}

                    {/* Morning Activity */}
                    {day.morning_activity && (
                      <motion.div
                        whileHover={{ scale: 1.008 }}
                        className="p-5 rounded-2xl bg-accent/20 border border-border/40 space-y-2 hover:border-amber-500/40 transition-all hover-lift"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>Morning • {day.morning_activity.duration || "06:00 AM – 09:30 AM"}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {day.morning_activity.category && (
                              <span className="text-xs font-medium text-muted-foreground bg-accent/50 px-2.5 py-0.5 rounded-full border border-border/30">
                                {day.morning_activity.category}
                              </span>
                            )}
                            <span className="text-xs font-bold text-[#C84B22] bg-[#C84B22]/10 px-2 py-0.5 rounded-full tabular-nums">
                              {day.morning_activity.cost ? `₹${Number(day.morning_activity.cost).toLocaleString("en-IN")}` : "Free / Included"}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-bold font-heading text-base text-foreground">
                          {day.morning_activity.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {day.morning_activity.description ||
                            "Explore iconic cultural sites and historical landmarks curated by the sightseeing swarm."}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30">
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground/60" />
                            <span>Verified Location</span>
                          </span>
                          <a
                            href={getMapsUrl(day.morning_activity.title, day.morning_activity.maps_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[#C84B22] font-semibold hover:underline"
                          >
                            <span>Google Maps Pin</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </motion.div>
                    )}

                    {/* Afternoon Activity */}
                    {day.afternoon_activity && (
                      <motion.div
                        whileHover={{ scale: 1.008 }}
                        className="p-5 rounded-2xl bg-accent/20 border border-border/40 space-y-2 hover:border-blue-500/40 transition-all hover-lift"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-semibold text-blue-500 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>Afternoon • {day.afternoon_activity.duration || "01:30 PM – 04:30 PM"}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {day.afternoon_activity.category && (
                              <span className="text-xs font-medium text-muted-foreground bg-accent/50 px-2.5 py-0.5 rounded-full border border-border/30">
                                {day.afternoon_activity.category}
                              </span>
                            )}
                            <span className="text-xs font-bold text-[#C84B22] bg-[#C84B22]/10 px-2 py-0.5 rounded-full tabular-nums">
                              {day.afternoon_activity.cost ? `₹${Number(day.afternoon_activity.cost).toLocaleString("en-IN")}` : "Free / Included"}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-bold font-heading text-base text-foreground">
                          {day.afternoon_activity.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {day.afternoon_activity.description ||
                            "Local cuisine tasting and neighborhood discovery optimized for proximity."}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30">
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground/60" />
                            <span>Verified Location</span>
                          </span>
                          <a
                            href={getMapsUrl(day.afternoon_activity.title, day.afternoon_activity.maps_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[#C84B22] font-semibold hover:underline"
                          >
                            <span>Google Maps Pin</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </motion.div>
                    )}

                    {/* Evening Activity */}
                    {day.evening_activity && (
                      <motion.div
                        whileHover={{ scale: 1.008 }}
                        className="p-5 rounded-2xl bg-accent/20 border border-border/40 space-y-2 hover:border-[#C84B22]/40 transition-all hover-lift"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-semibold text-[#C84B22] flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>Evening • {day.evening_activity.duration || "06:00 PM – 08:30 PM"}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {day.evening_activity.category && (
                              <span className="text-xs font-medium text-muted-foreground bg-accent/50 px-2.5 py-0.5 rounded-full border border-border/30">
                                {day.evening_activity.category}
                              </span>
                            )}
                            <span className="text-xs font-bold text-[#C84B22] bg-[#C84B22]/10 px-2 py-0.5 rounded-full tabular-nums">
                              {day.evening_activity.cost ? `₹${Number(day.evening_activity.cost).toLocaleString("en-IN")}` : "Free / Included"}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-bold font-heading text-base text-foreground">
                          {day.evening_activity.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {day.evening_activity.description ||
                            "Unwind with rooftop sunset views, live cultural ceremonies, and authentic dinner reservations."}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30">
                          <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground/60" />
                            <span>Verified Location</span>
                          </span>
                          <a
                            href={getMapsUrl(day.evening_activity.title, day.evening_activity.maps_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[#C84B22] font-semibold hover:underline"
                          >
                            <span>Google Maps Pin</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })
            ) : (
              /* High-Quality Animated Skeletons While Itinerary is Synthesizing */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-accent/30 border border-border/40 animate-pulse flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="h-4 w-48 bg-border/60 rounded-md" />
                    <div className="h-3 w-28 bg-border/40 rounded-md" />
                  </div>
                  <div className="h-6 w-24 bg-border/40 rounded-full" />
                </div>

                {[
                  { time: "Morning • 06:00 AM – 09:30 AM", label: "Heritage Walk & Cultural Sites", color: "text-amber-500" },
                  { time: "Afternoon • 01:30 PM – 04:30 PM", label: "Culinary Tasting & Historic Landmarks", color: "text-blue-500" },
                  { time: "Evening • 06:00 PM – 08:30 PM", label: "Sunset Rituals & Riverbank Gathering", color: "text-[#C84B22]" },
                ].map((skel, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-accent/15 border border-border/30 space-y-3 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${skel.color} uppercase tracking-wider`}>
                        {skel.time}
                      </span>
                      <div className="h-4 w-16 bg-border/40 rounded-full" />
                    </div>
                    <div className="h-5 w-3/4 bg-border/50 rounded-lg" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-border/30 rounded-md" />
                      <div className="h-3 w-5/6 bg-border/30 rounded-md" />
                    </div>
                    <div className="pt-2 border-t border-border/20 flex justify-between">
                      <div className="h-3 w-24 bg-border/30 rounded-md" />
                      <div className="h-3 w-20 bg-border/40 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Local Culture, Dining & Travel Tips Companion Card */}
          <div className="glass-card rounded-[28px] p-6 sm:p-8 border border-border/40 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                <Utensils className="h-4 w-4 text-[#C84B22]" />
                <span>Local Culinary & Insider Travel Guide</span>
              </h3>
              <span className="text-[10px] font-bold text-muted-foreground bg-accent/40 px-2 py-0.5 rounded-full border border-border/40">
                {tripData?.destination || "Destination"} Insights
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-accent/20 border border-border/30 space-y-1.5">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <ChefHat className="h-3.5 w-3.5 text-[#C84B22]" />
                  <span>Authentic Dining</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Sample iconic street food streets, heritage vegetarian thalis, and local sweet shops recommended for {tripData?.destination || "this region"}.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-accent/20 border border-border/30 space-y-1.5">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <Lightbulb className="h-3.5 w-3.5 text-[#C84B22]" />
                  <span>Cultural Etiquette</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Modest dress code recommended for sacred temples and shrines. Early mornings offer the cleanest light and smallest crowds for photography.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-accent/20 border border-border/30 space-y-1.5">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-[#C84B22]" />
                  <span>Party Dynamics</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Optimized for {tripData?.travelers || 1} {(tripData?.travelers || 1) === 1 ? "Traveler" : "Travelers"} ({tripData?.trip_type || "Group"}) traveling at a {tripData?.travel_pace || "Balanced"} rhythm.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Boarding Passes & Hotel Reservation Cards (1 col - Sticky & Balanced) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="space-y-6 lg:sticky lg:top-24 self-start"
        >
          {/* Multimodal Transit Bookings Card */}
          <div className="glass-card rounded-[28px] p-6 border border-border/40 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                <Plane className="h-4 w-4 text-[#C84B22] rotate-[-30deg]" />
                <span className="text-muted-foreground/60">/</span>
                <Train className="h-4 w-4 text-[#C84B22]" />
                <span>Transit Travel Pass</span>
              </h3>
              <span className="text-[10px] font-bold text-[#C84B22] bg-[#C84B22]/10 px-2 py-0.5 rounded-full">
                {tripData?.travelers ? `${tripData.travelers} Passenger Ticket${tripData.travelers > 1 ? "s" : ""}` : "Live Transit"}
              </span>
            </div>

            {/* If multiple transit options exist, show selector tabs */}
            {displayTransit.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {displayTransit.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTransitIndex(idx)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                      selectedTransitIndex === idx
                        ? "bg-[#C84B22] text-white shadow-xs"
                        : "bg-accent/40 text-muted-foreground hover:text-foreground border border-border/40"
                    }`}
                  >
                    {t.booking_type === "TRAIN" ? `🚆 Train #${t.details?.train_number || idx + 1}` : `✈️ Flight #${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {displayTransit.length > 0 ? (
              (() => {
                const t = displayTransit[selectedTransitIndex] || displayTransit[0];
                const isTrain = t.booking_type === "TRAIN";
                return isTrain ? (
                  <div className="p-4 rounded-2xl bg-accent/20 border border-[#C84B22]/30 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-[#C84B22] bg-[#C84B22]/10 px-2.5 py-0.5 rounded-full border border-[#C84B22]/20">
                            🚆 Indian Railways
                          </span>
                          {t.details?.class_type && (
                            <span className="text-xs font-medium text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-md">
                              Class: {t.details.class_type}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-1">
                          {t.details?.train_name ? `${t.details.train_name} (#${t.details.train_number})` : t.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t.provider || "IRCTC Express Service"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold font-heading text-[#C84B22] tabular-nums">
                          ₹{Number(t.price).toLocaleString("en-IN")}
                        </span>
                        <p className="text-xs text-muted-foreground">Total for {tripData?.travelers || 1} pax</p>
                      </div>
                    </div>

                    {/* Train Route Visual */}
                    <div className="flex items-center justify-between py-2 border-y border-dashed border-border/40 text-xs">
                      <div className="text-left">
                        <span className="font-semibold text-foreground tracking-tight">
                          {t.details?.departure_station || tripData?.origin || "—"}
                        </span>
                        <p className="text-xs text-muted-foreground">{t.details?.departure_time || "Departure"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                        <motion.span
                          animate={{ x: [-3, 3, -3] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          🚆
                        </motion.span>
                        <span>{t.details?.duration || "Express"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-foreground tracking-tight">
                          {t.details?.arrival_station || tripData?.destination || "—"}
                        </span>
                        <p className="text-xs text-muted-foreground">{t.details?.arrival_time || "Arrival"}</p>
                      </div>
                    </div>

                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href={t.booking_url || "https://www.irctc.co.in/nget/train-search"}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm bg-[#C84B22] hover:bg-[#b0401b] text-white transition-colors"
                    >
                      <span>Book on IRCTC Portal</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </motion.a>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-accent/20 border border-border/40 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground">
                          ✈️ {t.provider || "Flight Provider"}
                        </span>
                        <h4 className="font-bold text-sm text-foreground mt-0.5">
                          {t.title}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold font-heading text-[#C84B22] tabular-nums">
                          ₹{Number(t.price).toLocaleString("en-IN")}
                        </span>
                        <p className="text-xs text-muted-foreground">Total for {tripData?.travelers || 1} pax</p>
                      </div>
                    </div>

                    {/* Boarding Pass Route Visual */}
                    <div className="flex items-center justify-between py-2 border-y border-dashed border-border/40 text-xs">
                      <span className="font-semibold text-foreground tracking-tight">
                        {t.details?.departure_airport || tripData?.origin || "—"}
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                        <motion.span
                          animate={{ x: [-4, 4, -4] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          ✈
                        </motion.span>
                        <span>{t.details?.duration || "Direct Flight"}</span>
                      </div>
                      <span className="font-semibold text-foreground tracking-tight">
                        {t.details?.arrival_airport || tripData?.destination || "—"}
                      </span>
                    </div>

                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href={getFlightUrl(t.booking_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-coral w-full py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Book Flight Ticket</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </motion.a>
                  </div>
                );
              })()
            ) : (
              <p className="text-xs text-muted-foreground">Searching live transit options...</p>
            )}
          </div>

          {/* Hotel Bookings Card (Compact Selector Layout) */}
          <div className="glass-card rounded-[28px] p-6 border border-border/40 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                <Hotel className="h-4 w-4 text-[#C84B22]" />
                <span>Verified Accommodations</span>
              </h3>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-400/15 px-2 py-0.5 rounded-full">
                {tripData?.travelers
                  ? `${Math.max(1, Math.ceil(tripData.travelers / 2))} Room${Math.ceil(tripData.travelers / 2) > 1 ? "s" : ""} · ${tripData.travelers} Guest${tripData.travelers > 1 ? "s" : ""}`
                  : "Verified Stays"}
              </span>
            </div>

            {/* Hotel Tabs: lets user select between the 5 verified stays */}
            {displayLodging.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {displayLodging.map((l, idx) => {
                  const isTop = idx === 0;
                  const isSelected = selectedHotelIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedHotelIndex(idx)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                        isSelected
                          ? "bg-[#C84B22] text-white shadow-xs"
                          : "bg-accent/40 text-muted-foreground hover:text-foreground border border-border/40"
                      }`}
                    >
                      {isTop ? "★ Top AI Pick" : `Stay #${idx + 1}`}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Selected Hotel Card */}
            {displayLodging.length > 0 ? (
              (() => {
                const l = displayLodging[selectedHotelIndex] || displayLodging[0];
                const isPrimary = selectedHotelIndex === 0;
                return (
                  <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
                    isPrimary
                      ? "bg-[#C84B22]/5 border-[#C84B22]/40 shadow-sm"
                      : "bg-accent/20 border-border/40"
                  }`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isPrimary
                              ? "bg-[#C84B22]/15 text-[#C84B22] border-[#C84B22]/30"
                              : "bg-accent/40 text-muted-foreground border-border/40"
                          }`}>
                            {isPrimary ? "★ Recommended" : `Verified Option #${selectedHotelIndex + 1}`}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {typeof l.rating === "number"
                              ? `★ ${l.rating.toFixed(1)} / 5.0 Rating`
                              : "Rating verified"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-1">
                          {l.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {l.location || `${tripData?.destination || "City"} Central`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-extrabold font-heading text-[#C84B22]">
                          {typeof l.price_per_night === "number"
                            ? `₹${Number(l.price_per_night).toLocaleString("en-IN")}`
                            : typeof l.price === "number"
                            ? `₹${Number(l.price).toLocaleString("en-IN")}`
                            : "Price unavailable"}
                        </span>
                        <p className="text-[10px] text-muted-foreground">per night</p>
                      </div>
                    </div>

                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href={getHotelUrl(l.title, l.booking_url)}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full py-2.5 rounded-full text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                        isPrimary
                          ? "bg-[#C84B22] text-white border-transparent hover:bg-[#b0401b]"
                          : "border-border/60 bg-accent/30 hover:bg-accent/50 text-foreground"
                      }`}
                    >
                      <span>{isPrimary ? "Reserve Primary Stay" : "View & Reserve Hotel"}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </motion.a>
                  </div>
                );
              })()
            ) : (
              <p className="text-xs text-muted-foreground">Checking hotel vacancies...</p>
            )}

            {/* Quick All Options Comparison Toggle */}
            {displayLodging.length > 1 && (
              <div className="pt-2 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setShowAllHotels(!showAllHotels)}
                  className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground font-semibold py-1 transition-colors"
                >
                  <span>Compare all {displayLodging.length} verified stays</span>
                  {showAllHotels ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showAllHotels && (
                  <div className="space-y-2 pt-2">
                    {displayLodging.map((l, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedHotelIndex(idx)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          selectedHotelIndex === idx
                            ? "border-[#C84B22] bg-[#C84B22]/10"
                            : "border-border/40 bg-accent/15 hover:bg-accent/30"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="font-bold text-foreground truncate">{l.title}</p>
                          <p className="text-[10px] text-muted-foreground">★ {typeof l.rating === "number" ? l.rating.toFixed(1) : "Verified"}</p>
                        </div>
                        <span className="font-bold text-foreground shrink-0 text-xs">
                          ₹{Number(l.price_per_night || l.price || 0).toLocaleString("en-IN")}/nt
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Budget Audit & Cost Summary Card */}
          <div className="glass-card rounded-[28px] p-6 border border-border/40 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
              <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#C84B22]" />
                <span>Financial Budget Audit</span>
              </h3>
              <span className="text-[10px] font-bold text-[#C84B22] bg-[#C84B22]/10 px-2 py-0.5 rounded-full">
                {savings >= 0 ? "Under Budget" : "Budget Warning"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Allocated Budget</span>
                <span className="tabular-nums text-foreground font-semibold">
                  ₹{targetBudget.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Estimated Spend</span>
                <span className="tabular-nums text-foreground font-semibold">
                  ₹{currentTotalSpend.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-border/30 text-[#C84B22]">
                <span>Remaining Reserve</span>
                <span className="tabular-nums">
                  ₹{savings.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Visual Budget Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="h-2 w-full bg-accent/40 rounded-full overflow-hidden border border-border/30">
                <div
                  className="h-full bg-gradient-to-r from-[#C84B22] to-amber-500 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, targetBudget > 0 ? (currentTotalSpend / targetBudget) * 100 : 0)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right font-medium tabular-nums">
                {targetBudget > 0 ? Math.round((currentTotalSpend / targetBudget) * 100) : 0}% of budget utilized
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom Booking Override Modal */}
      <AnimatePresence>
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="glass-card rounded-[28px] p-6 sm:p-8 max-w-md w-full border border-border/40 space-y-6 relative shadow-sm"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold font-heading">
                  Add Custom Booking
                </h3>
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="h-8 w-8 rounded-full bg-accent/40 text-muted-foreground hover:text-foreground text-xs font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCustomBookingSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Booking Type
                  </Label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full h-11 px-3 bg-accent/20 border border-border/50 rounded-xl text-xs text-foreground"
                  >
                    <option value="FLIGHT">Flight / Train</option>
                    <option value="HOTEL">Hotel Stay</option>
                    <option value="EVENT">Tour / Attraction</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Title
                  </Label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Custom Flight Option"
                    required
                    className="h-11 bg-accent/20 border-border/50 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Provider
                  </Label>
                  <Input
                    value={customProvider}
                    onChange={(e) => setCustomProvider(e.target.value)}
                    placeholder="e.g. Emirates Airlines"
                    className="h-11 bg-accent/20 border-border/50 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Price (₹ INR)
                  </Label>
                  <Input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="4500"
                    required
                    className="h-11 bg-accent/20 border-border/50 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Booking URL
                  </Label>
                  <Input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://..."
                    required
                    className="h-11 bg-accent/20 border-border/50 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-coral w-full py-3 rounded-full text-xs font-bold shadow-md"
                >
                  Save Custom Booking
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
