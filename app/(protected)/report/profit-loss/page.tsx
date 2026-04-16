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
import { fetchOverview } from "@/lib/actions/dashboard-action";
import OverviewResponse from "@/types/dashboard/type";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";
import { cn } from "@/lib/utils";
import Loading from "@/components/ui/loading";
import ProfitLossStatement from "@/components/widgets/profit&loss";

function DateTimePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      const d = new Date(selected);
      d.setHours(value.getHours());
      d.setMinutes(value.getMinutes());
      onChange(d);
    }
  };
  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    const d = new Date(value);
    type === "hour"
      ? d.setHours(parseInt(val, 10))
      : d.setMinutes(parseInt(val, 10));
    onChange(d);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal h-9 text-sm"
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          {format(value, "dd MMM yyyy, HH:mm")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
                {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                  <Button
                    key={h}
                    size="icon"
                    variant={value.getHours() === h ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square text-xs"
                    onClick={() => handleTimeChange("hour", h.toString())}
                  >
                    {h}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                  <Button
                    key={m}
                    size="icon"
                    variant={value.getMinutes() === m ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square text-xs"
                    onClick={() => handleTimeChange("minute", m.toString())}
                  >
                    {m.toString().padStart(2, "0")}
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
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  });
  const [endDate, setEndDate] = useState(new Date());
  const [summaries, setSummaries] = useState<OverviewResponse | null>(null);
  const [business, setBusiness] = useState<Business>();
  const [location, setLocation] = useState<Location>();
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchOverview(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
      ),
      getCurrentLocation(),
      getCurrentBusiness(),
    ])
      .then(([summary, loc, biz]) => {
        setSummaries(summary as OverviewResponse);
        setLocation(loc);
        setBusiness(biz);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = async () => {
    setIsFiltering(true);
    try {
      const summary = await fetchOverview(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
      );
      setSummaries(summary as OverviewResponse);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFiltering(false);
    }
  };

  if (isLoading || !summaries || !location || !business) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 space-y-5 min-h-screen">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Profit & loss statement
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Financial performance overview
          </p>
        </div>
        {/* ── Filter bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-2 p-3 bg-background border rounded-xl">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              From
            </span>
            <DateTimePicker value={startDate} onChange={setStartDate} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              To
            </span>
            <DateTimePicker value={endDate} onChange={setEndDate} />
          </div>
          <Button
            onClick={handleFilter}
            disabled={isFiltering}
            size="sm"
            className="h-9 text-sm"
          >
            {isFiltering ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              "Apply"
            )}
          </Button>
        </div>
      </div>

      <ProfitLossStatement
        salesData={summaries}
        business={business}
        location={location}
      />
    </div>
  );
};

export default ProfitAndLossPage;
