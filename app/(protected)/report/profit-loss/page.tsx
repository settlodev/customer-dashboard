"use client";
import React, { useEffect, useState } from "react";
import { fetchSummaries } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
import Loading from "@/app/loading";
import ProfitLossStatement from "@/components/widgets/profit&loss";
import { DateRangePicker } from "@/components/ui/date-picker-with-range";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Location } from "@/types/location/type";

const ProfitAndLossPage: React.FC = () => {
  const [summaries, setSummaries] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState<Location>();

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

  useEffect(() => {
    const fetchLocation = async () => {
      const loc = await getCurrentLocation();
      setLocation(loc);
    };
    fetchLocation();
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

  if (!summaries || !location) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg mb-2">Loading data...</div>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center lg:justify-between pt-12 mt-12">
        <div className="hidden md:block"></div>
        <DateRangePicker
          setSummaries={
            setSummaries as React.Dispatch<
              React.SetStateAction<SummaryResponse>
            >
          }
        />
      </div>

      <ProfitLossStatement salesData={summaries} location={location} />
    </div>
  );
};

export default ProfitAndLossPage;
