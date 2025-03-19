import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface DateTimeRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateTimeRangeSelectProps {
  dateRange: DateTimeRange | undefined;
  onDateRangeChange: (dateRange: DateTimeRange | undefined) => void;
}

export function DateTimeRangeSelect({ dateRange, onDateRangeChange }: DateTimeRangeSelectProps) {
  // Set default values - from: today at 00:00, to: current time
  const defaultFrom = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const defaultTo = () => {
    return new Date();
  };

  // Initialize with defaults if not provided
  const initialFrom = dateRange?.from || defaultFrom();
  const initialTo = dateRange?.to || defaultTo();

  const [selectedDates, setSelectedDates] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: initialFrom,
    to: initialTo,
  });

  // Time state for both from and to dates
  const [fromTime, setFromTime] = useState({
    hour: initialFrom.getHours(),
    minute: initialFrom.getMinutes(),
  });

  const [toTime, setToTime] = useState({
    hour: initialTo.getHours(),
    minute: initialTo.getMinutes(),
  });

  // Set initial values in parent if not already set
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) {
      updateParentWithCombinedDateTime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Combine date and time when any changes occur
  const updateParentWithCombinedDateTime = () => {
    if (selectedDates.from) {
      const newFromDate = new Date(selectedDates.from);
      newFromDate.setHours(fromTime.hour);
      newFromDate.setMinutes(fromTime.minute);
      
      let newToDate = undefined;
      if (selectedDates.to) {
        newToDate = new Date(selectedDates.to);
        newToDate.setHours(toTime.hour);
        newToDate.setMinutes(toTime.minute);
      }

      onDateRangeChange({
        from: newFromDate,
        to: newToDate,
      });
    } else {
      onDateRangeChange(undefined);
    }
  };

  // Update when dates change 
  useEffect(() => {
    updateParentWithCombinedDateTime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDates]);

  // Update when times change
  useEffect(() => {
    // Only update if we already have dates selected
    if (selectedDates.from) {
      updateParentWithCombinedDateTime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTime, toTime]);

  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // const minutes = Array.from({ length: 60 }, (_, i) => i);

  
  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setSelectedDates(range);
  };

 
  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full lg:w-[340px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} {formatTime(dateRange.from.getHours(), dateRange.from.getMinutes())} -{" "}
                  {format(dateRange.to, "LLL dd, y")} {formatTime(dateRange.to.getHours(), dateRange.to.getMinutes())}
                </>
              ) : (
                <>
                  {format(dateRange.from, "LLL dd, y")} {formatTime(dateRange.from.getHours(), dateRange.from.getMinutes())}
                </>
              )
            ) : (
              <span>Pick a date and time range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from ? dateRange.from : new Date()}
              selected={selectedDates}
              onSelect={(range) => handleDateSelect({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
            />
            
            <div className="border-t pt-4">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Start Time:</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={fromTime.hour.toString()}
                        onValueChange={(value) => {
                          setFromTime(prev => ({...prev, hour: parseInt(value)}));
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map((hour) => (
                            <SelectItem key={`from-hour-${hour}`} value={hour.toString()}>
                              {hour.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={fromTime.minute.toString()}
                        onValueChange={(value) => {
                          setFromTime(prev => ({...prev, minute: parseInt(value)}));
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 15, 30, 45,59].map((minute) => (
                            <SelectItem key={`from-min-${minute}`} value={minute.toString()}>
                              {minute.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                {selectedDates.to && (
                  <div>
                    <p className="text-sm font-medium mb-2">End Time:</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={toTime.hour.toString()}
                          onValueChange={(value) => {
                            setToTime(prev => ({...prev, hour: parseInt(value)}));
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map((hour) => (
                              <SelectItem key={`to-hour-${hour}`} value={hour.toString()}>
                                {hour.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select
                          value={toTime.minute.toString()}
                          onValueChange={(value) => {
                            setToTime(prev => ({...prev, minute: parseInt(value)}));
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 15, 30, 45, 59].map((minute) => (
                              <SelectItem key={`to-min-${minute}`} value={minute.toString()}>
                                {minute.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}