"use client";
import React, { useCallback, useEffect, useState } from "react";
import { DateRangePicker } from "../ui/date-picker-with-range";
import {
  fetchOverview,
  fetchOverviewByFilter,
} from "@/lib/actions/dashboard-action";
import OverviewResponse from "@/types/dashboard/type";
import { Skeleton } from "@/components/ui/skeleton";
import SalesDashboard from "./salesDashboard";

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOverviewByFilter("TODAY");
        setOverview(data as OverviewResponse);
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleFilterChange = useCallback(
    async (startDate: string, endDate: string) => {
      try {
        setIsLoading(true);
        const data = await fetchOverview(startDate, endDate);
        setOverview(data as OverviewResponse);
      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

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

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <SalesDashboard salesData={overview} />
      )}
    </div>
  );
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[100px] rounded-xl" />
        <Skeleton className="h-[100px] rounded-xl" />
        <Skeleton className="h-[100px] rounded-xl" />
      </div>

      {/* Order Summary Bar */}
      <Skeleton className="h-[56px] rounded-xl" />

      {/* Revenue Stream */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}

export default Dashboard;
