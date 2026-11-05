"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Calendar,
  Compass,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
  Check,
  ArrowDownUp,
  Users,
  TrainFront,
  Hotel,
  Landmark,
} from "lucide-react";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";

const airportPresets = [
  { code: "DEL", name: "New Delhi" },
  { code: "BOM", name: "Mumbai" },
  { code: "BLR", name: "Bengaluru" },
  { code: "CCU", name: "Kolkata" },
  { code: "HYD", name: "Hyderabad" },
  { code: "MAA", name: "Chennai" },
  { code: "GOI", name: "Goa" },
];

const destinationPresets = [
  "Goa, India",
  "Jaipur, Rajasthan",
  "Varanasi, India",
  "Kochi, Kerala",
  "Srinagar, Kashmir",
  "Manali, Himachal",
  "Darjeeling, India",
];

const paceOptions = [
  { id: "Relaxed", label: "Relaxed", sub: "2-3 stops/day · Leisure" },
  { id: "Balanced", label: "Balanced", sub: "4-5 stops/day · Optimal" },
  { id: "Fast-Paced", label: "Fast-Paced", sub: "Packed · Max highlights" },
];

const tagOptions = [
  { name: "Food & Dining", emoji: "🍜" },
  { name: "Culture & History", emoji: "⛩️" },
  { name: "Nightlife", emoji: "🍸" },
  { name: "Nature & Outdoors", emoji: "🏔️" },
  { name: "Shopping", emoji: "🛍️" },
  { name: "Art & Museums", emoji: "🎨" },
];

const durationPresets = [
  { label: "3 Days (Weekend)", days: 3 },
  { label: "5 Days (Standard)", days: 5 },
  { label: "7 Days (Week)", days: 7 },
  { label: "10 Days (Extended)", days: 10 },
];

const budgetPresets = [
  { label: "₹15,000", amount: 15000, desc: "Budget" },
  { label: "₹25,000", amount: 25000, desc: "Standard" },
  { label: "₹50,000", amount: 50000, desc: "Comfort" },
  { label: "₹1,00,000", amount: 100000, desc: "Luxury" },
];

const partyPresets = [
  { id: "Solo", label: "Solo", count: 1, icon: "👤", desc: "Independent traveler" },
  { id: "Couple", label: "Couple", count: 2, icon: "💑", desc: "Romantic / Duo" },
  { id: "Family", label: "Family", count: 4, icon: "👨‍👩‍👧‍👦", desc: "Parents & kids" },
  { id: "Friends", label: "Friends", count: 4, icon: "👥", desc: "Group trip" },
];

const curatedTemplates = [
  {
    title: "Goa Beach & Sun Escape",
    destination: "Goa, India",
    days: 4,
    budget: 35000,
    travelers: 2,
    trip_type: "Couple",
    pace: "Relaxed",
    transit: "ALL" as const,
    tags: ["Food & Dining", "Nightlife"],
    icon: "🌴",
    vibe: "2 Travelers (Couple) · Beaches · Sundowners",
  },
  {
    title: "Jaipur Royal Forts & Palaces",
    destination: "Jaipur, Rajasthan",
    days: 3,
    budget: 40000,
    travelers: 4,
    trip_type: "Family",
    pace: "Balanced",
    transit: "TRAIN" as const,
    tags: ["Culture & History", "Shopping"],
    icon: "🏰",
    vibe: "4 Travelers (Family) · Heritage · Bazaars",
  },
  {
    title: "Kochi Waters & Backwaters",
    destination: "Kochi, Kerala",
    days: 5,
    budget: 45000,
    travelers: 2,
    trip_type: "Friends",
    pace: "Relaxed",
    transit: "FLIGHT" as const,
    tags: ["Nature & Outdoors", "Food & Dining"],
    icon: "🛶",
    vibe: "2 Travelers · Houseboats · Coastal Bliss",
  },
];

function getFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

interface DashboardTrip {
  id: string;
  destination: string;
  origin?: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  total_estimated_cost?: number;
  status: string;
  created_at: string;
  travel_pace?: string;
  transit_mode?: string;
  travelers?: number;
  trip_type?: string;
}

