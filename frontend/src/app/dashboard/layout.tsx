"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Plane,
  LogOut,
  Plus,
  User as UserIcon,
  LayoutDashboard,
  Sun,
  Moon,
} from "lucide-react";
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  type SessionUser,
} from "@/lib/api";

const cities = [
  { name: "Dubai", timeZone: "Asia/Dubai" },
  { name: "Tokyo", timeZone: "Asia/Tokyo" },
  { name: "Paris", timeZone: "Europe/Paris" },
  { name: "New York", timeZone: "America/New_York" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [cityIndex, setCityIndex] = useState(0);
  const [cityTime, setCityTime] = useState("");

  const isDark = (mounted && (resolvedTheme || theme)) === "dark";

  // Auth guard — the dashboard requires a real backend credential.
  // (The API itself also rejects unauthenticated requests.)
  useEffect(() => {
    if (status === "loading") return;

    const hasBackendCredential = Boolean(getStoredToken() || session?.backendToken);

    if (!hasBackendCredential) {
      clearAuthSession();
      router.replace("/sign-in");
    }
  }, [status, session, router]);

  const storedUser = mounted ? getStoredUser() : null;
  const user: SessionUser = {
    name: session?.user?.name || storedUser?.name || "Traveler",
    email: session?.user?.email || storedUser?.email,
    image: session?.user?.image || storedUser?.image || null,
  };

  const isAuthenticating = status === "loading" || (!session?.backendToken && mounted && !getStoredToken());

  useEffect(() => {
    const cityInterval = setInterval(() => {
      setCityIndex((prev) => (prev + 1) % cities.length);
    }, 6000);

    return () => clearInterval(cityInterval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const currentCity = cities[cityIndex];
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: currentCity.timeZone,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        setCityTime(formatter.format(new Date()));
      } catch {
        setCityTime("10:53 PM");
      }
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 10000);
    return () => clearInterval(timeInterval);
  }, [cityIndex]);

  const handleLogout = async () => {
    clearAuthSession();
    await signOut({ callbackUrl: "/sign-in" });
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="h-6 w-6 border-2 border-[#C84B22]/30 border-t-[#C84B22] rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Verifying your session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" suppressHydrationWarning>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/50 glass" suppressHydrationWarning>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" suppressHydrationWarning>
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 dark:bg-white/10 border border-border/40 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Plane className="h-4.5 w-4.5 text-[#C84B22] rotate-[-30deg]" />
              </div>
              <span className="text-lg font-bold font-heading tracking-tight">
                wayfarer<span className="text-[#C84B22]">.ai</span>
              </span>
            </Link>

            {/* Live City Clock */}
            {mounted && (
              <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-border/60 text-xs font-medium text-muted-foreground">
                <span className="font-semibold text-foreground/80">{cities[cityIndex].name}</span>
                <span className="tabular-nums">{cityTime || "10:53 PM"}</span>
              </div>
            )}

            {/* Nav Tabs */}
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard"
                className={`relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  pathname === "/dashboard"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 text-[#C84B22]" />
                <span>Planner Hub</span>
                {pathname === "/dashboard" && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C84B22] rounded-full animate-fade-in" />
                )}
              </Link>
              <Link
                href="/dashboard/profile"
                className={`relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  pathname === "/dashboard/profile"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserIcon className="h-4 w-4 text-violet-400" />
                <span>Profile & Settings</span>
                {pathname === "/dashboard/profile" && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C84B22] rounded-full animate-fade-in" />
                )}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3" suppressHydrationWarning>
            {/* Theme Toggle */}
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-accent/50"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}

            <Link
              href="/dashboard"
              className="btn-coral rounded-full px-4 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Plan</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-border/50" suppressHydrationWarning>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 group p-1 rounded-xl hover:bg-accent/40 transition-colors"
                title="View Profile & Settings"
              >
                {mounted && user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={32}
                    height={32}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-[#C84B22]/50 shadow-sm"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C84B22]/15 text-[#C84B22] font-semibold text-xs border border-[#C84B22]/30 group-hover:border-[#C84B22]/60"
                    suppressHydrationWarning
                  >
                    {mounted && user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                )}
                <span
                  className="hidden md:inline text-xs font-semibold text-muted-foreground group-hover:text-foreground"
                  suppressHydrationWarning
                >
                  {mounted && user?.name ? user.name : "Traveler"}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

