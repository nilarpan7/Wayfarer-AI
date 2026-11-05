"use client";

import { useEffect, useState, useRef } from "react";

const agentLogs = [
  { agent: "Supervisor", status: "done", text: 'Parsed "5-day trip to Goa from Delhi for ₹25,000"' },
  { agent: "Transit Agent", status: "done", text: "Found IndiGo 6E-205 DEL → GOI — ₹5,450" },
  { agent: "Transit Agent", status: "done", text: "Found Vande Bharat Express (22229) — ₹1,815 (IRCTC)" },
  { agent: "Lodging Agent", status: "done", text: "Taj Fort Aguada Resort — ₹4,200/night (★ 4.7)" },
  { agent: "Lodging Agent", status: "done", text: "Goa Heritage Beach Resort — ₹2,450/night (★ 4.3)" },
  { agent: "Sightseeing", status: "done", text: "Clustered 12 live POIs → North & South Goa zones" },
  { agent: "Sightseeing", status: "done", text: "Day 1: Fort Aguada + Calangute Beach + Anjuna Market" },
  { agent: "Budget Agent", status: "done", text: "Total: ₹21,800 / ₹25,000 budget ✓ — Within margin" },
  { agent: "Consolidator", status: "active", text: "Building final multimodal itinerary & IRCTC passes..." },
];

const statusColors: Record<string, string> = {
  done: "bg-emerald-500",
  active: "bg-amber-400 animate-pulse",
  pending: "bg-zinc-500",
};

const agentColors: Record<string, string> = {
  Supervisor: "text-violet-400",
  "Transit Agent": "text-sky-400",
  "Lodging Agent": "text-emerald-400",
  Sightseeing: "text-amber-400",
  "Budget Agent": "text-rose-400",
  Consolidator: "text-indigo-400",
};

export function AgentTerminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= agentLogs.length) {
          // Reset after a pause
          setTimeout(() => setVisibleLines(0), 3000);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Ambient glow behind terminal */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-purple-500/20 rounded-3xl blur-2xl" />

      {/* Terminal card */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-2xl shadow-black/50">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 text-xs text-zinc-500 font-mono">
            wayfarer-ai — agent orchestrator
          </span>
        </div>

        {/* Scan line overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
          <div className="w-full h-[2px] bg-white animate-scan-line" />
        </div>

        {/* Log content */}
        <div
          ref={terminalRef}
          className="p-4 h-[280px] overflow-hidden font-mono text-[13px] leading-relaxed space-y-1.5"
        >
          {agentLogs.slice(0, visibleLines).map((log, i) => (
            <div
              key={i}
              className="flex items-start gap-2 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${statusColors[log.status]}`} />
              <span className={`shrink-0 font-semibold ${agentColors[log.agent] || "text-zinc-400"}`}>
                {log.agent}:
              </span>
              <span className="text-zinc-300">{log.text}</span>
            </div>
          ))}

          {/* Blinking cursor */}
          {visibleLines > 0 && visibleLines < agentLogs.length && (
            <div className="flex items-center gap-1 text-zinc-600">
              <span className="inline-block w-2 h-4 bg-indigo-400" style={{ animation: "blink 1s step-end infinite" }} />
            </div>
          )}

          {visibleLines >= agentLogs.length && (
            <div className="mt-2 pt-2 border-t border-white/5 text-emerald-400 font-semibold animate-fade-in">
              ✓ Trip plan ready — 5 days, 12 activities, 2 bookable flights
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
