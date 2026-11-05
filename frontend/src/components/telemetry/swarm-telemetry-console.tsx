"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Plane,
  Hotel,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Copy,
  Check,
  Terminal,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SwarmTelemetryConsoleProps {
  logs: string[];
  status?: string;
  isFinished?: boolean;
  dataErrors?: Array<{ source?: string; code?: string; message?: string }>;
  className?: string;
}

export type AgentKey =
  | "supervisor"
  | "transit"
  | "lodging"
  | "sightseeing"
  | "budget"
  | "consolidator"
  | "system";

export interface ParsedLog {
  raw: string;
  index: number;
  stepNumber: string;
  agentKey: AgentKey;
  agentName: string;
  agentRole: string;
  status: "success" | "warning" | "error" | "info";
  passNumber: number;
  cleanMessage: string;
}

const AGENT_CONFIGS: Record<
  AgentKey,
  {
    name: string;
    role: string;
    icon: React.ElementType;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    cardBorder: string;
    accentGlow: string;
  }
> = {
  supervisor: {
    name: "Supervisor Router",
    role: "Intent & DAG Router",
    icon: Brain,
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    badgeBorder: "border-purple-500/25",
    cardBorder: "hover:border-purple-500/40",
    accentGlow: "from-purple-500/10 to-indigo-500/5",
  },
  transit: {
    name: "Transit Logistics",
    role: "Multimodal Rail & Flights",
    icon: Plane,
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-400",
    badgeBorder: "border-sky-500/25",
    cardBorder: "hover:border-sky-500/40",
    accentGlow: "from-sky-500/10 to-blue-500/5",
  },
  lodging: {
    name: "Lodging Agent",
    role: "Live SerpAPI Stays",
    icon: Hotel,
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/25",
    cardBorder: "hover:border-emerald-500/40",
    accentGlow: "from-emerald-500/10 to-teal-500/5",
  },
  sightseeing: {
    name: "Sightseeing Agent",
    role: "Google Places Geo-POIs",
    icon: MapPin,
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    badgeBorder: "border-amber-500/25",
    cardBorder: "hover:border-amber-500/40",
    accentGlow: "from-amber-500/10 to-orange-500/5",
  },
  budget: {
    name: "Budget Guardian",
    role: "Real-time Cost Safety",
    icon: ShieldCheck,
    badgeBg: "bg-teal-500/10",
    badgeText: "text-teal-400",
    badgeBorder: "border-teal-500/25",
    cardBorder: "hover:border-teal-500/40",
    accentGlow: "from-teal-500/10 to-emerald-500/5",
  },
  consolidator: {
    name: "Consolidator",
    role: "Itinerary Synthesis",
    icon: Sparkles,
    badgeBg: "bg-[#C84B22]/15",
    badgeText: "text-[#C84B22]",
    badgeBorder: "border-[#C84B22]/30",
    cardBorder: "hover:border-[#C84B22]/50",
    accentGlow: "from-[#C84B22]/15 to-amber-500/10",
  },
  system: {
    name: "System Dispatch",
    role: "Graph Orchestrator",
    icon: Zap,
    badgeBg: "bg-zinc-500/10",
    badgeText: "text-zinc-400",
    badgeBorder: "border-zinc-500/25",
    cardBorder: "hover:border-zinc-500/40",
    accentGlow: "from-zinc-500/10 to-zinc-700/5",
  },
};

