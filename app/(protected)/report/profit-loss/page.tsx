"use client";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { fetchSummaries } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";
import Loading from "@/components/ui/loading";
import ProfitLossStatement from "@/components/widgets/profit&loss";

function DateTimePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      const newDate = new Date(selected);
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      onChange(newDate);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    const newDate = new Date(value);
    if (type === "hour") {
      newDate.setHours(parseInt(val, 10));
    } else {
      newDate.setMinutes(parseInt(val, 10));
    }
    onChange(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="hidden mr-2 h-4 w-4" />
          {format(value, "MM/dd/yyyy HH:mm")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={value.getHours() === hour ? "default" : "ghost"}
                    onClick={() => handleTimeChange("hour", hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      value.getMinutes() === minute ? "default" : "ghost"
                    }
                    onClick={() =>
                      handleTimeChange("minute", minute.toString())
                    }
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const ProfitAndLossPage: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  });
  const [endDate, setEndDate] = useState(new Date());
  const [summaries, setSummaries] = useState<SummaryResponse | null>(null);
  const [business, setBusiness] = useState<Business>();
  const [location, setLocation] = useState<Location>();
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summary, loc, biz] = await Promise.all([
          fetchSummaries(startDate.toISOString(), endDate.toISOString()),
          getCurrentLocation(),
          getCurrentBusiness(),
        ]);
        setSummaries(summary as SummaryResponse);
        setLocation(loc);
        setBusiness(biz);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilter = async () => {
    setIsFiltering(true);
    try {
      const summary = await fetchSummaries(
        startDate.toISOString(),
        endDate.toISOString(),
      );
      setSummaries(summary as SummaryResponse);
    } catch (error) {
      console.error("Error fetching summaries:", error);
    } finally {
      setIsFiltering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  if (!summaries || !location || !business) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 space-y-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Profit & loss statement
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Financial performance overview
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <DateTimePicker value={startDate} onChange={setStartDate} />
          <DateTimePicker value={endDate} onChange={setEndDate} />
          <Button onClick={handleFilter} disabled={isFiltering}>
            {isFiltering ? (
              <div className="border-t-transparent border-4 border-green-500 w-[20px] h-[20px] rounded-full animate-spin" />
            ) : (
              "Filter"
            )}
          </Button>
        </div>
      </div>

      <ProfitLossStatement salesData={summaries} business={business} location={location} />
    </div>
  );
};

export default ProfitAndLossPage;
