"use client";

import { motion } from "framer-motion";
import {
  Plane,
  Hotel,
  MapPin,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Plane,
    title: "Flights & Indian Railways",
    description:
      "Multimodal transit covering live flights and Indian Railways (IRCTC, Vande Bharat, Rajdhani) with transparent fares in INR and 1-click booking.",
  },
  {
    icon: Hotel,
    title: "Smart Lodging Engine",
    description:
      "Hotels ranked by proximity to your transit hub and daily activities, filtered by your budget in real-time.",
  },
  {
    icon: MapPin,
    title: "Geo-Synced Activities",
    description:
      "Attractions clustered by geography and scheduled to minimize travel time. Opening hours automatically accounted for.",
  },
  {
    icon: ShieldCheck,
    title: "Budget Guardian",
    description:
      "Autonomous validator agent ensures total spend stays under budget. If it exceeds, the system re-optimizes automatically.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-3 mb-16 lg:mb-20"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#C84B22]">
            CORE CAPABILITIES
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            What makes Wayfarer AI <span className="text-[#C84B22]">powerful</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Each domain is handled by a specialized AI agent with access to live market data.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group relative rounded-[28px] p-8 sm:p-10 glass-card border border-border/40 spotlight-card transition-all duration-300 hover:shadow-[0_20px_40px_-16px_oklch(0.2_0.01_55/0.12)] overflow-hidden"
              >
                <div className="relative">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 8, scale: 1.15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 12 }}
                    className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 mb-6"
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>

                  <h3 className="text-xl font-heading font-extrabold mb-2.5 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

