"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  MapPin,
  ChevronRight,
} from "lucide-react";

export function LifecycleSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      time: "6:12 PM",
      status: "Discovered",
      detail:
        "See live flight prices, boutique stays, carrier details, and remaining places before you commit.",
      cover: "AED 120",
      statusBadge: "• LIVE SEARCH",
      btnText: "Explore Options",
      btnBg: "bg-primary",
    },
    {
      time: "7:02 PM",
      status: "Saved",
      detail:
        "Your budget is safeguarded. The 4 LangGraph agents cluster your POIs and optimize your travel matrix.",
      cover: "AED 120",
      statusBadge: "• GEO-OPTIMIZED",
      btnText: "Save your place",
      btnBg: "btn-coral",
    },
    {
      time: "7:41 PM",
      status: "Confirmed",
      detail:
        "1-click verified booking deep-links and complete PDF/Calendar exports are generated instantly.",
      cover: "CONFIRMED",
      statusBadge: "• PASS ISSUED",
      btnText: "View Boarding Pass",
      btnBg: "bg-primary",
    },
  ];

  const currentStepData = steps[activeStep];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-accent/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mb-16 lg:mb-20 space-y-3"
        >
          <h2 className="display-serif text-4xl sm:text-5xl lg:text-6xl">
            From discovered <br className="hidden sm:inline" />
            <span className="italic text-primary">to confirmed</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            The same screen grows with the plan: live prices once you search, the geo-cluster once you save, the exact booking passes when you&apos;re in.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column — Step Timeline Card (Forth Reference Image 3) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-4"
          >
            <div className="glass-card rounded-[24px] p-6 sm:p-8 border border-border/50 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  • TONIGHT&apos;S PLAN
                </span>
                <span className="text-[11px] font-bold text-[#C84B22]">
                  2 places left · address locked
                </span>
              </div>

              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const isSelected = activeStep === idx;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setActiveStep(idx)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                        isSelected
                          ? "bg-[#C84B22]/10 border-[#C84B22]/40 shadow-sm"
                          : "bg-accent/20 border-transparent hover:bg-accent/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full transition-colors ${
                              isSelected ? "bg-[#C84B22]" : "bg-muted-foreground/40"
                            }`}
                          />
                          <span
                            className={`text-sm font-bold ${
                              isSelected ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {step.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                        {step.detail}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="pt-3 text-center">
                <Link
                  href="/dashboard"
                  className="btn-coral w-full py-3.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Experience Multi-Agent Booking</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right Column — Realistic iPhone Device Frame with Motion (Forth Reference Image 3) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-[360px] rounded-[48px] bg-[#14100c] p-3.5 ring-1 ring-black/60 shadow-[0_40px_80px_-24px_oklch(0.2_0.01_55/0.4)]"
            >
              {/* Dynamic Island */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 h-5 w-24 bg-black rounded-full z-30" />

              {/* Inner Screen */}
              <div className="relative rounded-[38px] overflow-hidden bg-background border border-neutral-800 text-foreground flex flex-col min-h-[500px]">
                {/* Status Bar */}
                <div className="h-10 px-6 pt-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>10:55</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">5G</span>
                    <div className="h-2.5 w-4 border border-current rounded-sm p-0.5 flex items-center">
                      <div className="h-full w-full bg-current rounded-xs" />
                    </div>
                  </div>
                </div>

                {/* Mobile Header */}
                <div className="px-5 py-2 flex items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">Tonight</span>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="Host"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-[#C84B22]"
                  />
                </div>

                {/* Hero Scene Photo */}
                <div className="relative h-44 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
                    alt="Dining Scene"
                    width={600}
                    height={176}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                </div>

                {/* Event Details Content with AnimatePresence */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 space-y-4 -mt-4 relative z-10 bg-background rounded-t-3xl"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C84B22]/10 text-[#C84B22] border border-[#C84B22]/20">
                          {currentStepData.statusBadge}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Sat 8:00 PM
                        </span>
                      </div>
                      <h3 className="text-base font-bold font-heading">
                        Jumeirah rooftop tasting
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-[#C84B22]" />
                        <span>Jumeirah 1 · exact address after you confirm</span>
                      </p>
                    </div>

                    {/* 3 Column Meta Grid */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-accent/30 border border-border/40 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Cover</p>
                        <p className="text-xs font-bold text-foreground">{currentStepData.cover}</p>
                      </div>
                      <div className="border-x border-border/40">
                        <p className="text-[10px] text-muted-foreground uppercase">Table</p>
                        <p className="text-xs font-bold text-foreground">10 guests</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Places</p>
                        <p className="text-xs font-bold text-[#C84B22]">2 left</p>
                      </div>
                    </div>

                    {/* Host badge */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-accent/20 border border-border/40">
                      <div className="flex items-center gap-2">
                        <Image
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                          alt="Noor"
                          width={24}
                          height={24}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                        <span className="text-xs font-semibold">Noor</span>
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Filling fast
                      </span>
                    </div>

                    {/* Primary CTA Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-3 rounded-full text-xs font-bold shadow-md text-white ${currentStepData.btnBg}`}
                    >
                      {currentStepData.btnText}
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
