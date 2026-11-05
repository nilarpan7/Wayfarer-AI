"use client";

import React from "react";
import { Plane, Train, QrCode, CheckCircle2 } from "lucide-react";
import { Card3D } from "./card-3d";
import { BorderBeam } from "./border-beam";
import { cn } from "@/lib/utils";

export function HolographicTicket3D({ className }: { className?: string }) {
  return (
    <Card3D
      maxTilt={12}
      scaleOnHover={1.03}
      glareOpacity={0.25}
      className={cn("w-full max-w-md mx-auto select-none", className)}
    >
      <div className="relative rounded-3xl overflow-hidden glass-card border border-white/20 shadow-2xl p-6 bg-gradient-to-br from-neutral-900/95 via-[#0e111a]/95 to-[#161214]/95 text-white">
        {/* Animated Border Beam */}
        <BorderBeam size={220} duration={8} colorFrom="#C84B22" colorTo="#38bdf8" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C84B22] text-white shadow-md shadow-[#C84B22]/30">
              <Plane className="h-4 w-4 rotate-[-30deg]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#C84B22] block">
                Verified Transit Pass
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                Wayfarer Swarm Verified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tabular-nums">
            <CheckCircle2 className="h-3 w-3" />
            <span>CONFIRMED • ₹1,450.00</span>
          </div>
        </div>

        {/* Destination Origin-Arrival Big Typography */}
        <div className="py-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-zinc-400 block">Origin</span>
            <span className="text-3xl font-extrabold font-heading tracking-tight text-white block">
              DEL
            </span>
            <span className="text-xs text-zinc-300 font-medium block">New Delhi, India</span>
          </div>

          {/* Center Route Graphics */}
          <div className="flex flex-col items-center px-4">
            <span className="text-xs font-medium text-zinc-400 mb-1">
              Vande Bharat / Air
            </span>
            <div className="relative flex items-center gap-1 w-28 sm:w-32">
              <div className="h-1.5 w-1.5 rounded-full bg-[#C84B22]" />
              <div className="h-[1.5px] flex-1 bg-gradient-to-r from-[#C84B22] via-amber-400 to-sky-400" />
              <div className="p-1 rounded-full bg-white/10 border border-white/20">
                <Train className="h-3 w-3 text-amber-300" />
              </div>
              <div className="h-[1.5px] flex-1 bg-gradient-to-r from-sky-400 to-[#C84B22]" />
              <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 mt-1">
              Live IRCTC & Flight Tariffs
            </span>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-xs font-medium text-zinc-400 block">Destination</span>
            <span className="text-3xl font-extrabold font-heading tracking-tight text-[#FF8A65] block">
              GOI
            </span>
            <span className="text-xs text-zinc-300 font-medium block">Goa, Dabolim</span>
          </div>
        </div>

        {/* Ticket Perforation Notches */}
        <div className="relative flex items-center my-1 -mx-6">
          <div className="h-5 w-3 rounded-r-full bg-[#0b0d13] border-y border-r border-white/15" />
          <div className="flex-1 border-b border-dashed border-white/20 mx-2" />
          <div className="h-5 w-3 rounded-l-full bg-[#0b0d13] border-y border-l border-white/15" />
        </div>

        {/* Passenger & Schedule Meta Grid */}
        <div className="grid grid-cols-4 gap-3 py-4 text-left">
          <div>
            <span className="text-xs font-medium text-zinc-400 block">Traveler</span>
            <span className="text-xs font-bold text-white block truncate">VIP Guest</span>
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-400 block">Departure</span>
            <span className="text-xs font-bold text-zinc-200 block tabular-nums">06:15 AM</span>
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-400 block">Seat / Car</span>
            <span className="text-xs font-bold text-amber-300 block tabular-nums">C2 · 42</span>
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-400 block">Platform</span>
            <span className="text-xs font-bold text-sky-400 block tabular-nums">PF 03</span>
          </div>
        </div>

        {/* Realistic High-Tech Barcode & Security Hologram */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 p-1 flex items-center justify-center">
              <QrCode className="h-7 w-7 text-zinc-300" />
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              <span className="block text-zinc-300 font-bold">WF-8842-IRCTC</span>
              <span className="text-[9px]">HASH: 0x9f4a...29c</span>
            </div>
          </div>

          {/* Barcode Lines */}
          <div className="flex items-end gap-[2px] h-7 opacity-75">
            {[2, 4, 1, 3, 5, 2, 6, 3, 1, 4, 2, 5, 3, 2, 6, 1, 4, 3, 2, 5, 1, 4, 2].map(
              (h, i) => (
                <div
                  key={i}
                  className="w-[2px] bg-white/80 rounded-xs"
                  style={{ height: `${h * 4 + 4}px` }}
                />
              )
            )}
          </div>
        </div>
      </div>
    </Card3D>
  );
}
