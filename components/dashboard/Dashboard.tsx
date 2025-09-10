"use client";
import React, { useEffect, useState } from "react";
import { DateRangePicker } from "../ui/date-picker-with-range";
import { fetchSummaries } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
import Loading from "@/app/loading";
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          <Loading />
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center lg:justify-between pt-12 mt-12">
        <div className="hidden md:block">
        </div>
        <DateRangePicker setSummaries={setSummaries as React.Dispatch<React.SetStateAction<SummaryResponse>>} />
      </div>
    
      <SalesDashboard salesData={summaries} />
    </div>
  );
};

export default Dashboard;
