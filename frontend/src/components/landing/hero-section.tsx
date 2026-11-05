"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Plane,
  Train,
  MapPin,
  ShieldCheck,
  Sparkles,
  Clock,
  Route as RouteIcon,
} from "lucide-react";

const suggestions = [
  { label: "Goa · 5 days", query: "5-day relaxed trip to Goa from Delhi for ₹25,000" },
  { label: "Jaipur · 3 days", query: "3-day royal heritage trip to Jaipur for ₹18,000" },
  { label: "Kashmir · 6 days", query: "6-day scenic holiday to Srinagar and Kashmir for ₹35,000" },
];

const route = [
  { code: "DEL", label: "New Delhi", time: "07:40", type: "flight", price: "₹5,450" },
  { code: "GOI", label: "Goa", time: "10:20", type: "hotel", price: "₹4,200" },
  { code: "", label: "North & South", time: "12 activities", type: "map", price: "" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

const headlineWords = ["Your", "next", "journey,", "already", "planned."];

const embers = [
  { left: "8%", top: "22%", size: 5, dur: 9, delay: 0 },
  { left: "16%", top: "70%", size: 3, dur: 11, delay: 1.2 },
  { left: "30%", top: "38%", size: 4, dur: 8, delay: 0.6 },
  { left: "55%", top: "80%", size: 3, dur: 12, delay: 2 },
  { left: "72%", top: "28%", size: 5, dur: 10, delay: 0.9 },
  { left: "86%", top: "58%", size: 4, dur: 9.5, delay: 1.6 },
  { left: "94%", top: "20%", size: 3, dur: 11.5, delay: 0.3 },
  { left: "43%", top: "14%", size: 3, dur: 10.5, delay: 2.4 },
];

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

const wordReveal = {
  hidden: { opacity: 0, y: "0.45em", rotateX: 45, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE },
  },
};

export function HeroSection() {
  const router = useRouter();
  const [promptInput, setPromptInput] = useState("");

  const btnRef = useRef<HTMLButtonElement>(null);
  const [magnet, setMagnet] = useState({ x: 0, y: 0 });

  const [photoTilt, setPhotoTilt] = useState({ x: 0, y: 0 });

  const go = (query: string) => {
    if (query.trim()) localStorage.setItem("wayfarer_initial_prompt", query);
    router.push("/dashboard");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    go(promptInput);
  };

  const handleMagnetMove = (e: React.MouseEvent) => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const cap = 7;
    setMagnet({
      x: Math.max(-cap, Math.min(cap, dx)),
      y: Math.max(-cap, Math.min(cap, dy)),
    });
  };

  const handleMagnetLeave = () => setMagnet({ x: 0, y: 0 });

  const handlePhotoMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setPhotoTilt({ x: nx * 8, y: ny * 8 });
  };

  const handlePhotoLeave = () => setPhotoTilt({ x: 0, y: 0 });

  return (
    <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24">
      {/* Warm ambient atmosphere */}
      <div className="absolute inset-0 pointer-events-none ambient-copper" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Living copper embers */}
      <div className="absolute inset-0 pointer-events-none">
        {embers.map((e, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-[#C84B22]"
            style={{
              left: e.left,
              top: e.top,
              width: e.size,
              height: e.size,
              boxShadow: "0 0 12px 2px oklch(0.46 0.1 42 / 0.35)",
              filter: "blur(0.5px)",
            }}
            animate={{
              y: [0, -64, 0],
              opacity: [0.15, 0.75, 0.15],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: e.dur,
              delay: e.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-14 lg:gap-8 items-center">
          {/* LEFT — Editorial copy */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="lg:col-span-6"
          >
            <motion.div variants={fadeUp} className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-border bg-card/70 px-3.5 py-1.5 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C84B22] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C84B22]" />
              </span>
              <span className="kicker m-0">Autonomous multi-agent travel intelligence</span>
            </motion.div>

            {/* Fractional editorial headline — word-by-word cinematic reveal */}
            <motion.h1
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="display-serif text-[clamp(2.75rem,7.5vw,6rem)] text-foreground perspective-2000"
            >
              {headlineWords.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.18em] last:mr-0">
                  <motion.span
                    variants={wordReveal}
                    className={
                      "inline-block [transform-style:preserve-3d] " +
                      (i === 3 ? "italic text-[#C84B22]" : "")
                    }
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground"
            >
              Tell Wayfarer what you want. Six specialized agents search live flight, rail
              and hotel inventory in real time — then assemble a complete, bookable
              itinerary with your budget intact.
            </motion.p>

            {/* CTA — one quiet field */}
            <motion.form
              variants={fadeUp}
              onSubmit={handleSubmit}
              className="mt-9 flex flex-col sm:flex-row items-stretch gap-3 max-w-xl"
            >
              <div className="group flex flex-1 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-all duration-300 focus-within:border-[#C84B22]/60 focus-within:shadow-[0_0_0_4px_oklch(0.46_0.1_42/0.08)]">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-[#C84B22]" />
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. 5 days in Goa from Delhi for ₹25,000"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
              <motion.button
                ref={btnRef}
                type="submit"
                animate={{ x: magnet.x, y: magnet.y }}
                transition={{ duration: 0.18, ease: EASE }}
                whileTap={{ scale: 0.98 }}
                onMouseMove={handleMagnetMove}
                onMouseLeave={handleMagnetLeave}
                className="btn-coral btn-sheen inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3 text-sm font-semibold"
              >
                Plan my trip
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.form>

            {/* Suggestions */}
            <motion.div variants={fadeUp} className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Popular:</span>
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => go(s.query)}
                  className="rounded-full border border-border bg-card/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-300 hover:-translate-y-px hover:border-[#C84B22]/50 hover:text-foreground"
                >
                  {s.label}
                </button>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Live data, zero mock plans
              </span>
              <span className="flex items-center gap-1.5">
                <Train className="h-3.5 w-3.5 text-sky-700" />
                IRCTC · Vande Bharat
              </span>
              <span className="flex items-center gap-1.5">
                <Plane className="h-3.5 w-3.5 text-[#C84B22]" />
                Flights via SerpAPI
              </span>
            </motion.div>
          </motion.div>

          {/* RIGHT — Cinematic layered panel */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.9, ease: EASE }}
            className="lg:col-span-6 flex justify-center"
          >
            <div className="w-full max-w-[440px]">
              {/* Photo card — cinematic, floating stat chips */}
              <div className="relative">
                <div
                  className="photo-frame cursor-zoom-in rounded-[28px] border border-border shadow-[0_24px_60px_-24px_oklch(0.2_0.01_55/0.3)]"
                  onMouseMove={handlePhotoMove}
                  onMouseLeave={handlePhotoLeave}
                  style={
                    {
                      "--px": `${photoTilt.x}px`,
                      "--py": `${photoTilt.y}px`,
                    } as React.CSSProperties
                  }
                >
                  <Image
                    src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80"
                    alt="Goa coastline"
                    width={900}
                    height={560}
                    className="h-[320px] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform [transform:translate3d(var(--px),var(--py),0)_scale(1.08)] sm:h-[360px]"
                  />
                  {/* Live chip */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Live search · 6 agents running
                  </motion.div>
                  {/* Floating budget chip */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.7, ease: EASE }}
                    className="absolute bottom-4 right-4 inline-flex items-center gap-2.5 rounded-2xl border border-white/25 bg-black/45 px-4 py-2.5 text-[11px] text-white shadow-lg backdrop-blur-md"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#F2A884]" />
                    <span>
                      <span className="block font-semibold">Budget Guardian</span>
                      <span className="text-white/70">₹23,400 / ₹25,000</span>
                    </span>
                  </motion.div>
                </div>

                {/* Floating route marker */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-6 top-1/2 hidden lg:flex flex-col items-center"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C84B22] opacity-40" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#C84B22]" />
                  </span>
                  <span className="route-line mt-2 h-16" />
                </motion.div>
              </div>

              {/* Route card — boarding pass motif */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.85, ease: EASE }}
                className="mt-5 rounded-[24px] border border-border bg-card p-5 shadow-sm hover-lift"
              >
                <div className="flex items-center justify-between pb-4">
                  <span className="kicker flex items-center gap-2">
                    <RouteIcon className="h-3.5 w-3.5" />
                    Itinerary · draft
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    6 days · 4 stops
                  </span>
                </div>

                <div className="flex items-start gap-0">
                  {route.map((stop, i) => (
                    <div key={i} className="relative flex flex-1 flex-col">
                      {i > 0 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.65 + i * 0.14, duration: 0.6, ease: EASE }}
                          style={{ transformOrigin: "left" }}
                          className="absolute right-[58%] top-[7px] h-px w-full dotted"
                        />
                      )}
                      <div className="inline-flex items-center justify-center">
                        <span className="route-dot" />
                      </div>
                      <div className="mt-2.5 pr-2">
                        {stop.code ? (
                          <p className="text-sm font-bold text-foreground">{stop.code}</p>
                        ) : (
                          <p className="text-sm font-bold text-foreground">{stop.label}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">{stop.time}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                          {stop.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3 text-xs">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-[#C84B22]" />
                    Budget Guardian audit
                  </span>
                  <span className="font-semibold text-primary">
                    Under budget ✓
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
