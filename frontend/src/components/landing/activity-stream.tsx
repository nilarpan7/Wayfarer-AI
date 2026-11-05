"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Compass,
  Sparkles,
  Check,
  Bookmark,
  ChevronRight,
} from "lucide-react";

interface ActivityPill {
  title: string;
  location: string;
  image: string;
  category: string;
}

const rowOneActivities: ActivityPill[] = [
  {
    title: "Coffee walks",
    location: "Jumeirah",
    category: "Cafe",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Padel after work",
    location: "Dubai Sports City",
    category: "Social Sport",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Live jazz sets",
    location: "DIFC",
    category: "Music",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Evening brunches",
    location: "Palm Jumeirah",
    category: "Dining",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Omakase tasting",
    location: "Ginza, Tokyo",
    category: "Food Crawl",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Chef's tables",
    location: "Le Marais, Paris",
    category: "Culinary",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Al Qudra rides",
    location: "Al Qudra",
    category: "Cycling",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=120&q=80",
  },
];

const rowTwoActivities: ActivityPill[] = [
  {
    title: "Indoor climbing",
    location: "Al Quoz",
    category: "Fitness",
    image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Karama food crawls",
    location: "Al Karama",
    category: "Street Food",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Five-a-side football",
    location: "Trade Centre",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Shibuya speakeasies",
    location: "Shibuya, Tokyo",
    category: "Nightlife",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Quiz nights",
    location: "JLT",
    category: "Social",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Sunset wine rooftop",
    location: "Dumbo, New York",
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Old town galleries",
    location: "Marais, Paris",
    category: "Art",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=120&q=80",
  },
];

const boardScheduleDubai = [
  {
    day: "WEDNESDAY",
    title: "Padel after work",
    location: "Dubai Sports City",
    time: "8:30 PM",
    price: "AED 85",
    category: "Social Sport",
    categoryBadge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    iconBg: "bg-blue-600",
    saved: true,
  },
  {
    day: "THURSDAY",
    title: "Dinner + Live set",
    location: "DIFC",
    time: "9:00 PM",
    price: "AED 160",
    category: "Music & Food",
    categoryBadge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    iconBg: "bg-purple-600",
    saved: true,
  },
  {
    day: "FRIDAY",
    title: "Karama street eats",
    location: "Al Karama",
    time: "7:00 PM",
    price: "AED 60",
    category: "Food Crawl",
    categoryBadge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    iconBg: "bg-amber-600",
    saved: false,
  },
  {
    day: "SATURDAY",
    title: "Jumeirah rooftop dinner",
    location: "Jumeirah 1",
    time: "8:00 PM",
    price: "AED 220",
    category: "Dinner",
    categoryBadge: "bg-[#C84B22]/10 text-[#C84B22] border-[#C84B22]/20",
    iconBg: "bg-[#C84B22]",
    saved: true,
  },
];

export function ActivityStream() {
  const [activeCity, setActiveCity] = useState("Dubai");
  const [boardDays, setBoardDays] = useState(boardScheduleDubai);

  const toggleSave = (index: number) => {
    setBoardDays((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, saved: !item.saved } : item
      )
    );
  };

  return (
    <section id="activities" className="relative py-20 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        {/* Section Header (Forth Style) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading tracking-tight">
              This week in <span className="text-[#C84B22]">{activeCity}</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xs md:text-right">
            Sixteen kinds of autonomous plans across the city this week.
          </p>
        </motion.div>
      </div>

      {/* Dual Row Horizontal Scrolling Activity Stream */}
      <div className="space-y-4 mb-16 relative">
        {/* Left/Right Vignette Blurs */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Row 1 — Forward Scroll */}
        <div className="flex animate-marquee hover:[animation-play-state:paused] gap-3 select-none">
          {[...rowOneActivities, ...rowOneActivities, ...rowOneActivities].map((act, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.04, y: -2 }}
              className="flex items-center gap-3 p-2 pr-4 rounded-2xl glass-card border border-border/40 hover:border-[#C84B22]/40 transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              <Image
                src={act.image}
                alt={act.title}
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-foreground">{act.title}</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="text-muted-foreground">{act.location}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Row 2 — Reverse Scroll */}
        <div className="flex animate-marquee-reverse hover:[animation-play-state:paused] gap-3 select-none">
          {[...rowTwoActivities, ...rowTwoActivities, ...rowTwoActivities].map((act, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.04, y: -2 }}
              className="flex items-center gap-3 p-2 pr-4 rounded-2xl glass-card border border-border/40 hover:border-[#C84B22]/40 transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              <Image
                src={act.image}
                alt={act.title}
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-foreground">{act.title}</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="text-muted-foreground">{act.location}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* The Board · This Week (Interactive Schedule Card with Framer Motion) */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-card rounded-[32px] p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-5 mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                THE BOARD · THIS WEEK
              </p>
              <h3 className="text-2xl font-bold font-heading mt-1">One good week</h3>
            </div>
            {/* Animated City Switcher Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-accent/40 border border-border/40">
              {["Dubai", "Tokyo", "Paris"].map((c) => {
                const isActive = activeCity === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveCity(c)}
                    className="relative text-xs px-3.5 py-1.5 rounded-full font-bold transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCityTab"
                        className="absolute inset-0 bg-[#C84B22] rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 ${isActive ? "text-white" : "text-muted-foreground hover:text-foreground"}`}>
                      {c.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule list */}
          <div className="space-y-4">
            {boardDays.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="space-y-1.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 pl-1">
                  {item.day}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-accent/20 border border-border/40 hover:bg-accent/30 transition-all">
                  <div className="flex items-center gap-3.5">
                    <div className={`h-11 w-11 rounded-xl ${item.iconBg} flex items-center justify-center text-white shadow-md font-bold text-sm shrink-0`}>
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-foreground">
                          {item.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${item.categoryBadge}`}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.location} · {item.time} · <span className="font-semibold text-foreground/90">{item.price}</span>
                      </p>
                    </div>
                  </div>

                  {/* Save toggle button with tactile spring pop */}
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => toggleSave(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 shadow-xs ${
                      item.saved
                        ? "bg-blue-600 text-white"
                        : "bg-accent/40 text-muted-foreground hover:text-foreground border border-border/50 hover:bg-accent/60"
                    }`}
                  >
                    {item.saved ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>Save</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C84B22]" />
              Multi-agent LangGraph engine balances cost and travel times autonomously.
            </span>
            <Link
              href="/dashboard"
              className="text-[#C84B22] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Build your custom week</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
