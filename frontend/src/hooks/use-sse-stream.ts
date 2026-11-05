"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, getStoredToken } from "@/lib/api";

export interface StreamData {
  status: string;
  new_logs: string[];
  transit: Array<Record<string, unknown>>;
  lodging: Array<Record<string, unknown>>;
  itinerary: Array<Record<string, unknown>>;
  total_cost: number;
  data_errors?: Array<{ source?: string; code?: string; message?: string }>;
  finished?: boolean;
}

export function useSSEStream(tripId: string | null) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("IDLE");
  const [transit, setTransit] = useState<Array<Record<string, unknown>>>([]);
  const [lodging, setLodging] = useState<Array<Record<string, unknown>>>([]);
  const [itinerary, setItinerary] = useState<Array<Record<string, unknown>>>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [dataErrors, setDataErrors] = useState<NonNullable<StreamData["data_errors"]>>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!tripId) return;

    const controller = new AbortController();
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    const applyPayload = (data: StreamData, replaceLogs = false) => {
      if (data.status) setStatus(data.status);
      if (data.new_logs?.length) {
        setLogs((prev) => (replaceLogs ? data.new_logs : [...prev, ...data.new_logs]));
      }
      if (data.transit) setTransit(data.transit);
      if (data.lodging) setLodging(data.lodging);
      if (data.itinerary) setItinerary(data.itinerary);
      if (typeof data.total_cost === "number") setTotalCost(data.total_cost);
      if (data.data_errors) setDataErrors(data.data_errors);

      if (data.finished || ["PLANNED", "BUDGET_WARNING", "FAILED"].includes(data.status)) {
        setIsFinished(true);
        return true;
      }
      return false;
    };

    const authHeaders = () => {
      const token = getStoredToken();
      return token ? { Authorization: `Bearer ${token}` } : undefined;
    };

    const pollTrip = async (): Promise<void> => {
      if (controller.signal.aborted) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/trips/${tripId}`, {
          headers: authHeaders(),
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Trip polling failed (${response.status})`);

        const data = await response.json();
        const finished = applyPayload({
          status: data.status,
          new_logs: data.node_logs || [],
          transit: data.transit_details || [],
          lodging: data.lodging_details || [],
          itinerary: data.daily_itinerary || [],
          total_cost: data.total_estimated_cost || 0,
          data_errors: data.data_errors || [],
        }, true);
        if (!finished && !controller.signal.aborted) {
          pollTimer = setTimeout(() => void pollTrip(), 1500);
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatus("FAILED");
          setIsFinished(true);
        }
      }
    };

    const readStream = async () => {
      setLogs([]);
      setStatus("RUNNING");
      setTransit([]);
      setLodging([]);
      setItinerary([]);
      setTotalCost(0);
      setDataErrors([]);
      setIsFinished(false);

      const response = await fetch(`${API_BASE_URL}/api/v1/trips/${tripId}/stream`, {
        headers: authHeaders(),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const event of events) {
          const payload = event
            .split("\n")
            .find((line) => line.startsWith("data:"))
            ?.slice(5)
            .trim();
          if (payload) applyPayload(JSON.parse(payload) as StreamData);
        }

        if (done) break;
      }
    };

    void readStream().catch(() => {
      if (!controller.signal.aborted) void pollTrip();
    });

    return () => {
      controller.abort();
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [tripId]);

  return { logs, status, transit, lodging, itinerary, totalCost, dataErrors, isFinished };
}
