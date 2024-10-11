import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "@nextui-org/react";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DatePickerFieldProps {
  name: string;
  label: string;
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  isPending?: boolean; // Optional prop to handle loading state
}

const DatePicker: React.FC<DatePickerFieldProps> = ({

  name,
  selectedDate,
  isPending,
}) => {
  return (
    
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <input
                    name={name}
                    type="text"
                    readOnly
                    className={cn(
                      "w-full p-2 border rounded-md text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                    value={selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    disabled={isPending}
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                //   mode="single"
                //   selected={selectedDate}
                //   onSelect={onDateChange}
                //   initialFocus
                />
              </PopoverContent>
            </Popover>
         
  );
};

export default DatePicker;