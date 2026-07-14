"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./calendar";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  onFilterChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({ onFilterChange }: DateRangePickerProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [date, setDate] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    if (date?.from) {
      onFilterChange(
        format(date.from, "yyyy-MM-dd"),
        format(date.to ?? date.from, "yyyy-MM-dd"),
      );
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "MMM d, yyyy")} –{" "}
                {format(date.to, "MMM d, yyyy")}
              </>
            ) : (
              format(date.from, "MMM d, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
          disabled={{ after: today }}
          toDate={today}
          initialFocus
        />
        <div className="flex items-center justify-end gap-2 p-3 pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDate({ from: startOfMonth(now), to: today });
            }}
          >
            This Month
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!date?.from}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
