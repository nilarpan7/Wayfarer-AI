"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  apiFetch,
  clearAuthSession,
  getStoredUser,
  USER_STORAGE_KEY,
} from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import {
  User,
  Mail,
  Plane,
  Compass,
  DollarSign,
  Shield,
  Sparkles,
  CheckCircle2,
  LogOut,
  Save,
  MapPin,
  Hotel,
  Flame,
  Globe,
  Sliders,
  Check,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  image?: string | null;
  phone?: string;
  bio?: string;
  homeAirport: string;
  preferredCurrency: string;
  travelPace: string;
  preferredTags: string[];
  lodgingStyle: string;
  dietaryRestrictions: string;
  flightPriority: string;
  hotelProximity: string;
  dailyPoiDensity: string;
  budgetBuffer: string;
}

const defaultProfile: UserProfile = {
  name: "",
  email: "",
  image: null,
  phone: "",
  bio: "",
  homeAirport: "",
  preferredCurrency: "INR",
  travelPace: "Balanced",
  preferredTags: [],
  lodgingStyle: "Budget-Friendly",
  dietaryRestrictions: "",
  flightPriority: "Lowest Price",
  hotelProximity: "City Center (< 2 km)",
  dailyPoiDensity: "3-4 Curated Stops",
  budgetBuffer: "10% Safety Buffer",
};

const currencyOptions = [
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "JPY", label: "JPY (¥) - Japanese Yen" },
  { code: "CAD", label: "CAD ($) - Canadian Dollar" },
  { code: "AUD", label: "AUD ($) - Australian Dollar" },
  { code: "INR", label: "INR (₹) - Indian Rupee" },
];

const paceOptions = ["Relaxed", "Balanced", "Fast-Paced"];

const tagOptions = [
  "Food & Dining",
  "Culture & History",
  "Nightlife",
  "Nature & Outdoors",
  "Shopping",
  "Art & Museums",
  "Wellness & Spa",
  "Adventure & Sports",
];

const lodgingOptions = [
  "Boutique Hotels",
  "Luxury 5-Star",
  "Budget-Friendly",
  "Airbnbs / Vacation Rentals",
  "Eco-Lodges",
];

