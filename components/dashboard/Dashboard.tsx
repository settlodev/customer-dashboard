"use client";
import React, { useEffect, useState } from "react";
import { DateRangePicker } from "../ui/date-picker-with-range";
import { fetchSummaries } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
import Loading from "@/components/ui/loading";
import SalesDashboard from "./salesDashboard";

const Dashboard: React.FC = () => {
  const [summaries, setSummaries] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getSummaries = async () => {
      try {
        setIsLoading(true);
        const summary = await fetchSummaries();

        if (isMounted) {
          setSummaries(summary as SummaryResponse);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching summaries:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getSummaries();

    return () => {
      isMounted = false;
    };
  }, []);

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
        <DateRangePicker
          setSummaries={
            setSummaries as React.Dispatch<
              React.SetStateAction<SummaryResponse>
            >
          }
        />
      </div>

      <SalesDashboard salesData={summaries} />
    </div>
  );
};

export default Dashboard;
