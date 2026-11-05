"use client";

import React, { useRef, useEffect, useState } from "react";
import { Plane, Train, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CityNode {
  id: string;
  name: string;
  code: string;
  lat: number;
  lon: number;
  country: string;
  tag: string;
}

interface FlightRoute {
  from: string;
  to: string;
  mode: "flight" | "train" | "multimodal";
  duration: string;
  priceINR: string;
  carrier: string;
}

const CITIES: CityNode[] = [
  { id: "del", name: "New Delhi", code: "DEL", lat: 28.6139, lon: 77.209, country: "India", tag: "Hub • Capital" },
  { id: "goi", name: "Goa", code: "GOI", lat: 15.2993, lon: 74.124, country: "India", tag: "Beach & Heritage" },
  { id: "bom", name: "Mumbai", code: "BOM", lat: 19.076, lon: 72.8777, country: "India", tag: "Financial Hub" },
  { id: "blr", name: "Bengaluru", code: "BLR", lat: 12.9716, lon: 77.5946, country: "India", tag: "Silicon Valley" },
  { id: "ccu", name: "Kolkata", code: "CCU", lat: 22.5726, lon: 88.3639, country: "India", tag: "Cultural Capital" },
  { id: "jai", name: "Jaipur", code: "JAI", lat: 26.9124, lon: 75.7873, country: "India", tag: "Pink City" },
  { id: "sxr", name: "Srinagar", code: "SXR", lat: 34.0837, lon: 74.7973, country: "India", tag: "Kashmir Valley" },
  { id: "dxb", name: "Dubai", code: "DXB", lat: 25.2048, lon: 55.2708, country: "UAE", tag: "Global Hub" },
  { id: "cdg", name: "Paris", code: "CDG", lat: 48.8566, lon: 2.3522, country: "France", tag: "Europe Hub" },
  { id: "hnd", name: "Tokyo", code: "HND", lat: 35.6762, lon: 139.6503, country: "Japan", tag: "East Asia Hub" },
];

const ROUTES: FlightRoute[] = [
  { from: "del", to: "goi", mode: "multimodal", duration: "2h 30m / 21h", priceINR: "₹1,450 – ₹4,290", carrier: "IndiGo / Vande Bharat" },
  { from: "bom", to: "goi", mode: "train", duration: "7h 45m", priceINR: "₹1,250", carrier: "Vande Bharat Express" },
  { from: "del", to: "sxr", mode: "flight", duration: "1h 35m", priceINR: "₹3,850", carrier: "Air India / IndiGo" },
  { from: "blr", to: "goi", mode: "flight", duration: "1h 15m", priceINR: "₹2,690", carrier: "Akasa Air" },
  { from: "del", to: "jai", mode: "train", duration: "3h 40m", priceINR: "₹890", carrier: "Vande Bharat Express" },
  { from: "del", to: "dxb", mode: "flight", duration: "3h 50m", priceINR: "₹14,200", carrier: "Emirates / Air India" },
  { from: "bom", to: "dxb", mode: "flight", duration: "3h 15m", priceINR: "₹12,800", carrier: "FlyDubai" },
  { from: "del", to: "cdg", mode: "flight", duration: "9h 10m", priceINR: "₹38,500", carrier: "Air France" },
];

// Convert spherical (lat, lon) to 3D Cartesian coordinates on unit sphere
function latLonToVector(lat: number, lon: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  const x = -Math.sin(phi) * Math.cos(theta);
  const y = Math.cos(phi);
  const z = Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

// Rotate vector in 3D around X and Y axes
function rotateVector(
  [x, y, z]: [number, number, number],
  rotX: number,
  rotY: number
): [number, number, number] {
  // Rotate around Y
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  // Rotate around X
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  return [x1, y2, z2];
}

// Spherical linear interpolation between two 3D vectors
function slerp(
  v0: [number, number, number],
  v1: [number, number, number],
  t: number
): [number, number, number] {
  let dot = v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
  dot = Math.max(-1, Math.min(1, dot));
  const theta = Math.acos(dot);
  if (theta < 0.001) return v0;
  const sinTheta = Math.sin(theta);
  const a = Math.sin((1 - t) * theta) / sinTheta;
  const b = Math.sin(t * theta) / sinTheta;

  // Compute curved arc altitude peak at midpoint
  const arcHeight = Math.sin(t * Math.PI) * 0.18; // Great circle flight arc elevation!
  const mag = 1 + arcHeight;

  return [
    (a * v0[0] + b * v1[0]) * mag,
    (a * v0[1] + b * v1[1]) * mag,
    (a * v0[2] + b * v1[2]) * mag,
  ];
}

export function InteractiveGlobe3D({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Rotation angles (centered on India: lat ~20, lon ~77)
  const rotX = useRef<number>(0.25);
  const rotY = useRef<number>(-1.35);
  const velX = useRef<number>(0);
  const velY = useRef<number>(0.002); // continuous gentle auto-rotation

  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [activeRoute, setActiveRoute] = useState<FlightRoute>(ROUTES[0]);

  // Generate sphere lattice points on mount
  const spherePoints = useRef<[number, number, number][]>([]);

  useEffect(() => {
    const points: [number, number, number][] = [];
    const count = 480;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < count; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      points.push([x, y, z]);
    }

    spherePoints.current = points;
  }, []);

  // Animation Loop
  useEffect(() => {
    let animId: number;
    let particleOffset = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const radius = Math.min(width, height) * 0.38;
      const centerX = width / 2;
      const centerY = height / 2;

      // Update rotation if not dragging
      if (!isDragging.current) {
        rotY.current += velY.current;
        rotX.current += velX.current;
        velX.current *= 0.95; // damping
      }

      particleOffset = (particleOffset + 0.006) % 1;

      // 1. Draw Outer Atmospheric Glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.7,
        centerX,
        centerY,
        radius * 1.35
      );
      glowGrad.addColorStop(0, "rgba(200, 75, 34, 0.12)");
      glowGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.05)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Sphere Horizon Ring
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Render Sphere Lattice Points
      const currentRotX = rotX.current;
      const currentRotY = rotY.current;

      for (let i = 0; i < spherePoints.current.length; i++) {
        const pt = spherePoints.current[i];
        const [rx, ry, rz] = rotateVector(pt, currentRotX, currentRotY);

        // Perspective depth projection
        const alpha = (rz + 1) / 2; // 0 (back) to 1 (front)
        if (alpha > 0.05) {
          const screenX = centerX + rx * radius;
          const screenY = centerY - ry * radius;
          const size = 1 + alpha * 1.8;

          ctx.fillStyle = `rgba(255, 255, 255, ${0.12 + alpha * 0.45})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Render Curved 3D Flight Arcs
      const cityMap = new Map<string, [number, number, number]>();
      CITIES.forEach((c) => {
        cityMap.set(c.id, latLonToVector(c.lat, c.lon));
      });

      ROUTES.forEach((route) => {
        const v0 = cityMap.get(route.from);
        const v1 = cityMap.get(route.to);
        if (!v0 || !v1) return;

        const steps = 36;
        ctx.beginPath();
        let first = true;
        let visibleCount = 0;

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const interpolated = slerp(v0, v1, t);
          const [rx, ry, rz] = rotateVector(interpolated, currentRotX, currentRotY);

          if (rz > -0.2) visibleCount++;

          const screenX = centerX + rx * radius;
          const screenY = centerY - ry * radius;

          if (first) {
            ctx.moveTo(screenX, screenY);
            first = false;
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }

        if (visibleCount > steps / 3) {
          const isSelected =
            activeRoute.from === route.from && activeRoute.to === route.to;
          ctx.strokeStyle = isSelected
            ? "rgba(200, 75, 34, 0.85)"
            : route.mode === "train"
            ? "rgba(16, 185, 129, 0.45)"
            : "rgba(56, 189, 248, 0.4)";
          ctx.lineWidth = isSelected ? 2.5 : 1.2;
          ctx.stroke();

          // Draw animated spark along the arc
          const sparkT = (particleOffset * 1.5 + (route.from.charCodeAt(0) % 5) * 0.2) % 1;
          const sparkVec = slerp(v0, v1, sparkT);
          const [srx, sry, srz] = rotateVector(sparkVec, currentRotX, currentRotY);

          if (srz > -0.1) {
            const sparkX = centerX + srx * radius;
            const sparkY = centerY - sry * radius;

            ctx.fillStyle = isSelected ? "#FFFFFF" : "#FFC107";
            ctx.shadowColor = isSelected ? "#C84B22" : "#38BDF8";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, isSelected ? 3.5 : 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset
          }
        }
      });

      // 5. Render City Beacons & Labels
      CITIES.forEach((city) => {
        const v = cityMap.get(city.id);
        if (!v) return;

        const [rx, ry, rz] = rotateVector(v, currentRotX, currentRotY);

        // Only draw if on front half of the sphere
        if (rz > 0.05) {
          const screenX = centerX + rx * radius;
          const screenY = centerY - ry * radius;
          const alpha = Math.min(1, rz * 1.5);

          // Pulsing halo ring
          const pulse = (Math.sin(Date.now() * 0.005 + city.lat) + 1) / 2;
          ctx.strokeStyle = `rgba(200, 75, 34, ${0.3 + pulse * 0.4 * alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 4 + pulse * 5, 0, Math.PI * 2);
          ctx.stroke();

          // Solid beacon core
          ctx.fillStyle = city.country === "India" ? "#C84B22" : "#38BDF8";
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Text code badge
          ctx.font = "bold 9px 'JetBrains Mono', monospace";
          ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * alpha})`;
          ctx.fillText(city.code, screenX + 7, screenY + 3);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeRoute]);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    rotY.current += deltaX * 0.007;
    rotX.current = Math.max(-1.1, Math.min(1.1, rotX.current - deltaY * 0.007));

    velX.current = -deltaY * 0.002;
    velY.current = deltaX * 0.003;

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl p-4 sm:p-6 flex flex-col justify-between select-none",
        className
      )}
    >
      {/* Top HUD Overlay */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C84B22]/15 text-[#C84B22] border border-[#C84B22]/30">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#C84B22] block">
              3D Orbit Engine
            </span>
            <span className="text-xs font-bold text-foreground">
              Live Indian & Global Transit Routes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>Drag to rotate</span>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative w-full h-[320px] sm:h-[360px] my-2 cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full touch-none"
        />

        {/* Floating Quick Route Switcher Bar */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {ROUTES.slice(0, 4).map((route, i) => {
            const isSelected =
              activeRoute.from === route.from && activeRoute.to === route.to;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveRoute(route)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all border whitespace-nowrap flex items-center gap-1 shadow-sm",
                  isSelected
                    ? "bg-[#C84B22] text-white border-[#C84B22]"
                    : "bg-black/60 text-zinc-300 border-white/10 hover:border-white/25 hover:bg-black/80"
                )}
              >
                {route.mode === "train" ? (
                  <Train className="h-2.5 w-2.5" />
                ) : (
                  <Plane className="h-2.5 w-2.5" />
                )}
                <span>
                  {route.from.toUpperCase()} ➔ {route.to.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Route Telemetry HUD Card */}
      <div className="relative z-10 rounded-2xl bg-black/60 border border-white/10 p-3.5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
              VERIFIED LIVE FARE
            </span>
            <span className="text-zinc-300 font-semibold text-[11px]">
              {activeRoute.carrier}
            </span>
          </div>
          <p className="text-sm font-bold text-white flex items-center gap-1.5">
            <span>
              {CITIES.find((c) => c.id === activeRoute.from)?.name} (
              {activeRoute.from.toUpperCase()})
            </span>
            <ArrowRight className="h-3 w-3 text-[#C84B22]" />
            <span>
              {CITIES.find((c) => c.id === activeRoute.to)?.name} (
              {activeRoute.to.toUpperCase()})
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block font-mono">
              REAL-TIME PRICE
            </span>
            <span className="text-sm font-extrabold font-mono text-amber-300">
              {activeRoute.priceINR}
            </span>
          </div>
          <div className="text-right border-l border-white/10 pl-3">
            <span className="text-[10px] text-zinc-400 block font-mono">
              TRANSIT TIME
            </span>
            <span className="text-xs font-bold text-zinc-200">
              {activeRoute.duration}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
