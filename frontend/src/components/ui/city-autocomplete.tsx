"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { Plane, MapPin, Check } from "lucide-react";

export interface LocationSuggestion {
  code: string;
  city: string;
  name?: string;
  state?: string;
  country?: string;
  airport_code?: string;
  formatted_query?: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "origin" | "destination";
  className?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Search city or airport...",
  type = "destination",
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [query, setQuery] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if external value changed
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  // Fetch suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/v1/locations/suggest?q=${encodeURIComponent(query || "")}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        }
      } catch {
        setSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: LocationSuggestion) => {
    const formatted = item.airport_code
      ? `${item.city} (${item.airport_code})`
      : item.city;
    setQuery(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        {type === "origin" ? (
          <Plane className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C84B22] rotate-[-45deg] pointer-events-none" />
        ) : (
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C84B22] pointer-events-none" />
        )}
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 h-11 bg-accent/20 border border-border/50 rounded-xl font-medium text-sm focus:outline-none focus:border-[#C84B22] transition-colors"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 glass-card rounded-2xl border border-white/10 shadow-2xl p-1 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
          {suggestions.map((item, idx) => {
            const isSelected =
              query.toLowerCase().includes(item.city.toLowerCase()) ||
              (item.airport_code && query.toUpperCase().includes(item.airport_code));

            return (
              <button
                key={`${item.code}-${idx}`}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs transition-colors ${
                  isSelected
                    ? "bg-[#C84B22]/15 text-[#C84B22] font-bold"
                    : "hover:bg-accent/40 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="h-6 w-6 rounded-lg bg-accent/40 flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                    {type === "origin" ? "✈️" : "📍"}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate">{item.city}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {[item.state, item.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.airport_code && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-accent/30 text-muted-foreground border border-border/40">
                      {item.airport_code}
                    </span>
                  )}
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#C84B22]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