function parseTelemetryLog(raw: string, index: number): ParsedLog {
  const stepNumber = String(index + 1).padStart(2, "0");

  // Determine status
  let status: "success" | "warning" | "error" | "info" = "info";
  if (
    raw.includes("❌") ||
    raw.toLowerCase().includes("cannot be satisfied") ||
    raw.toLowerCase().includes("failed")
  ) {
    status = "error";
  } else if (
    raw.includes("⚠️") ||
    raw.toLowerCase().includes("exceeded") ||
    raw.toLowerCase().includes("budget warning") ||
    raw.toLowerCase().includes("re-optimizing")
  ) {
    status = "warning";
  } else if (
    raw.includes("✓") ||
    raw.toLowerCase().includes("found") ||
    raw.toLowerCase().includes("selected") ||
    raw.toLowerCase().includes("organized") ||
    raw.toLowerCase().includes("finalized")
  ) {
    status = "success";
  }

  // Detect pass number if present
  let passNumber = 1;
  const passMatch = raw.match(/pass\s*#?(\d+)/i);
  if (passMatch) {
    passNumber = parseInt(passMatch[1], 10);
  }

  // Detect agent key
  const lower = raw.toLowerCase();
  let agentKey: AgentKey = "system";

  if (lower.includes("supervisor")) {
    agentKey = "supervisor";
  } else if (lower.includes("transit")) {
    agentKey = "transit";
  } else if (
    lower.includes("accommodation") ||
    lower.includes("lodging") ||
    lower.includes("hotel")
  ) {
    agentKey = "lodging";
  } else if (
    lower.includes("sightseeing") ||
    lower.includes("attraction") ||
    lower.includes("poi")
  ) {
    agentKey = "sightseeing";
  } else if (lower.includes("budget") || lower.includes("guardian")) {
    agentKey = "budget";
  } else if (lower.includes("consolidator")) {
    agentKey = "consolidator";
  }

  const agentConfig = AGENT_CONFIGS[agentKey];

  // Clean the raw string by stripping leading icons and agent prefix
  const cleanMessage = raw
    .replace(/^[✓⚠️❌►⚙️⚡*\s]+/, "")
    .replace(
      /^(Supervisor|Transit Agent|Accommodation Agent|Lodging Agent|Sightseeing Agent|Budget Guardian|Consolidator|System):\s*/i,
      ""
    )
    .trim();

  return {
    raw,
    index,
    stepNumber,
    agentKey,
    agentName: agentConfig.name,
    agentRole: agentConfig.role,
    status,
    passNumber,
    cleanMessage: cleanMessage || raw,
  };
}

/**
 * Highlights currency, brackets, ratings, and tags within message text.
 */
function FormattedMessageText({ text }: { text: string }) {
  // Regex tokenizes INR currencies, bracketed tags [FLIGHT], ratings (4.3/5), etc.
  const regex =
    /(INR\s?[\d,]+(?:\.\d{2})?|₹\s?[\d,]+(?:\.\d{2})?|\[FLIGHT\]|\[TRAIN\]|\[Pass\s*#?\d+\]|\[EXCEEDED[^\]]*\]|\(\d+\.?\d*\/5\)|\(\d{4}-\d{2}-\d{2}\s*->\s*\d{4}-\d{2}-\d{2}\))/gi;

  const parts = text.split(regex);

  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
        if (!part) return null;

        // Currency values
        if (/^(INR|₹)/i.test(part)) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 text-[11px] shadow-xs"
            >
              {part}
            </span>
          );
        }

        // Flight or Train tags
        if (/^\[(FLIGHT|TRAIN)\]/i.test(part)) {
          const isFlight = /flight/i.test(part);
          return (
            <span
              key={i}
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-xs",
                isFlight
                  ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              )}
            >
              {isFlight ? "✈️ FLIGHT" : "🚆 TRAIN"}
            </span>
          );
        }

        // Exceeded warning pill
        if (/^\[EXCEEDED/i.test(part)) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 text-[10px] tracking-wide"
            >
              ⚠️ {part.replace(/^\[|\]$/g, "")}
            </span>
          );
        }

        // Pass Tag
        if (/^\[Pass/i.test(part)) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/35 text-[10px]"
            >
              {part}
            </span>
          );
        }

        // Hotel rating (e.g. 4.3/5)
        if (/^\(\d+\.?\d*\/5\)/.test(part)) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 text-[10px]"
            >
              ★ {part.replace(/[()]/g, "")}
            </span>
          );
        }

        // Date range
        if (/^\(\d{4}-\d{2}-\d{2}/.test(part)) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-zinc-300 bg-zinc-800/80 border border-zinc-700/60 text-[10px]"
            >
              {part}
            </span>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function SwarmTelemetryConsole({
  logs,
  status = "IDLE",
  isFinished = false,
  dataErrors = [],
  className,
}: SwarmTelemetryConsoleProps) {
  const [viewMode, setViewMode] = useState<"cards" | "terminal">("cards");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<AgentKey | "all">("all");
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Parse all logs
  const parsedLogs = useMemo(() => {
    return logs.map((log, idx) => parseTelemetryLog(log, idx));
  }, [logs]);

  // Swarm Pipeline Node Stats
  const pipelineStats = useMemo(() => {
    const coreAgents: AgentKey[] = [
      "supervisor",
      "transit",
      "lodging",
      "sightseeing",
      "budget",
      "consolidator",
    ];

    return coreAgents.map((key) => {
      const agentLogs = parsedLogs.filter((p) => p.agentKey === key);
      const count = agentLogs.length;
      const hasError = agentLogs.some((l) => l.status === "error");
      const hasWarning = agentLogs.some((l) => l.status === "warning");
      const hasSuccess = agentLogs.some((l) => l.status === "success");

      let agentStatus: "completed" | "warning" | "error" | "active" | "queued" = "queued";
      if (hasError) agentStatus = "error";
      else if (hasWarning) agentStatus = "warning";
      else if (hasSuccess) agentStatus = "completed";
      else if (!isFinished && count === 0 && status === "RUNNING") agentStatus = "active";

      return {
        key,
        config: AGENT_CONFIGS[key],
        count,
        status: agentStatus,
      };
    });
  }, [parsedLogs, isFinished, status]);

  // Filtered logs
  const visibleLogs = useMemo(() => {
    if (selectedAgentFilter === "all") return parsedLogs;
    return parsedLogs.filter((l) => l.agentKey === selectedAgentFilter);
  }, [parsedLogs, selectedAgentFilter]);

  // Max Pass Number
  const maxPass = useMemo(() => {
    return Math.max(1, ...parsedLogs.map((l) => l.passNumber));
  }, [parsedLogs]);

  // Copy Logs to Clipboard
  const handleCopyLogs = async () => {
    const fullTrace = logs.join("\n");
    try {
      await navigator.clipboard.writeText(fullTrace);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isLive = !isFinished && status === "RUNNING";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className={cn(
        "glass-card rounded-[28px] p-5 sm:p-7 border border-border/40 shadow-sm space-y-5 transition-all overflow-hidden",
        className
      )}
    >
      {/* ===== HEADER BAR ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C84B22]/20 via-[#C84B22]/10 to-amber-500/20 text-[#C84B22] border border-[#C84B22]/35 shadow-inner">
            <Brain className="h-5 w-5" />
            {isLive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C84B22] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C84B22]" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-heading tracking-tight">
                LangGraph Multi-Agent Telemetry
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-muted-foreground">
                DAG Swarm
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Autonomous 6-Node execution telemetry • Zero-mock live APIs & cost verification
            </p>
          </div>
        </div>

        {/* Right Status Badges & Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Status HUD Pill */}
          {status === "FAILED" ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
              <XCircle className="h-3.5 w-3.5" />
              <span>Execution Failed</span>
            </div>
          ) : status === "BUDGET_WARNING" ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Budget Audited ({maxPass > 1 ? `${maxPass} Passes` : "Warning"})</span>
            </div>
          ) : isLive ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Swarm Orchestrating...</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Swarm Synchronized ({parsedLogs.length} Events)</span>
            </div>
          )}

          {/* View Mode Toggle: Cards vs Terminal */}
          <div className="inline-flex items-center p-1 rounded-xl bg-accent/50 border border-border/50 text-xs font-semibold">
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all",
                viewMode === "cards"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Rich Event Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Visual Cards</span>
            </button>
            <button
              onClick={() => setViewMode("terminal")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all",
                viewMode === "terminal"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Monospace Terminal Trace View"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Terminal</span>
            </button>
          </div>

          {/* Copy Trace Button */}
          <button
            onClick={handleCopyLogs}
            disabled={parsedLogs.length === 0}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-accent/40 border border-border/50 hover:bg-accent/70 transition-all text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 disabled:opacity-40"
            title="Copy full telemetry log trace"
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-bold hidden sm:inline">
                  Copied!
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copy Trace</span>
              </>
            )}
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-accent/40 border border-border/50 hover:bg-accent/70 transition-all text-muted-foreground hover:text-foreground"
            title={isCollapsed ? "Expand Telemetry Panel" : "Collapse Telemetry Panel"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* ===== COLLAPSIBLE BODY ===== */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* ===== 6-NODE SWARM PIPELINE RIBBON ===== */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {pipelineStats.map((node) => {
                const Icon = node.config.icon;
                const isSelected = selectedAgentFilter === node.key;

                return (
                  <button
                    key={node.key}
                    onClick={() =>
                      setSelectedAgentFilter(
                        selectedAgentFilter === node.key ? "all" : node.key
                      )
                    }
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all text-left relative overflow-hidden group",
                      isSelected
                        ? "border-[#C84B22] bg-[#C84B22]/10 shadow-sm"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors",
                        node.config.badgeBg,
                        node.config.badgeText,
                        node.config.badgeBorder
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold truncate text-foreground group-hover:text-primary transition-colors">
                          {node.config.name.replace(/ Agent| Router| Logistics/, "")}
                        </span>
                        {node.count > 0 && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white/10 text-muted-foreground shrink-0">
                            {node.count}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        {node.status === "completed" ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Done</span>
                          </span>
                        ) : node.status === "warning" ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            <span>Warning</span>
                          </span>
                        ) : node.status === "error" ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                            <XCircle className="h-2.5 w-2.5" />
                            <span>Alert</span>
                          </span>
                        ) : node.status === "active" ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-400">
                            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-medium">
                            Queued
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Filter Strip if filtering active */}
            {selectedAgentFilter !== "all" && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-accent/30 border border-border/40 text-xs">
                <span className="text-muted-foreground">
                  Showing logs for:{" "}
                  <strong className="text-foreground capitalize font-bold">
                    {AGENT_CONFIGS[selectedAgentFilter].name}
                  </strong>{" "}
                  ({visibleLogs.length} events)
                </span>
                <button
                  onClick={() => setSelectedAgentFilter("all")}
                  className="text-xs font-bold text-[#C84B22] hover:underline"
                >
                  Clear Filter (Show All {parsedLogs.length})
                </button>
              </div>
            )}

            {/* ===== MAIN CONTENT: CARDS VIEW OR TERMINAL VIEW ===== */}
            {viewMode === "cards" ? (
              /* ===== UNCLIPPED EVENT CARDS (FULL VISIBILITY) ===== */
              <div className="space-y-3">
                {visibleLogs.length > 0 ? (
                  <div
                    className={cn(
                      "grid gap-2.5",
                      visibleLogs.length > 3
                        ? "grid-cols-1 lg:grid-cols-2"
                        : "grid-cols-1"
                    )}
                  >
                    {visibleLogs.map((log) => {
                      const cfg = AGENT_CONFIGS[log.agentKey];
                      const Icon = cfg.icon;

                      return (
                        <div
                          key={`step-${log.index}-${log.stepNumber}`}
                          className={cn(
                            "relative rounded-2xl p-4 border transition-all bg-gradient-to-r",
                            cfg.accentGlow,
                            log.status === "error"
                              ? "border-rose-500/30 bg-rose-500/5"
                              : log.status === "warning"
                              ? "border-amber-500/30 bg-amber-500/5"
                              : "border-white/10 bg-[#0c0e14]/70 hover:border-white/20 hover:bg-[#0c0e14]/90",
                            "shadow-sm group"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                            {/* Left: Step Badge + Agent Identity */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                              {/* Step Index Badge */}
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold tracking-wider bg-white/10 border border-white/15 text-zinc-300">
                                STEP {log.stepNumber}
                              </span>

                              {/* Agent Pill */}
                              <div
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border shadow-xs",
                                  cfg.badgeBg,
                                  cfg.badgeText,
                                  cfg.badgeBorder
                                )}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span>{cfg.name}</span>
                              </div>

                              {/* Multi-Pass Tag */}
                              {log.passNumber > 1 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  <RefreshCw className="h-2.5 w-2.5" />
                                  Pass #{log.passNumber}
                                </span>
                              )}
                            </div>

                            {/* Right Status Badge */}
                            <div className="flex items-center gap-1.5 self-start">
                              {log.status === "success" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Verified</span>
                                </span>
                              )}
                              {log.status === "warning" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Constraint Check</span>
                                </span>
                              )}
                              {log.status === "error" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                                  <XCircle className="h-3 w-3" />
                                  <span>Limit Exceeded</span>
                                </span>
                              )}
                              {log.status === "info" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                                  <Clock className="h-3 w-3" />
                                  <span>Dispatched</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message Body with Highlighted Tokens */}
                          <div className="mt-2.5 pl-0.5 text-xs sm:text-[13px] text-zinc-200 leading-relaxed font-sans font-medium">
                            <FormattedMessageText text={log.cleanMessage} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                    <Activity className="h-8 w-8 mx-auto text-muted-foreground animate-pulse mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">
                      Waiting for authenticated agent telemetry…
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Multi-agent swarm execution events will appear here in real time.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ===== TERMINAL VIEW (UNCLIPPED FULL HEIGHT) ===== */
              <div className="bg-[#080a0f] rounded-2xl border border-white/15 overflow-hidden shadow-2xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-mono text-xs text-zinc-400 font-semibold">
                      wayfarer-langgraph-stream.log
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                    <span>UTF-8</span>
                    <span>•</span>
                    <span>{visibleLogs.length} LINES</span>
                  </div>
                </div>

                {/* Terminal Gutter & Lines */}
                <div className="p-4 font-mono text-xs space-y-1.5 overflow-x-auto text-zinc-300 leading-relaxed">
                  {visibleLogs.length > 0 ? (
                    visibleLogs.map((log) => {
                      const isError = log.status === "error";
                      const isWarning = log.status === "warning";
                      const isSuccess = log.status === "success";

                      return (
                        <div
                          key={`terminal-${log.index}`}
                          className="flex items-start gap-3 hover:bg-white/[0.03] py-0.5 px-1 rounded transition-colors group"
                        >
                          {/* Line Number Gutter */}
                          <span className="select-none text-zinc-600 font-mono text-[11px] w-6 shrink-0 text-right group-hover:text-zinc-400">
                            {log.stepNumber}
                          </span>

                          {/* Status symbol */}
                          <span
                            className={cn(
                              "font-bold shrink-0",
                              isError
                                ? "text-rose-400"
                                : isWarning
                                ? "text-amber-400"
                                : isSuccess
                                ? "text-emerald-400"
                                : "text-[#C84B22]"
                            )}
                          >
                            {isError ? "✖" : isWarning ? "⚠" : isSuccess ? "✔" : "►"}
                          </span>

                          {/* Raw Log Output with highlight */}
                          <div className="flex-1 break-words">
                            <span
                              className={cn(
                                "font-bold mr-1.5",
                                log.agentKey === "supervisor"
                                  ? "text-purple-400"
                                  : log.agentKey === "transit"
                                  ? "text-sky-400"
                                  : log.agentKey === "lodging"
                                  ? "text-emerald-400"
                                  : log.agentKey === "sightseeing"
                                  ? "text-amber-400"
                                  : log.agentKey === "budget"
                                  ? "text-teal-400"
                                  : "text-[#C84B22]"
                              )}
                            >
                              [{log.agentName}]:
                            </span>
                            <FormattedMessageText text={log.cleanMessage} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-zinc-600 py-4 text-center">
                      # Awaiting LangGraph execution output...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== DATA ERRORS BANNER IF APPLICABLE ===== */}
            {dataErrors.length > 0 && (
              <div className="rounded-2xl p-4 bg-rose-500/10 border border-rose-500/25 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>External Provider Audit Notices ({dataErrors.length})</span>
                </div>
                <div className="space-y-1 pl-6 text-xs text-rose-300/90 font-mono">
                  {dataErrors.map((error, index) => (
                    <div key={`${error.code || "error"}-${index}`}>
                      • {error.source ? `[${error.source.toUpperCase()}] ` : ""}
                      {error.message || "Live API reported an unexpected response."}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
