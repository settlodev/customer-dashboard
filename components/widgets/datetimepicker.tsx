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
}: {
  field: FieldType;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  handleTimeChange: (type: handleTimeChangeType, value: string) => void;
  onDateSelect: (date: Date) => void;
}) => {
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
            <span>MM/DD/YYYY HH:mm</span>
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
                // Convert the selected date to a string before updating the form field
                const formattedDate = selectedDate.toISOString();
                setDate(selectedDate);
                onDateSelect(selectedDate);
                field.onChange(formattedDate); // Update the field with the string representation
              }
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
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() => {
                        handleTimeChange("hour", hour.toString());
                        const newDate = new Date(date || new Date());
                        newDate.setHours(hour);
                        field.onChange(newDate.toISOString()); // Convert to string
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
                    className="sm:w-full shrink-0 aspect-square"
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