function getSavedPreference<T>(key: string, defaultValue: T): T {
  if (typeof window !== "undefined") {
    try {
      const savedPrefs = localStorage.getItem("wayfarer_preferences");
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed[key] !== undefined && parsed[key] !== null) return parsed[key];
      }
    } catch {
      // ignore
    }
  }
  return defaultValue;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"form" | "prompt">(() => {
    if (typeof window !== "undefined") {
      const p = localStorage.getItem("wayfarer_initial_prompt");
      if (p) return "prompt";
    }
    return "form";
  });

  // Structured Form States
  const [origin, setOrigin] = useState(() => getSavedPreference("homeAirport", "New Delhi (DEL)"));
  const [destination, setDestination] = useState("Goa, India");
  const [startDate, setStartDate] = useState(() => getFutureDate(14));
  const [endDate, setEndDate] = useState(() => getFutureDate(21));
  const [budget, setBudget] = useState(25000);
  const [travelPace, setTravelPace] = useState(() => getSavedPreference("travelPace", "Balanced"));
  const [transitMode, setTransitMode] = useState<"ALL" | "FLIGHT" | "TRAIN">("ALL");
  const [travelers, setTravelers] = useState(1);
  const [tripType, setTripType] = useState("Solo");
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    getSavedPreference("preferredTags", ["Food & Dining", "Culture & History"])
  );

  // Natural Prompt State
  const [promptText, setPromptText] = useState(() => {
    if (typeof window !== "undefined") {
      const p = localStorage.getItem("wayfarer_initial_prompt");
      if (p) {
        localStorage.removeItem("wayfarer_initial_prompt");
        return p;
      }
    }
    return "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [tripsLoading, setTripsLoading] = useState(true);

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleApplyDuration = (days: number) => {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const handleApplyTemplate = (tmpl: (typeof curatedTemplates)[0]) => {
    setDestination(tmpl.destination);
    setBudget(tmpl.budget);
    setTravelPace(tmpl.pace);
    setTransitMode(tmpl.transit);
    setSelectedTags(tmpl.tags);
    setTravelers(tmpl.travelers || 1);
    setTripType(tmpl.trip_type || "Solo");
    handleApplyDuration(tmpl.days);
    setActiveTab("form");
  };

  const tripDurationDays = Math.max(
    1,
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const perPersonBudget = Math.round(budget / Math.max(1, travelers));
  const dailySpendEstimate = Math.round(budget / tripDurationDays);
  const estimatedRooms = Math.max(1, Math.ceil(travelers / 2));

  useEffect(() => {
    // Load existing trips
    const fetchTrips = async () => {
      try {
        const res = await apiFetch("/api/v1/trips/");
        if (res.ok) {
          const data = await res.json();
          setTrips(Array.isArray(data) ? data : []);
        }
      } catch {
        setTrips([]);
      } finally {
        setTripsLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let payload: Record<string, unknown>;
    if (activeTab === "prompt") {
      if (!promptText.trim()) {
        setFormError("Tell Wayfarer where you want to go — even one sentence is enough to start.");
        setIsSubmitting(false);
        return;
      }
      payload = {
        prompt: promptText.trim(),
        travel_pace: travelPace,
        transit_mode: transitMode,
        travelers,
        trip_type: tripType,
      };
    } else {
      if (!destination.trim()) {
        setFormError("Please choose a destination city — that's the one field we can't plan without.");
        setIsSubmitting(false);
        return;
      }
      payload = {
        origin: origin.trim() || "New Delhi (DEL)",
        destination: destination.trim(),
        start_date: startDate || getFutureDate(14),
        end_date: endDate || getFutureDate(21),
        total_budget: Number(budget) || 25000,
        travel_pace: travelPace,
        transit_mode: transitMode,
        preferences: selectedTags,
        travelers,
        trip_type: tripType,
      };
    }

    setFormError(null);
    try {
      const res = await apiFetch("/api/v1/trips/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/trip/${data.id}`);
      } else {
        const errText = await res.text();
        setFormError(`We couldn't start this plan (${errText || res.statusText}). Please retry — your constraints are saved.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please check backend connection";
      setFormError(`Network error — the live agents couldn't be reached. (${message})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner — Editorial Style with Framer Motion (Forth Ref) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl p-8 lg:p-10 glass-card overflow-hidden ambient-copper"
      >
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute right-14 top-8 h-1.5 w-1.5 rounded-full bg-primary route-dot-floating" />
          <div className="absolute right-8 top-16 h-1 w-1 rounded-full bg-primary/60 route-dot-floating" style={{ animationDelay: "1.4s" }} />
          <div className="absolute right-24 bottom-10 h-1 w-1 rounded-full bg-primary/50 route-dot-floating" style={{ animationDelay: "2.6s" }} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full badge-coral px-3.5 py-1 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span>6-node multi-agent swarm · operational</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading tracking-tight leading-[1.08]">
            Plan your next journey with <br />
            <span className="text-primary">autonomous AI</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl">
            Set your constraints and watch four specialized agents query live flight and hotel inventory, optimize costs, and construct your executable trip in real time.
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Creation Panel (Left 2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            {/* Segmented Mode Selector with sliding layoutId indicator */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center p-1 bg-accent/40 rounded-full border border-border/40">
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className="relative px-5 py-2 text-xs font-bold rounded-full transition-colors"
                >
                  {activeTab === "form" && (
                    <motion.div
                      layoutId="dashboardModeToggle"
                      className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-full shadow-md"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      activeTab === "form"
                        ? "text-white dark:text-neutral-900 font-extrabold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Structured Form
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("prompt")}
                  className="relative px-5 py-2 text-xs font-bold rounded-full transition-colors"
                >
                  {activeTab === "prompt" && (
                    <motion.div
                      layoutId="dashboardModeToggle"
                      className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-full shadow-md"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      activeTab === "prompt"
                        ? "text-white dark:text-neutral-900 font-extrabold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Natural Prompt
                  </span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Zero mock data guarantee</span>
              </div>
            </div>

            {/* Prompt Mode Bar */}
            {activeTab === "prompt" ? (
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Describe Your Dream Trip
                </Label>
                <div className="relative">
                  <textarea
                    rows={5}
                    placeholder="e.g. Romantic honeymoon for 2 to Goa from Delhi for ₹45,000 focusing on flights, beach stays in Calangute, seafood dining, and sunset cruises..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full p-4 bg-accent/20 border border-border/50 rounded-2xl text-sm focus:outline-none focus:border-[#C84B22] transition-colors leading-relaxed"
                  />
                </div>

                {/* Quick destination suggestion tags */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Popular Itinerary Prompts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Romantic 4 days in Goa for 2 from Delhi with beach stays (₹35,000)",
                      "Family vacation for 4 to Jaipur from Mumbai by train (₹40,000)",
                      "Solo backpacking 5 days in Kochi for food & backwaters (₹20,000)",
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPromptText(p)}
                        className="text-xs px-3 py-1.5 rounded-full bg-accent/20 border border-border/40 text-muted-foreground hover:text-foreground hover:border-[#C84B22]/40 transition-all text-left"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                    <span className="mt-0.5 text-base leading-none">!</span>
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={isSubmitting || !promptText.trim()}
                  className="btn-coral btn-sheen w-full py-4 rounded-full text-sm font-bold shadow-lg flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Parsing Natural Intent & Initializing Swarm...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Autonomous Plan</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Structured Form Builder */
              <form onSubmit={handleGeneratePlan} className="space-y-6">
                {/* Origin Departure & Destination City with Swap Button */}
                <div className="space-y-4">
                  {/* Origin */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Departure City / Hub
                      </Label>
                      {/* Airport Presets */}
                      <div className="flex items-center gap-1">
                        {airportPresets.slice(0, 5).map((ap) => (
                          <button
                            key={ap.code}
                            type="button"
                            onClick={() => setOrigin(`${ap.name} (${ap.code})`)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                              origin.includes(ap.code)
                                ? "bg-[#C84B22]/20 text-[#C84B22] border border-[#C84B22]/30"
                                : "bg-accent/30 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {ap.code}
                          </button>
                        ))}
                      </div>
                    </div>
                    <CityAutocomplete
                      type="origin"
                      value={origin}
                      onChange={setOrigin}
                      placeholder="e.g. New Delhi (DEL)"
                    />
                  </div>

                  {/* Swap Location Divider Button */}
                  <div className="relative flex items-center justify-center -my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/40" />
                    </div>
                    <button
                      type="button"
                      onClick={handleSwapLocations}
                      title="Swap departure and destination"
                      className="relative z-10 p-1.5 rounded-full bg-accent/80 hover:bg-accent border border-border/50 text-muted-foreground hover:text-[#C84B22] transition-colors shadow-sm"
                    >
                      <ArrowDownUp className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Destination */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Destination City / Region
                      </Label>
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {destinationPresets.slice(0, 4).map((dp) => (
                          <button
                            key={dp}
                            type="button"
                            onClick={() => setDestination(dp)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all shrink-0 ${
                              destination === dp
                                ? "bg-[#C84B22]/20 text-[#C84B22] border border-[#C84B22]/30"
                                : "bg-accent/30 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {dp.split(",")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <CityAutocomplete
                      type="destination"
                      value={destination}
                      onChange={setDestination}
                      placeholder="e.g. Goa, India"
                    />
                  </div>
                </div>

                {/* Multimodal Transit Mode Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Transit Mode
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Indian Railways (IRCTC) & Live Flights
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "ALL", label: "All Transit", icon: "🚆+✈️", sub: "Flights & Trains" },
                      { id: "TRAIN", label: "Trains Only", icon: "🚆", sub: "IRCTC / Vande Bharat" },
                      { id: "FLIGHT", label: "Flights Only", icon: "✈️", sub: "Domestic Airlines" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setTransitMode(mode.id as "ALL" | "FLIGHT" | "TRAIN")}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          transitMode === mode.id
                            ? "bg-[#C84B22]/10 border-[#C84B22] shadow-xs"
                            : "border-border/50 bg-accent/10 hover:bg-accent/30"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{mode.icon}</span>
                          <p
                            className={`text-xs font-bold ${
                              transitMode === mode.id ? "text-[#C84B22]" : "text-foreground"
                            }`}
                          >
                            {mode.label}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{mode.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Party Size & Traveler Count */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#C84B22]" />
                      <span>Who&apos;s Traveling</span>
                    </Label>
                    <span className="text-xs font-semibold text-[#C84B22] tabular-nums">
                      {travelers} {travelers === 1 ? "Traveler" : "Travelers"} ({tripType})
                    </span>
                  </div>

                  {/* Party Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {partyPresets.map((party) => {
                      const isSelected = tripType === party.id && travelers === party.count;
                      return (
                        <button
                          key={party.id}
                          type="button"
                          onClick={() => {
                            setTripType(party.id);
                            setTravelers(party.count);
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? "bg-[#C84B22]/15 border-[#C84B22] shadow-xs"
                              : "border-border/50 bg-accent/15 hover:bg-accent/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{party.icon}</span>
                            <div>
                              <p className={`text-xs font-bold ${isSelected ? "text-[#C84B22]" : "text-foreground"}`}>
                                {party.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{party.count} Guest{party.count > 1 ? "s" : ""}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Counter Stepper */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-accent/20 border border-border/40 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">Exact Passenger / Guest Count</span>
                      <p className="text-[10px] text-muted-foreground">
                        {estimatedRooms} hotel room{estimatedRooms > 1 ? "s" : ""} · {travelers} transit ticket{travelers > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTravelers((prev) => Math.max(1, prev - 1))}
                        disabled={travelers <= 1}
                        className="h-8 w-8 rounded-full border border-border/60 bg-accent/40 flex items-center justify-center font-bold text-sm disabled:opacity-40 hover:bg-accent/80 transition-colors"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm w-4 text-center tabular-nums">{travelers}</span>
                      <button
                        type="button"
                        onClick={() => setTravelers((prev) => Math.min(10, prev + 1))}
                        disabled={travelers >= 10}
                        className="h-8 w-8 rounded-full border border-border/60 bg-accent/40 flex items-center justify-center font-bold text-sm disabled:opacity-40 hover:bg-accent/80 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dates & Quick Duration Chips */}
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Start Date
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="pl-10 h-11 bg-accent/20 border-border/50 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          End Date
                        </Label>
                        <span className="text-xs font-semibold text-[#C84B22] tabular-nums">
                          {tripDurationDays} {tripDurationDays === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="pl-10 h-11 bg-accent/20 border-border/50 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Duration Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground mr-1">
                      Quick Length:
                    </span>
                    {durationPresets.map((dp) => (
                      <button
                        key={dp.days}
                        type="button"
                        onClick={() => handleApplyDuration(dp.days)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          tripDurationDays === dp.days
                            ? "bg-[#C84B22]/15 text-[#C84B22] border-[#C84B22]/40 font-bold"
                            : "bg-accent/20 border-border/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {dp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Slider & Quick Tier Chips */}
                <div className="space-y-3 p-4 rounded-2xl bg-accent/20 border border-border/40">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Total Target Budget
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Est. <span className="text-foreground font-semibold tabular-nums">₹{dailySpendEstimate.toLocaleString("en-IN")}/day</span> across {tripDurationDays} days
                      </p>
                    </div>
                    <span className="text-xl font-bold font-heading text-[#C84B22] tabular-nums">
                      ₹{budget.toLocaleString("en-IN")} INR
                    </span>
                  </div>

                  {/* Quick Budget Chips */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {budgetPresets.map((bp) => (
                      <button
                        key={bp.amount}
                        type="button"
                        onClick={() => setBudget(bp.amount)}
                        className={`py-1.5 px-2 rounded-xl text-center border transition-all ${
                          budget === bp.amount
                            ? "bg-[#C84B22]/15 text-[#C84B22] border-[#C84B22] font-bold shadow-xs"
                            : "bg-accent/30 border-border/40 text-muted-foreground hover:text-foreground text-xs"
                        }`}
                      >
                        <p className="text-xs font-bold">{bp.label}</p>
                        <p className="text-[10px] text-muted-foreground">{bp.desc}</p>
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={5000}
                    max={200000}
                    step={1000}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full h-2 bg-accent/60 rounded-lg appearance-none cursor-pointer accent-[#C84B22]"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-medium tabular-nums">
                    <span>₹5,000</span>
                    <span>₹50,000</span>
                    <span>₹1,00,000</span>
                    <span>₹2,00,000+</span>
                  </div>

                  {/* Budget breakdown summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/30 text-xs">
                    <div className="p-2 rounded-xl bg-accent/30 border border-border/30">
                      <span className="text-xs font-medium text-muted-foreground block">Total Budget</span>
                      <span className="font-semibold text-foreground tabular-nums">₹{budget.toLocaleString("en-IN")}</span>
                    </div>
                    {travelers > 1 ? (
                      <div className="p-2 rounded-xl bg-[#C84B22]/10 border border-[#C84B22]/20">
                        <span className="text-xs font-medium text-[#C84B22] block">Per Person</span>
                        <span className="font-semibold text-[#C84B22] tabular-nums">₹{perPersonBudget.toLocaleString("en-IN")}</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-accent/30 border border-border/30">
                        <span className="text-xs font-medium text-muted-foreground block">Traveler</span>
                        <span className="font-semibold text-foreground">Solo (1 Guest)</span>
                      </div>
                    )}
                    <div className="p-2 rounded-xl bg-accent/30 border border-border/30">
                      <span className="text-xs font-medium text-muted-foreground block">Daily Spend</span>
                      <span className="font-semibold text-foreground tabular-nums">~₹{dailySpendEstimate.toLocaleString("en-IN")}/day</span>
                    </div>
                    <div className="p-2 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-xs font-medium text-primary block">Rooms needed</span>
                      <span className="font-semibold text-primary tabular-nums">{estimatedRooms} Room{estimatedRooms > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                {/* Travel Pace */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Travel Pace
                  </Label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {paceOptions.map((pace) => (
                      <button
                        key={pace.id}
                        type="button"
                        onClick={() => setTravelPace(pace.id)}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          travelPace === pace.id
                            ? "bg-[#C84B22]/10 border-[#C84B22] shadow-xs"
                            : "border-border/50 bg-accent/10 hover:bg-accent/30"
                        }`}
                      >
                        <p className={`text-xs font-bold ${
                          travelPace === pace.id ? "text-[#C84B22]" : "text-foreground"
                        }`}>
                          {pace.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {pace.sub}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests Tags */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Interests & Experiences
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {tagOptions.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.name}
                          type="button"
                          onClick={() => toggleTag(tag.name)}
                          className={`py-2 px-3.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-[#C84B22] text-white border-[#C84B22] shadow-sm"
                              : "border-border/40 bg-accent/20 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span>{tag.emoji}</span>
                          <span>{tag.name}</span>
                          {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Action */}
                {formError && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                    <span className="mt-0.5 text-base leading-none">!</span>
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-coral btn-sheen w-full py-4 rounded-full text-sm font-bold shadow-xl flex items-center justify-center gap-2 mt-4 transition-all duration-300 hover:scale-[1.01]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Initializing Agent Swarm...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Autonomous Plan</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Right Column: Active Agent Swarm Status & Trip History */}
        <div className="space-y-6">
          {/* Multi-Agent Swarm Telemetry Monitor Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold font-heading">Active agent swarm</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            </div>

            <div className="space-y-1.5">
              {[
                { name: "Supervisor Router", role: "Intent & multi-pass DAG orchestration", Icon: Zap },
                { name: "Transit Logistics", role: "Amadeus flights & IRCTC rail engine", Icon: TrainFront },
                { name: "Lodging Agent", role: "SerpAPI Google Hotels live pricing", Icon: Hotel },
                { name: "Sightseeing Agent", role: "Google Places geospatial clustering", Icon: Landmark },
                { name: "Budget Guardian", role: "Real-time cost & constraint audit", Icon: ShieldCheck },
                { name: "Consolidator", role: "Final travel pass synthesis & dispatch", Icon: Sparkles },
              ].map((agent, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="p-2.5 rounded-2xl bg-accent/20 border border-border/40 hover:border-primary/40 hover:bg-accent/40 transition-all flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <agent.Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground">{agent.role}</p>
                    </div>
                  </div>
                  <Check className="h-3.5 w-3.5 text-primary" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 1-Click Curated Getaways Inspirations */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-3xl p-6 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="text-sm font-semibold font-heading flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Instant curated trips</span>
              </h3>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                1-click apply
              </span>
            </div>

            <div className="space-y-2">
              {curatedTemplates.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-accent/20 border border-border/40 hover:border-primary/40 transition-all flex items-center justify-between group hover-lift"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-xl shrink-0">{t.icon}</span>
                    <div className="truncate">
                      <p className="font-bold text-xs text-foreground group-hover:text-[#C84B22] transition-colors truncate">
                        {t.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {t.days} Days · ₹{t.budget.toLocaleString("en-IN")} · {t.vibe}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className="px-2.5 py-1 rounded-lg bg-[#C84B22]/10 hover:bg-[#C84B22] text-[#C84B22] hover:text-white font-bold text-[10px] border border-[#C84B22]/20 transition-all shrink-0 ml-2"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trip History Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-sm font-semibold font-heading flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <span>Your trip history</span>
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                {trips.length} {trips.length === 1 ? "plan" : "plans"}
              </span>
            </div>

            {tripsLoading ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((n) => (
                  <div key={n} className="p-3.5 rounded-2xl border border-border/40">
                    <div className="animate-skeleton h-3.5 w-2/3 rounded-md" />
                    <div className="animate-skeleton mt-2 h-2.5 w-1/2 rounded-md" />
                  </div>
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs space-y-1.5">
                <p>No trip plans generated yet.</p>
                <p className="text-[10px] text-muted-foreground/60">
                  Fill in your travel dates on the left to launch the swarm!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 premium-scroll">
                {trips.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/dashboard/trip/${t.id}`)}
                    className="p-3.5 rounded-2xl bg-accent/20 border border-border/40 hover:border-primary/40 transition-all cursor-pointer group hover-lift"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs font-heading group-hover:text-[#C84B22] transition-colors">
                        {t.destination}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                          t.status === "PLANNED"
                            ? "bg-primary/10 text-primary"
                            : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        ₹{t.total_budget?.toLocaleString("en-IN") || "25,000"} · {t.travelers || 1} {t.travelers === 1 ? "Traveler" : "Travelers"}{t.trip_type ? ` (${t.trip_type})` : ""}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
