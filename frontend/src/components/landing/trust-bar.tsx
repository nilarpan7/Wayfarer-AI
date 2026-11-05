"use client";

import { useEffect, useRef, useState } from "react";
import { Plane, Train, Map, Building2 } from "lucide-react";

function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const t0 = performance.now();
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      el.textContent = String(Math.round(ease(p) * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {started ? 0 : value}
    </span>
  );
}

const integrations = [
  { name: "Google Flights", detail: "live fares", icon: Plane },
  { name: "IRCTC · Vande Bharat", detail: "rail inventory", icon: Train },
  { name: "Amadeus", detail: "aviation data", icon: Building2 },
  { name: "Google Maps / Places", detail: "geo POIs", icon: Map },
];

const stats = [
  { value: "6", label: "specialist agents" },
  { value: "0", label: "mock itineraries" },
  { value: "Live", label: "price validation" },
  { value: "1-click", label: "booking links" },
];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Every plan is assembled from live sources
        </p>

        <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
          {integrations.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.name} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="display-serif text-3xl text-foreground">
                {/^\d+$/.test(s.value) ? <CountUp value={Number(s.value)} /> : s.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
