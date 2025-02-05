import React from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type handleTimeChangeType = "hour" | "minutes";
type FieldType = {
  value: string | undefined;
  onChange: (value: string) => void;
};

const DateTimePicker = ({
                          field,
                          date,
                          setDate,
                          handleTimeChange,
                          onDateSelect,
                          minDate,
                          maxDate
                        }: {
  field: FieldType;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  handleTimeChange: (type: handleTimeChangeType, value: string) => void;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}) => {
  // Helper function to check if a specific hour is disabled
  const isHourDisabled = (hour: number) => {
    if (!date || (!minDate && !maxDate)) return false;

    const currentDate = new Date(date);
    currentDate.setHours(hour, 0, 0, 0);

    if (minDate) {
      const minDateTime = new Date(minDate);
      if (currentDate.toDateString() === minDateTime.toDateString() &&
          hour < minDateTime.getHours()) {
        return true;
      }
    }

    if (maxDate) {
      const maxDateTime = new Date(maxDate);
      if (currentDate.toDateString() === maxDateTime.toDateString() &&
          hour > maxDateTime.getHours()) {
        return true;
      }
    }

    return false;
  };

  const isMinuteDisabled = (minute: number) => {
    if (!date || (!minDate && !maxDate)) return false;

    const currentDate = new Date(date);
    const currentHour = currentDate.getHours();
    currentDate.setMinutes(minute, 0, 0);

    if (minDate) {
      const minDateTime = new Date(minDate);
      if (currentDate.toDateString() === minDateTime.toDateString() &&
          currentHour === minDateTime.getHours() &&
          minute < minDateTime.getMinutes()) {
        return true;
      }
    }

    if (maxDate) {
      const maxDateTime = new Date(maxDate);
      if (currentDate.toDateString() === maxDateTime.toDateString() &&
          currentHour === maxDateTime.getHours() &&
          minute > maxDateTime.getMinutes()) {
        return true;
      }
    }

    return false;
  };

  return (
      <Popover>
        <PopoverTrigger asChild>
  <Button
    variant={"outline"}
    className={cn(
      "w-full pl-3 text-left font-normal",
      !field.value && "text-muted-foreground"
    )}
  >
    {field.value ? (
      format(new Date(field.value), "MM/dd/yyyy HH:mm")
    ) : (
      format(new Date(), "MM/dd/yyyy HH:mm") 
    )}
    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
  </Button>
</PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          <div className="sm:flex">
            <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    const formattedDate = selectedDate.toISOString();
                    setDate(selectedDate);
                    onDateSelect(selectedDate);
                    field.onChange(formattedDate);
                  }
                }}
                disabled={(date) => {
                  if (minDate && date < minDate) return true;
                  if (maxDate && date > maxDate) return true;
                  return false;
                }}
                initialFocus
            />
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 24 }, (_, i) => i)
                      .reverse()
                      .map((hour) => (
                          <Button
                              key={hour}
                              size="icon"
                              variant={
                                field.value && new Date(field.value).getHours() === hour
                                    ? "default"
                                    : "ghost"
                              }
                              className={cn(
                                  "sm:w-full shrink-0 aspect-square",
                                  isHourDisabled(hour) && "opacity-50 cursor-not-allowed"
                              )}
                              disabled={isHourDisabled(hour)}
                              onClick={() => {
                                handleTimeChange("hour", hour.toString());
                                const newDate = new Date(date || new Date());
                                newDate.setHours(hour);
                                field.onChange(newDate.toISOString());
                              }}
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
                            field.value &&
                            new Date(field.value).getMinutes() === minute
                                ? "default"
                                : "ghost"
                          }
                          className={cn(
                              "sm:w-full shrink-0 aspect-square",
                              isMinuteDisabled(minute) && "opacity-50 cursor-not-allowed"
                          )}
                          disabled={isMinuteDisabled(minute)}
                          onClick={() => {
                            handleTimeChange("minutes", minute.toString());
                            const newDate = new Date(date || new Date());
                            newDate.setMinutes(minute);
                            field.onChange(newDate.toISOString());
                          }}
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
};

export default DateTimePicker;
