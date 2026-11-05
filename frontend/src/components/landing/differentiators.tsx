"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Check,
  ShieldCheck,
} from "lucide-react";

export function Differentiators() {
  const [demoSaved, setDemoSaved] = useState(true);

  return (
    <section id="differentiators" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column — Editorial Heading & Lifestyle Anchor Photo (Forth Reference Image 4) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="space-y-3">
              <h2 className="display-serif text-4xl sm:text-5xl lg:text-6xl">
                A reason to leave <br />
                <span className="italic text-primary">the group chat</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Everyone wants to travel and do more with their evenings. The plans just never make it out of the thread.
              </p>
            </div>

            {/* Lifestyle Image Anchor with Floating Badge */}
            <div className="relative rounded-[24px] overflow-hidden shadow-[0_24px_50px_-24px_oklch(0.2_0.01_55/0.3)] border border-border/60 group">
              <Image
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
                alt="Friends in Dubai"
                width={800}
                height={400}
                className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Floating Live Badge with gentle float (Forth Reference Image 4) */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 dark:bg-neutral-900/95 px-3.5 py-1.5 text-xs font-bold text-foreground shadow-lg backdrop-blur-md"
              >
                <span className="h-2 w-2 rounded-full bg-[#C84B22] animate-pulse" />
                <span>Today 1:00 PM · 9 going</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column — 3 Modular Benefit Stacks (Forth Reference Image 4) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-10 lg:pl-6"
          >
            {/* Benefit 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="space-y-3"
            >
              <h3 className="text-2xl font-bold font-heading text-foreground">
                See what&apos;s already happening
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                Rooftop dinners, padel games, five-a-side and late live sets. Wayfarer puts the city&apos;s good plans in one autonomous place.
              </p>

              {/* Mini Preview Widget */}
              <div className="pt-2 max-w-sm">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="p-3 rounded-2xl bg-accent/30 border border-border/50 flex items-center justify-between shadow-xs transition-colors hover:border-[#C84B22]/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                      🎾
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">
                        SOCIAL SPORT
                      </p>
                      <p className="text-xs font-bold text-foreground">
                        Padel after work
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Dubai Sports City · 8:30 PM
                      </p>
                    </div>
                  </div>
                  <span className="h-6 w-6 rounded-full bg-accent text-[11px] font-bold flex items-center justify-center text-muted-foreground">
                    4
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-3"
            >
              <h3 className="text-2xl font-bold font-heading text-foreground">
                Turn &ldquo;we should&rdquo; into a plan
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                Two taps save your place. The time, the cover and who&apos;s coming live on the card instead of page six of the thread.
              </p>

              {/* Mini Interactive Toggle Buttons (Forth Reference Image 4) */}
              <div className="pt-2 flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setDemoSaved(!demoSaved)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-[0_4px_12px_oklch(0.46_0.1_42/0.25)]"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Padel after work</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setDemoSaved(!demoSaved)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    demoSaved
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {demoSaved ? "Saved" : "Save"}
                </motion.button>
              </div>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-3"
            >
              <h3 className="text-2xl font-bold font-heading text-foreground">
                Meet people mid-activity
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                You already have something to talk about: the food, the match, the music. Turn up, enjoy the autonomous booking, and join in.
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#C84B22]">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero mock data · Real live tickets & verified stays</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
