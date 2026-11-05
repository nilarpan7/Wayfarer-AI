"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export function HowItWorks() {
  const [activeMode, setActiveMode] = useState<"discover" | "host">("discover");

  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header (Forth Reference Image 2) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 lg:mb-20"
        >
          <div className="space-y-3 max-w-xl">
            <h2 className="display-serif text-4xl sm:text-5xl lg:text-6xl">
              Plans, without <br />
              <span className="italic text-primary">the planning</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Find something worth leaving home for, save a place, and watch your autonomous itinerary come together in seconds.
            </p>
          </div>

          {/* Segmented Toggle with Framer Motion layoutId (Forth Reference Image 2) */}
          <div className="p-1 rounded-full bg-secondary/70 border border-border/60 flex items-center gap-1 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveMode("discover")}
              className="relative px-5 py-2 text-xs font-bold rounded-full transition-colors"
            >
              {activeMode === "discover" && (
                <motion.div
                  layoutId="howItWorksToggle"
                  className="absolute inset-0 bg-primary text-primary-foreground rounded-full shadow-[0_4px_12px_oklch(0.46_0.1_42/0.25)]"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  activeMode === "discover" ? "text-primary-foreground font-extrabold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Discover
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("host")}
              className="relative px-5 py-2 text-xs font-bold rounded-full transition-colors"
            >
              {activeMode === "host" && (
                <motion.div
                  layoutId="howItWorksToggle"
                  className="absolute inset-0 bg-primary text-primary-foreground rounded-full shadow-[0_4px_12px_oklch(0.46_0.1_42/0.25)]"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  activeMode === "host" ? "text-primary-foreground font-extrabold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Host & Custom
              </span>
            </button>
          </div>
        </motion.div>

        {/* Dual-Tone Large Cards Grid (Forth Reference Image 2) */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card 01 — Soft Periwinkle/Lavender Container (Forth Reference Image 2) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[28px] bg-card p-8 sm:p-10 border border-border/50 spotlight-card overflow-hidden flex flex-col justify-between shadow-sm hover-lift"
          >
            <div className="space-y-4">
              <span className="text-sm font-bold text-primary font-heading">
                01
              </span>
              <h3 className="font-heading text-2xl sm:text-3xl text-foreground">
                See what fits your trip
              </h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400 max-w-sm leading-relaxed">
                4 autonomous agents search live flights, verified tables, and sports matches around your exact budget.
              </p>
            </div>

            {/* Mock Mobile Card Inside 01 */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="mt-8 rounded-3xl bg-card p-5 shadow-sm border border-border/50 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/5 text-neutral-900 dark:text-white">
                <span className="font-bold text-sm font-heading">wayfarer</span>
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                  alt="User"
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-zinc-400 uppercase font-semibold">
                  <span>DUBAI · THURSDAY</span>
                  <span>18 plans</span>
                </div>
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Free tonight?
                </h4>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="px-3 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-bold">
                  Tonight
                </span>
                <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-zinc-300 text-[11px] font-semibold">
                  Near me
                </span>
                <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-zinc-300 text-[11px] font-semibold">
                  Free
                </span>
              </div>

              {/* Mini Item 1 */}
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    🎾
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-400">
                      SOCIAL SPORT
                    </p>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      Padel after work
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-zinc-400">
                      Dubai Sports City · 8:30 PM
                    </p>
                  </div>
                </div>
                <span className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-white/10 text-[11px] font-bold flex items-center justify-center text-neutral-700 dark:text-zinc-300">
                  4
                </span>
              </div>

              {/* Mini Item 2 */}
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#C84B22] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    🍸
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-400">
                      DINNER
                    </p>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      Jumeirah rooftop dinner
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-zinc-400">
                      Jumeirah 1 · 8:00 PM
                    </p>
                  </div>
                </div>
                <span className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-white/10 text-[11px] font-bold flex items-center justify-center text-neutral-700 dark:text-zinc-300">
                  2
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Card 02 — Warm Terracotta/Coral Container (Forth Reference Image 2) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[28px] bg-gradient-to-br from-[#FBF0E9] to-card p-8 sm:p-10 border border-border/50 spotlight-card overflow-hidden flex flex-col justify-between shadow-sm hover-lift"
          >
            <div className="space-y-4">
              <span className="text-sm font-bold text-[#C84B22] font-heading">
                02
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-900 dark:text-white">
                Save your place
              </h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400 max-w-sm leading-relaxed">
                One tap. No awkward back-and-forth. Real prices and verified booking deep-links.
              </p>
            </div>

            {/* Mock Confirmed Card Inside 02 */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="mt-8 rounded-3xl bg-card p-6 shadow-sm border border-border/50 space-y-4"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5 text-[#C84B22]">
                  <span className="h-2 w-2 rounded-full bg-[#C84B22]" />
                  <span>Confirmed</span>
                </div>
                <span className="text-neutral-900 dark:text-white tabular-nums font-semibold">
                  AED 120
                </span>
              </div>

              {/* Graphic Art Scene Banner */}
              <div className="h-28 w-full rounded-2xl bg-gradient-to-br from-amber-200 via-rose-300 to-indigo-300 overflow-hidden relative group">
                <Image
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
                  alt="Dinner"
                  width={600}
                  height={120}
                  className="h-full w-full object-cover mix-blend-multiply opacity-80 transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-400">
                  SATURDAY · 8:00 PM
                </p>
                <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                  Jumeirah rooftop dinner
                </h4>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  Four courses on a Jumeirah rooftop.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-coral w-full py-3 rounded-2xl text-xs font-bold shadow-md"
              >
                1-Click Verified Booking Deep-Link
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


