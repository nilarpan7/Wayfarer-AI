"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Plane, Mail, ArrowRight } from "lucide-react";

const columns = {
  Product: [
    { label: "Trending plans", href: "#activities" },
    { label: "Why Wayfarer", href: "#differentiators" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Safety & privacy", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy policy", href: "#" },
    { label: "Terms of service", href: "#" },
    { label: "Travel API policy", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/60">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-6 lg:gap-8">
          {/* Brand + newsletter */}
          <div className="space-y-5 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card">
                <Plane className="h-4 w-4 -rotate-12 text-[#C84B22]" />
              </div>
              <span className="display-serif text-lg text-foreground">
                wayfarer<span className="text-[#C84B22]">.ai</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Autonomous multi-agent travel. Real-time prices, real bookings, and a
              complete itinerary you can execute.
            </p>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-foreground">Get travel notes</p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <Input
                  type="email"
                  placeholder="you@email.com"
                  className="h-10 rounded-xl border-border bg-card text-sm"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="btn-coral flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(columns).map(([title, links]) => (
            <div key={title} className="space-y-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Connect
            </h4>
            <a
              href="mailto:hello@wayfarer.ai"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              hello@wayfarer.ai
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Wayfarer AI Inc. All rights reserved.</p>
          <p>Built on live travel APIs · multi-agent orchestration.</p>
        </div>
      </div>
    </footer>
  );
}
