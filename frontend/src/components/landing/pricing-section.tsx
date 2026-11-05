"use client";

import { cn } from "@/lib/utils";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Explorer",
    price: "Free",
    period: "",
    description: "Perfect for discovering curated city plans and trying multi-agent travel intelligence.",
    features: [
      "3 autonomous trip plans per month",
      "Live flight & hotel price validation",
      "Google Flights & Hotels live data",
      "Interactive map itinerary",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Voyager Pro",
    price: "₹1,499",
    period: "/month",
    description: "For frequent travelers who want unlimited autonomous agent runs and deep-link booking passes.",
    features: [
      "Unlimited multi-agent trip plans",
      "Real-time LangGraph execution streaming",
      "1-click verified flight & hotel booking passes",
      "Autonomous budget safety guardrails",
      "Apple Wallet & PDF export",
      "Custom agent preference overrides",
    ],
    cta: "Get Voyager Pro",
    popular: true,
  },
  {
    name: "Concierge Swarm",
    price: "Custom",
    period: "",
    description: "For agencies and corporate travel teams managing high-volume complex itineraries.",
    features: [
      "Everything in Voyager Pro",
      "Dedicated multi-agent swarm cluster",
      "Custom corporate travel policy rules",
      "Multi-user team collaboration",
      "Dedicated account strategist",
      "SLA & 99.9% uptime guarantees",
    ],
    cta: "Contact Team",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center space-y-3 mb-16 lg:mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C84B22]">
            TRANSPARENT PRICING
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Plans for every <span className="text-[#C84B22]">traveler</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Start free, save plans, and upgrade when you want unlimited real-time autonomous agent runs.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-[32px] p-8 sm:p-10 transition-all duration-300 flex flex-col justify-between ${
                plan.popular
                  ? "glass-card border-2 border-[#C84B22]/60 shadow-2xl bg-gradient-to-b from-[#C84B22]/5 to-transparent"
                  : "glass-card border border-white/10 shadow-lg"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="btn-coral px-4 py-1 rounded-full text-[11px] font-bold shadow-md uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl sm:text-5xl font-heading font-extrabold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm font-medium">{plan.period}</span>
                  )}
                </div>

                {/* CTA Button */}
                <Link
                  href="/sign-up"
                  className={cn(
                    "w-full py-3 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center",
                    plan.popular
                      ? "btn-coral btn-sheen"
                      : "bg-primary/10 text-primary ring-1 ring-primary/25 hover:bg-primary/15"
                  )}
                >
                  {plan.cta}
                </Link>

                {/* Feature list */}
                <div className="pt-4 border-t border-border/40 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Includes:
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 mt-0.5">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

