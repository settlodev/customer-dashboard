"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useTransition } from "react";
import { fetchSummaries } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {CalendarIcon } from "lucide-react";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Calendar } from "./calendar";

const FormSchema = z.object({
  from: z.date({ required_error: "Start date and time are required." }),
  to: z.date({ required_error: "End date and time are required." }),
});

interface DateRangePickerProps {
  setSummaries: React.Dispatch<React.SetStateAction<SummaryResponse>>;
}

function DateTimePicker({ value, onChange }: { value?: Date; onChange: (date: Date) => void }) {
  const [date, setDate] = useState<Date | undefined>(value);
  const [isOpen, setIsOpen] =useState(false);


  useEffect(() => {
    if (value) {
      setDate(value);
    }
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (date) {
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
      }
      setDate(newDate);
      onChange(newDate);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", value: string) => {
    if (date) {
      const newDate = new Date(date);
      if (type === "hour") {
        newDate.setHours(parseInt(value));
      } else if (type === "minute") {
        newDate.setMinutes(parseInt(value));
      }
      setDate(newDate);
      onChange(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MM/dd/yyyy HH:mm") : <span>MM/DD/YYYY HH:mm</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={date && date.getHours() === hour ? "default" : "ghost"}
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
                    variant={date && date.getMinutes() === minute ? "default" : "ghost"}
                    onClick={() => handleTimeChange("minute", minute.toString())}
                  >
                    {minute.toString().padStart(2, '0')}
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

export function DateRangePicker({ setSummaries }: DateRangePickerProps) {
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      from: (() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); 
        return now;
      })(),
      to: new Date(),
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true);
    console.log("Submitting data:", data);
    startTransition(() => {
      fetchSummaries(data.from.toISOString(), data.to.toISOString())
        .then((response) => {
          setSummaries(response as SummaryResponse);
        })
        .catch((error) => {
          console.error("Error fetching summaries:", error);
        })
        .finally(() => {
          setLoading(false);
        })
    });
  }

  return (
    <div className="">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex lg:gap-4 gap-1 items-center justify-center">
        <FormField
          control={form.control}
          name="from"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <DateTimePicker
                value={field.value}
                onChange={(date) => form.setValue("from", date)}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="to"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <DateTimePicker
                value={field.value}
                onChange={(date) => form.setValue("to", date)}
              />
              <FormMessage />
            </FormItem>
          )}
        />
         <Button type="submit" className="text-sm">
                {loading ? (
                    <div className="border-t-transparent border-4 border-green-500 w-[20px] h-[20px] rounded-full animate-spin"></div> // Replace with your loading spinner component
                ) : (
                    'Filter'
                )}
            </Button>
      </form>
    </Form>
    </div>
  );
}
