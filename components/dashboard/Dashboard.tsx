"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { DateRangePicker } from "../ui/date-picker-with-range";
import { fetchSummaries, getLocationId } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
import Loading from "@/components/ui/loading";
import SalesDashboard from "./salesDashboard";

const WS_URL = process.env.NEXT_PUBLIC_REPORTS_WS_URL;

export type SummaryFilter = {
  filter: string;
  customStart?: string | null;
  customEnd?: string | null;
};

const Dashboard: React.FC = () => {
  const [summaries, setSummaries] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const locationIdRef = useRef<string | undefined>(undefined);
  const activeFilterRef = useRef<SummaryFilter>({ filter: "THIS_MONTH" });
  const mountedRef = useRef(false);

  const getMonthRange = useCallback(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = String(
      new Date(y, now.getMonth() + 1, 0).getDate()
    ).padStart(2, "0");
    return { startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${lastDay}` };
  }, []);

  // Publish the active filter to the server
  const publishFilter = useCallback((filterOverride?: SummaryFilter) => {
    const client = stompClientRef.current;
    const locationId = locationIdRef.current;
    if (!client?.connected || !locationId) return;

    const filter = filterOverride || activeFilterRef.current;
    client.publish({
      destination: "/app/subscribe-summary",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locationId,
        filter: filter.filter,
        customStart: filter.customStart ?? null,
        customEnd: filter.customEnd ?? null,
      }),
    });
  }, []);

  // Called by DateRangePicker when user applies a custom date range
  const handleFilterChange = useCallback(
    (startDate: string, endDate: string) => {
      const newFilter: SummaryFilter = {
        filter: "CUSTOM",
        customStart: startDate,
        customEnd: endDate,
      };
      activeFilterRef.current = newFilter;

      if (stompClientRef.current?.connected) {
        publishFilter(newFilter);
      } else {
        // Fallback to REST if WebSocket is not connected
        fetchSummaries(startDate, endDate)
          .then((response) => setSummaries(response as SummaryResponse))
          .catch((error) => console.error("Error fetching summaries:", error));
      }
    },
    [publishFilter]
  );

  // -- WebSocket lifecycle --

  const disconnectWs = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    const client = stompClientRef.current;
    if (client) {
      // Prevent onWebSocketClose from scheduling reconnects for this dead client
      client.onWebSocketClose = () => {};
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      client.deactivate();
      stompClientRef.current = null;
    }
    retryCountRef.current = 0;
  }, []);

  const connectWs = useCallback(
    (locationId: string) => {
      if (!WS_URL) return;
      // Guard: already connected or connecting
      if (stompClientRef.current) return;
      // Guard: component unmounted (React strict mode cleanup)
      if (!mountedRef.current) return;

      const client = new Client({
        webSocketFactory: () =>
          new SockJS(WS_URL, null, {
            transports: ["xhr-streaming", "xhr-polling"],
          }),
        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,
        reconnectDelay: 0,
        connectHeaders: {
          accept: "application/json",
          "content-type": "application/json",
        },

        onConnect: () => {
          if (!mountedRef.current) {
            client.deactivate();
            return;
          }

          retryCountRef.current = 0;

          subscriptionRef.current = client.subscribe(
            "/user/queue/location-summary",
            (message) => {
              if (!mountedRef.current) return;
              const update = JSON.parse(message.body);
              console.log("WebSocket summary data:", update);
              // Ignore empty or acknowledgment-only messages
              if (!update || !update.locationId) return;
              setSummaries(update as SummaryResponse);
            },
            { "content-type": "application/json" }
          );

          publishFilter();
        },

        onStompError: (frame) => {
          console.error("Dashboard STOMP error:", frame.headers.message);
        },

        onWebSocketClose: () => {
          // Only reconnect if still mounted and visible
          if (
            !mountedRef.current ||
            document.visibilityState !== "visible" ||
            !locationIdRef.current
          ) {
            return;
          }

          // Exponential backoff with jitter
          const base = 2000 * Math.pow(1.5, retryCountRef.current);
          const jitter = Math.random() * 1000;
          const delay = Math.min(base + jitter, 30_000);
          retryCountRef.current += 1;

          // Clear the ref so connectWs guard passes on retry
          stompClientRef.current = null;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectWs(locationIdRef.current!);
            }
          }, delay);
        },
      });

      stompClientRef.current = client;
      client.activate();
    },
    [publishFilter]
  );

  // -- Tab visibility: disconnect when hidden, reconnect when visible --

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        disconnectWs();
      } else if (locationIdRef.current && mountedRef.current) {
        connectWs(locationIdRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [connectWs, disconnectWs]);

  // -- Initial load --

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        setIsLoading(true);

        const [locationId, summary] = await Promise.all([
          getLocationId(),
          fetchSummaries(getMonthRange().startDate, getMonthRange().endDate),
        ]);

        locationIdRef.current = locationId;
        console.log("REST summary data:", summary);

        if (mountedRef.current) {
          setSummaries(summary as SummaryResponse);
        }

        if (locationId && mountedRef.current) {
          connectWs(locationId);
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error("Error initializing dashboard:", error);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      disconnectWs();
    };
  }, [getMonthRange, connectWs, disconnectWs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Financial overview and sales performance
          </p>
        </div>
        <DateRangePicker onFilterChange={handleFilterChange} />
      </div>

      <SalesDashboard salesData={summaries} />
    </div>
  );
};

export default Dashboard;
