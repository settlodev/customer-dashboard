"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Link from "next/link";
import { Edit } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-picker-with-range";
import { fetchStaffSummary, getLocationId } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SalesDashboard from "./salesDashboard";

const WS_URL = process.env.NEXT_PUBLIC_REPORTS_WS_URL;

type SummaryFilter = {
  filter: string;
  customStart?: string | null;
  customEnd?: string | null;
};

export default function StaffDetailDashboard({
  staffId,
  staffName,
  jobTitle,
  status,
  isArchived,
  posAccess,
  dashboardAccess,
  editUrl,
  loyaltyPoints,
  departmentName,
  children,
}: {
  staffId: string;
  staffName: string;
  jobTitle: string | null;
  status: boolean;
  isArchived: boolean;
  posAccess: boolean;
  dashboardAccess: boolean;
  editUrl: string;
  loyaltyPoints?: number | null;
  departmentName?: string | null;
  children?: React.ReactNode;
}) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
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
      new Date(y, now.getMonth() + 1, 0).getDate(),
    ).padStart(2, "0");
    return { startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${lastDay}` };
  }, []);

  const publishFilter = useCallback(
    (filterOverride?: SummaryFilter) => {
      const client = stompClientRef.current;
      const locationId = locationIdRef.current;
      if (!client?.connected || !locationId) return;

      const filter = filterOverride || activeFilterRef.current;
      client.publish({
        destination: "/app/subscribe-staff-summary",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locationId,
          staffId,
          filter: filter.filter,
          customStart: filter.customStart ?? null,
          customEnd: filter.customEnd ?? null,
        }),
      });
    },
    [staffId],
  );

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
        fetchStaffSummary(staffId, startDate, endDate)
          .then((response) => setSummary(response as SummaryResponse))
          .catch((error) =>
            console.error("Error fetching staff summary:", error),
          );
      }
    },
    [publishFilter, staffId],
  );

  const disconnectWs = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    const client = stompClientRef.current;
    if (client) {
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
      if (stompClientRef.current) return;
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
            "/user/queue/staff-summary",
            (message) => {
              if (!mountedRef.current) return;
              const update = JSON.parse(message.body);
              if (!update || !update.staffId) return;
              setSummary(update as SummaryResponse);
            },
            { "content-type": "application/json" },
          );

          publishFilter();
        },

        onStompError: (frame) => {
          console.error("Staff summary STOMP error:", frame.headers.message);
        },

        onWebSocketClose: () => {
          if (
            !mountedRef.current ||
            document.visibilityState !== "visible" ||
            !locationIdRef.current
          ) {
            return;
          }

          const base = 2000 * Math.pow(1.5, retryCountRef.current);
          const jitter = Math.random() * 1000;
          const delay = Math.min(base + jitter, 30_000);
          retryCountRef.current += 1;

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
    [publishFilter],
  );

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

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        setIsLoading(true);
        const { startDate, endDate } = getMonthRange();

        const [locationId, summaryData] = await Promise.all([
          getLocationId(),
          fetchStaffSummary(staffId, startDate, endDate),
        ]);

        locationIdRef.current = locationId;

        if (mountedRef.current) {
          setSummary(summaryData as SummaryResponse);
        }

        if (locationId && mountedRef.current) {
          connectWs(locationId);
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error("Error initializing staff summary:", error);
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
  }, [staffId, getMonthRange, connectWs, disconnectWs]);

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {staffName}
          </h1>
          <span
            className={`h-2.5 w-2.5 rounded-full ${status ? "bg-green-500" : "bg-red-500"}`}
          />
          {isArchived && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-300"
            >
              Archived
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {posAccess && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              POS
            </span>
          )}
          {dashboardAccess && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
              Dashboard
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DateRangePicker onFilterChange={handleFilterChange} />
        <Link href={editUrl}>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Staff
          </Button>
        </Link>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <StaffSummarySkeleton />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <Card className="shadow-none">
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground">
              No sales data available for this staff member
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderHeader()}
      <SalesDashboard salesData={summary} variant="staff" loyaltyPoints={loyaltyPoints} departmentName={departmentName}>
        {children}
      </SalesDashboard>
    </div>
  );
}

function StaffSummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[100px] rounded-xl" />
        <Skeleton className="h-[100px] rounded-xl" />
        <Skeleton className="h-[100px] rounded-xl" />
      </div>
      <Skeleton className="h-[56px] rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <Skeleton className="flex-1 h-[300px] rounded-xl" />
        <Skeleton className="lg:w-[350px] h-[300px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}
