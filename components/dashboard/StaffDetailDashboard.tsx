"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Edit } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-picker-with-range";
import {
  fetchOverview,
  fetchOverviewByFilter,
} from "@/lib/actions/dashboard-action";
import OverviewResponse from "@/types/dashboard/type";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SalesDashboard from "./salesDashboard";

export default function StaffDetailDashboard({
  staffId,
  staffName,
  jobTitle,
  status,
  isArchived,
  posAccess,
  dashboardAccess,
  owner,
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
  owner?: boolean;
  editUrl: string;
  loyaltyPoints?: number | null;
  departmentName?: string | null;
  children?: React.ReactNode;
}) {
  const [summary, setSummary] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOverviewByFilter(
          "THIS_MONTH",
          null,
          null,
          staffId,
        );
        setSummary(data as OverviewResponse);
      } catch (error) {
        console.error("Error initializing staff summary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [staffId]);

  const handleFilterChange = useCallback(
    async (startDate: string, endDate: string) => {
      try {
        setIsLoading(true);
        const data = await fetchOverview(startDate, endDate, staffId);
        setSummary(data as OverviewResponse);
      } catch (error) {
        console.error("Error fetching staff summary:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [staffId],
  );

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
          {owner && (
            <Badge
              variant="outline"
              className="text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30"
            >
              Owner
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
      <SalesDashboard
        salesData={summary}
        variant="staff"
        loyaltyPoints={loyaltyPoints}
        departmentName={departmentName}
      >
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}
