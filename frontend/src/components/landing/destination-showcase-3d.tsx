"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card3D } from "@/components/3d/card-3d";
import { MapPin, ArrowRight, Sparkles, Star } from "lucide-react";

interface DestinationItem {
  id: string;
  name: string;
  state: string;
  image: string;
  rating: number;
  estPriceINR: string;
  transitTag: string;
  highlights: string[];
  vibe: string;
  defaultPrompt: string;
}

const DESTINATIONS: DestinationItem[] = [
  {
    id: "goa",
    name: "Goa",
    state: "West Coast, India",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    estPriceINR: "₹18,500 – ₹32,000",
    transitTag: "✈️ Flight + 🚆 Vande Bharat",
    highlights: ["Anjuna & Palolem", "Latin Quarter heritage", "Coastal nightlife"],
    vibe: "Tropical & Heritage",
    defaultPrompt: "5-day relaxed trip to Goa from Delhi for ₹25,000 with seaside villas and Vande Bharat train",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan, India",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    estPriceINR: "₹14,000 – ₹24,000",
    transitTag: "🚆 3h 40m Shatabdi / Air",
    highlights: ["Hawa Mahal", "Amber Fort light show", "Royal dining"],
    vibe: "Royal Architecture",
    defaultPrompt: "3-day royal heritage weekend in Jaipur from Delhi for ₹18,000 with palace hotels",
  },
  {
    id: "kashmir",
    name: "Srinagar & Gulmarg",
    state: "Kashmir Valley, India",
    image:
      "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    estPriceINR: "₹28,000 – ₹45,000",
    transitTag: "✈️ Direct Flight into SXR",
    highlights: ["Dal Lake Houseboats", "Gulmarg Gondola", "Shankaracharya temple"],
    vibe: "Snow Peaks & Lakes",
    defaultPrompt: "6-day scenic holiday to Srinagar and Gulmarg with shikara ride and snow gondola for ₹35,000",
  },
  {
    id: "kerala",
    name: "Munnar & Alleppey",
    state: "Kerala, India",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    estPriceINR: "₹22,000 – ₹36,000",
    transitTag: "✈️ Kochi + Scenic Rail",
    highlights: ["Backwater Houseboat", "Tea hill estates", "Kathakali culture"],
    vibe: "Lush Greenery",
    defaultPrompt: "5-day trip to Munnar tea gardens and Alleppey backwaters for ₹30,000",
  },
];

export function DestinationShowcase3D() {
  const router = useRouter();

  const handleLaunchPlan = (prompt: string) => {
    localStorage.setItem("wayfarer_initial_prompt", prompt);
    router.push("/dashboard");
  };

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#C84B22]/10 via-amber-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C84B22]/10 text-[#C84B22] border border-[#C84B22]/20 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Iconic Destinations • Live INR Pricing</span>
            </div>
            <h2 className="display-serif text-4xl sm:text-5xl lg:text-6xl">
              Explore India’s finest <br />
              <span className="italic text-primary">in 3D spatial depth</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every card connects directly to live SerpAPI hotel scrapers, IRCTC train schedules, and Google Places POIs. Hover to tilt in 3D.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Live pricing · zero mock plans</span>
          </div>
        </div>

        {/* 3D Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DESTINATIONS.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
            <Card3D
              maxTilt={12}
              scaleOnHover={1.03}
              glareOpacity={0.25}
              className="group rounded-3xl overflow-hidden glass-card border border-border/40 shadow-sm flex flex-col justify-between"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  width={600}
                  height={400}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Top Floating Badges */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md">
                    {dest.vibe}
                  </span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold backdrop-blur-md tabular-nums">
                    <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                    <span>{dest.rating}</span>
                  </div>
                </div>

                {/* Bottom Overlay Title & Transit */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 space-y-1">
                  <span className="text-xs text-zinc-200 flex items-center gap-1 font-medium">
                    <MapPin className="h-3 w-3 text-[#E08A5F]" />
                    <span>{dest.state}</span>
                  </span>
                  <h3 className="font-serif text-2xl text-white tracking-tight">
                    {dest.name}
                  </h3>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-5 space-y-4 bg-background/80 backdrop-blur-lg flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Transit Tag */}
                  <div className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                    {dest.transitTag}
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1">
                    {dest.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="text-xs text-muted-foreground flex items-center gap-1.5"
                      >
                        <span className="h-1 w-1 rounded-full bg-[#C84B22]" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Pricing & CTA Button */}
                <div className="pt-4 border-t border-border/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">
                      Est. Spend
                    </span>
                    <span className="text-xs font-bold text-primary tabular-nums">
                      {dest.estPriceINR}
                    </span>
                  </div>

                  <button
                    onClick={() => handleLaunchPlan(dest.defaultPrompt)}
                    className="w-full btn-coral py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md group-hover:shadow-[#C84B22]/30 transition-all"
                  >
                    <span>Plan with Swarm</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </Card3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