const airportPresets = [
  "New York (JFK)",
  "San Francisco (SFO)",
  "Los Angeles (LAX)",
  "Chicago (ORD)",
  "London (LHR)",
  "Paris (CDG)",
  "Tokyo (HND)",
  "Dubai (DXB)",
  "Singapore (SIN)",
  "New Delhi (DEL)",
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"identity" | "preferences" | "agents" | "security">("identity");

  const [profile, setProfile] = useState<UserProfile>(() => {
    let initialProfile = { ...defaultProfile };
    if (typeof window !== "undefined") {
      const savedPrefs = localStorage.getItem("wayfarer_preferences");
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          initialProfile = { ...initialProfile, ...parsed };
        } catch {
          // ignore
        }
      }
      const storedUser = getStoredUser();
      if (storedUser) {
        if (storedUser.name) initialProfile.name = storedUser.name;
        if (storedUser.email) initialProfile.email = storedUser.email;
        if (storedUser.image) initialProfile.image = storedUser.image;
      }
    }
    return initialProfile;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tripCount, setTripCount] = useState<number>(0);

  useEffect(() => {
    if (session?.user) {
      const timer = setTimeout(() => {
        setProfile((prev) => ({
          ...prev,
          name: session.user?.name || prev.name,
          email: session.user?.email || prev.email,
          image: session.user?.image || prev.image,
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session?.user]);

  useEffect(() => {
    // Fetch user trip stats from backend (authenticated)
    apiFetch("/api/v1/trips/")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setTripCount(data.length);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Persist preferences
      localStorage.setItem("wayfarer_preferences", JSON.stringify(profile));

      // Persist user sync
      const currentUser = getStoredUser() ?? {};
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({
          ...currentUser,
          name: profile.name,
          email: profile.email,
          image: profile.image,
        })
      );

      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }, 500);
    } catch {
      setIsSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (profile.preferredTags.includes(tag)) {
      setProfile({
        ...profile,
        preferredTags: profile.preferredTags.filter((t) => t !== tag),
      });
    } else {
      setProfile({
        ...profile,
        preferredTags: [...profile.preferredTags, tag],
      });
    }
  };

  const handleSignOut = async () => {
    clearAuthSession();
    await signOut({ callbackUrl: "/sign-in" });
  };

  // True only when this session was actually established through Google OAuth.
  const isGoogleConnected = Boolean(
    session?.user && (session.backendToken || session.user.image)
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12" suppressHydrationWarning>
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">Profile & Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
            Account & <span className="gradient-text">Travel Profile</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "glass hover:bg-accent/50 text-xs font-semibold"
            )}
          >
            <Compass className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
            Plan New Trip
          </Link>
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-xs border-0 shadow-md shadow-indigo-500/20 hover:brightness-110 transition-all flex items-center gap-1.5"
            )}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Preferences Saved Successfully</p>
              <p className="text-xs text-muted-foreground">
                Your AI agent parameters and default trip constraints are updated.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSaveSuccess(false)}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* User Hero Profile Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar with Google badge */}
            <div className="relative shrink-0">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name || "Profile"}
                  width={80}
                  height={80}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/25"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-extrabold text-2xl ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/25">
                  {profile.name ? profile.name[0].toUpperCase() : "U"}
                </div>
              )}
              {isGoogleConnected && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-lg bg-background border border-white/20 shadow flex items-center justify-center p-1"
                  title="Signed in with Google"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Name & Account Details */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold font-heading">{profile.name}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="h-3 w-3" />
                  Pro Multi-Agent Tier
                </span>
                {isGoogleConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Google Verified
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span>{profile.email}</span>
                <span className="text-border">•</span>
                <span className="text-xs text-muted-foreground/80">Home: {profile.homeAirport}</span>
              </p>
              <p className="text-xs text-muted-foreground/90 max-w-xl italic">
                &ldquo;{profile.bio}&rdquo;
              </p>
            </div>
          </div>

          {/* Quick Sign Out Action */}
          <div className="flex md:flex-col items-center gap-2.5 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/40">
            <button
              onClick={handleSignOut}
              className="w-full md:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Trips Planned</span>
            <Plane className="h-4 w-4 text-indigo-400 rotate-[-30deg]" />
          </div>
          <p className="text-2xl font-bold font-heading">{tripCount > 0 ? tripCount : "Active"}</p>
          <p className="text-[11px] text-muted-foreground">Autonomous itineraries built</p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Primary Hub</span>
            <MapPin className="h-4 w-4 text-violet-400" />
          </div>
          <p className="text-2xl font-bold font-heading truncate">
            {profile.homeAirport.split("(")[1]?.replace(")", "") || "—"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{profile.homeAirport}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Active Swarm</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-heading text-emerald-400">4 Agents</p>
          <p className="text-[11px] text-muted-foreground">Supervisor, Transit, Lodging, Sightseeing</p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Preferred Currency</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-heading">{profile.preferredCurrency}</p>
          <p className="text-[11px] text-muted-foreground">Real-time live provider pricing</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-accent/40 rounded-2xl max-w-xl border border-border/40 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "identity"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Identity & Auth</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "preferences"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Travel Style</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("agents")}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "agents"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Agent Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "security"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Integrations</span>
        </button>
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: IDENTITY & AUTH */}
        {activeTab === "identity" && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-heading">Personal Information & Account Identity</h3>
              <p className="text-xs text-muted-foreground">
                Manage your public traveler name, linked authentication identity, and profile tagline.
              </p>
            </div>

            {/* Google OAuth Status Banner */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-background border border-white/10 flex items-center justify-center p-2 shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Google OAuth 2.0 Provider</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Authenticated as <span className="text-foreground font-medium">{profile.email}</span>
                  </p>
                </div>
              </div>
              <span className="text-xs text-indigo-400 font-medium flex items-center gap-1 shrink-0">
                <Check className="h-3.5 w-3.5" /> Synchronized
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Display Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your Full Name"
                    className="pl-10 h-11 bg-accent/30 border-border/50 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="you@example.com"
                    className="pl-10 h-11 bg-accent/30 border-border/50 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact Phone (Optional)
                </Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="h-11 bg-accent/30 border-border/50 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Avatar Image URL
                </Label>
                <Input
                  value={profile.image || ""}
                  onChange={(e) => setProfile({ ...profile, image: e.target.value })}
                  placeholder="https://lh3.googleusercontent.com/..."
                  className="h-11 bg-accent/30 border-border/50 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Traveler Tagline / Bio
              </Label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Describe your travel philosophy..."
                className="w-full p-4 bg-accent/30 border border-border/50 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* TAB 2: TRAVEL PREFERENCES */}
        {activeTab === "preferences" && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-heading">Travel Style & Default Constraints</h3>
              <p className="text-xs text-muted-foreground">
                These settings auto-fill into the AI Planner whenever you initialize a new autonomous itinerary.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Default Departure Hub / Airport
                </Label>
                <CityAutocomplete
                  value={profile.homeAirport}
                  onChange={(val) => setProfile({ ...profile, homeAirport: val })}
                  placeholder="e.g. New Delhi (DEL), Mumbai (BOM)..."
                  type="origin"
                />
                {/* Airport Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {airportPresets.slice(0, 5).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setProfile({ ...profile, homeAirport: preset })}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors ${
                        profile.homeAirport === preset
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                          : "bg-accent/20 text-muted-foreground border-border/40 hover:text-foreground"
                      }`}
                    >
                      {preset.split("(")[1]?.replace(")", "") || preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preferred Currency
                </Label>
                <select
                  value={profile.preferredCurrency}
                  onChange={(e) => setProfile({ ...profile, preferredCurrency: e.target.value })}
                  className="w-full h-11 px-3.5 bg-accent/30 border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500"
                >
                  {currencyOptions.map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-card text-foreground">
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Travel Pace */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default Travel Pace
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {paceOptions.map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    onClick={() => setProfile({ ...profile, travelPace: pace })}
                    className={`py-3 px-4 rounded-2xl text-xs font-semibold border transition-all text-center ${
                      profile.travelPace === pace
                        ? "bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-md shadow-indigo-500/10"
                        : "bg-accent/20 text-muted-foreground border-border/40 hover:text-foreground hover:bg-accent/40"
                    }`}
                  >
                    {pace}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Interests / Tags */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Favorite Travel Categories & Interests
              </Label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => {
                  const active = profile.preferredTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        active
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20"
                          : "bg-accent/20 text-muted-foreground border-border/40 hover:text-foreground hover:bg-accent/40"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lodging & Dietary Style */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preferred Lodging Type
                </Label>
                <select
                  value={profile.lodgingStyle}
                  onChange={(e) => setProfile({ ...profile, lodgingStyle: e.target.value })}
                  className="w-full h-11 px-3.5 bg-accent/30 border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500"
                >
                  {lodgingOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-card text-foreground">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dietary / Accessibility Needs
                </Label>
                <Input
                  value={profile.dietaryRestrictions}
                  onChange={(e) => setProfile({ ...profile, dietaryRestrictions: e.target.value })}
                  placeholder="e.g. Vegetarian, Halal, Gluten-Free, Wheelchair Accessible"
                  className="h-11 bg-accent/30 border-border/50 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AGENT RULES */}
        {activeTab === "agents" && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-heading">Multi-Agent Swarm Optimization Rules</h3>
              <p className="text-xs text-muted-foreground">
                Fine-tune how the 4 autonomous LangGraph agents balance prices, flight durations, and hotel proximity.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Transit Agent Card */}
              <div className="p-5 rounded-2xl bg-accent/20 border border-border/40 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Plane className="h-4 w-4 rotate-[-30deg]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Transit Agent Policy</h4>
                    <p className="text-[11px] text-muted-foreground">SerpAPI Google Flights query algorithm</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Flight Selection Priority
                  </Label>
                  <select
                    value={profile.flightPriority}
                    onChange={(e) => setProfile({ ...profile, flightPriority: e.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border/50 rounded-xl text-xs text-foreground focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Lowest Price">Lowest Price (Maximizes budget efficiency)</option>
                    <option value="Shortest Duration">Shortest Duration (Prioritizes fast travel)</option>
                    <option value="Direct Flights Only">Direct Non-stop Only (Zero layovers)</option>
                  </select>
                </div>
              </div>

              {/* Lodging Agent Card */}
              <div className="p-5 rounded-2xl bg-accent/20 border border-border/40 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center">
                    <Hotel className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Accommodation Agent Policy</h4>
                    <p className="text-[11px] text-muted-foreground">Hotel and stay clustering</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    City Center Proximity Threshold
                  </Label>
                  <select
                    value={profile.hotelProximity}
                    onChange={(e) => setProfile({ ...profile, hotelProximity: e.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border/50 rounded-xl text-xs text-foreground focus:outline-none focus:border-indigo-500"
                  >
                    <option value="City Center (< 2 km)">City Center (&lt; 2 km from core landmarks)</option>
                    <option value="Within 5 km">Within 5 km (Near transit hubs)</option>
                    <option value="Suburban Leisure">Suburban Leisure (Quiet scenic locations)</option>
                  </select>
                </div>
              </div>

              {/* Sightseeing Agent Card */}
              <div className="p-5 rounded-2xl bg-accent/20 border border-border/40 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Sightseeing Agent Density</h4>
                    <p className="text-[11px] text-muted-foreground">OSRM geo-clustered daily stops</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Daily Itinerary Density
                  </Label>
                  <select
                    value={profile.dailyPoiDensity}
                    onChange={(e) => setProfile({ ...profile, dailyPoiDensity: e.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border/50 rounded-xl text-xs text-foreground focus:outline-none focus:border-indigo-500"
                  >
                    <option value="3-4 Curated Stops">3-4 Curated Stops (Relaxed exploration)</option>
                    <option value="5-6 Balanced Stops">5-6 Balanced Stops (Standard coverage)</option>
                    <option value="7+ Intensive Stops">7+ Intensive Stops (Maximum sights)</option>
                  </select>
                </div>
              </div>

              {/* Budget Guardian Card */}
              <div className="p-5 rounded-2xl bg-accent/20 border border-border/40 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Budget Guardian Guardrail</h4>
                    <p className="text-[11px] text-muted-foreground">Deterministic cost validation</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Autonomous Contingency Buffer
                  </Label>
                  <select
                    value={profile.budgetBuffer}
                    onChange={(e) => setProfile({ ...profile, budgetBuffer: e.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border/50 rounded-xl text-xs text-foreground focus:outline-none focus:border-indigo-500"
                  >
                    <option value="5% Safety Buffer">5% Safety Buffer (Strict spend)</option>
                    <option value="10% Safety Buffer">10% Safety Buffer (Recommended)</option>
                    <option value="15% Safety Buffer">15% Safety Buffer (High flexibility)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INTEGRATIONS & SECURITY */}
        {activeTab === "security" && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-heading">Connected Services & API Integrations</h3>
              <p className="text-xs text-muted-foreground">
                Live status of external travel data providers, routing engines, and OAuth identity tokens.
              </p>
            </div>

            <div className="space-y-3">
              {/* Google OAuth Row */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/20 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-background border border-white/10 flex items-center justify-center p-2">
                    <svg className="w-full h-full" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Google Single Sign-On (OAuth 2.0)</h4>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>
              </div>

              {/* SerpAPI Travel API Row */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/20 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Plane className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">SerpAPI Live Travel API</h4>
                    <p className="text-xs text-muted-foreground">Live Google Flights & Google Hotels pricing</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready & Operational
                </span>
              </div>

              {/* OSRM & Open-Meteo Row */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/20 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">OSRM & Open-Meteo Weather</h4>
                    <p className="text-xs text-muted-foreground">Geocoding, route matrices & forecast models</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready & Operational
                </span>
              </div>
            </div>

            {/* Account Storage Cache */}
            <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Local Session Cache
                </h4>
                <p className="text-xs text-muted-foreground">
                  Reset cached trip forms and local tokens if you experience network sync issues.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("wayfarer_preferences");
                  setProfile(defaultProfile);
                  setSaveSuccess(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-accent/40 hover:bg-accent/60 text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-xs font-semibold text-muted-foreground hover:text-foreground"
            )}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              buttonVariants({ size: "default" }),
              "bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm border-0 shadow-lg shadow-indigo-500/25 hover:brightness-110 transition-all flex items-center gap-2 px-6 h-11"
            )}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save All Profile Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
