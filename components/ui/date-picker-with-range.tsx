
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTransition } from "react";
import { fetchSummaries } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
// import { Orders } from "@/types/orders/type";
// import { searchOrder } from "@/lib/actions/order-actions";


const FormSchema = z.object({
  dateRange: z.object({
    from: z.date({
      required_error: "Start date and time are required.",
    }),
    to: z.date({
      required_error: "End date and time are required.",
    }),
  }),
});

interface SingleInputDateRangeWithTimePickerProps {
  setSummaries: React.Dispatch<React.SetStateAction<SummaryResponse>>;
  // setOrders: React.Dispatch<React.SetStateAction<Orders[]>>;

}

export function SingleInputDateRangeWithTimePicker({ setSummaries,}: SingleInputDateRangeWithTimePickerProps) {
  const [, startTransition] = useTransition();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues:{
        dateRange:{from: new Date(), to: new Date()}
    }
  });

  // function onSubmit(data: z.infer<typeof FormSchema>) {
  //   startTransition(async () => {
  //     const { from: startDate, to: endDate } = data.dateRange;
  
  //     try {
  //       // Fetch summaries
  //       const summaryResponse = await fetchSummaries(
  //         startDate.toISOString(),
  //         endDate.toISOString()
  //       );
  //       setSummaries(summaryResponse as SummaryResponse);
  
  //       // Search orders based on the date range
  //       // const from_date = startDate.toISOString()
  //       // const to_date = endDate.toISOString()

  //       // const filters = [{
  //       //   "key": "openedDate",
  //       //   "operator": "BETWEEN",
  //       //   "field_type": "DATE",
  //       //   "value:": from_date,
  //       //   "value_to": to_date,
  //       // }]; 
  //       // console.log("Filters are as follow:", filters)
  //       // const ordersResponse= await searchOrder(1, 5,"", filters); 
  //       // console.log("Orders are as follow:", ordersResponse);
  //       // setOrders(ordersResponse); 
  //     } catch (error) {
  //       console.error("Error fetching summaries or orders:", error);
  //     }
  //   });
  // }
  
  function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(() => {
      const { from: startDate, to: endDate } = data.dateRange;
      fetchSummaries(
        startDate.toISOString(),
        endDate.toISOString()
      )
        .then((response) => {
          setSummaries(response as SummaryResponse);
        })
        .catch((error) => {
          console.error("Error fetching summaries:", error);
        });
    });
  }

  function handleDateChange(rangeType: "from" | "to", selectedDate: Date) {
    const currentTime = form.getValues("dateRange")[rangeType];
    const newDate = new Date(selectedDate);

    if (currentTime) {
      newDate.setHours(currentTime.getHours());
      newDate.setMinutes(currentTime.getMinutes());
    }

    form.setValue(`dateRange.${rangeType}`, newDate,{shouldDirty:false});
  }

  function handleTimeChange(
    rangeType: "from" | "to",
    unit: "hour" | "minute",
    value: string
  ) {
    const currentDate = form.getValues("dateRange")[rangeType];
    if (!currentDate) return;
    const newDate = new Date(currentDate);

    if (unit === "hour") {
      newDate.setHours(parseInt(value, 10));
    } else if (unit === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    }

    form.setValue(`dateRange.${rangeType}`, newDate,{shouldDirty:true});
  }

  return (
    
    <Form {...form} >
      <form onSubmit={form.handleSubmit(onSubmit)} className=" flex gap-2 items-center justify-center ">
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal gap-1",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value?.from && field.value?.to ? (
                        `${format(
                          field.value.from,
                          "MMM do, yyyy HH:mm"
                        )} - ${format(field.value.to, "MMM do, yyyy HH:mm")}`
                      ) : (
                        <span className="text-sm">Select date and time range</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="sm:flex">
                  <Calendar
                      mode="range"
                      selected={field.value}
                      onSelect={(dateRange) => {
                        if (dateRange?.from) {
                          handleDateChange("from", dateRange.from);
                        }
                        if (dateRange?.to) {
                          handleDateChange("to", dateRange.to);
                        }
                      }}
                      initialFocus
                      numberOfMonths={2}
                    />
                    {["from", "to"].map((rangeType) => (
                      <div
                        key={rangeType}
                        className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x"
                      >
                        <ScrollArea className="w-64 sm:w-auto">
                          <div className="flex sm:flex-col p-2">
                            {Array.from({ length: 24 }, (_, i) => i)
                              .reverse()
                              .map((hour) => (
                                <Button
                                  key={hour}
                                  size="icon"
                                  variant={
                                    field.value?.[rangeType as "from" | "to"] &&
                                    field.value[rangeType as "from" | "to"]?.getHours() === hour
                                      ? "default"
                                      : "ghost"
                                  }
                                  className="sm:w-full shrink-0 aspect-square"
                                  onClick={() =>
                                    handleTimeChange(
                                      rangeType as "from" | "to",
                                      "hour",
                                      hour.toString()
                                    )
                                  }
                                >
                                  {hour}
                                </Button>
                              ))}
                          </div>
                          <ScrollBar
                            orientation="horizontal"
                            className="sm:hidden"
                          />
                        </ScrollArea>
                        <ScrollArea className="w-64 sm:w-auto">
                          <div className="flex sm:flex-col p-2">
                            {Array.from({ length: 12 }, (_, i) => i * 5).map(
                              (minute) => (
                                <Button
                                  key={minute}
                                  size="icon"
                                  variant={
                                    field.value?.[rangeType as "from" | "to"] &&
                                    field.value[rangeType as "from" | "to"]?.getMinutes() ===
                                      minute
                                      ? "default"
                                      : "ghost"
                                  }
                                  className="sm:w-full shrink-0 aspect-square"
                                  onClick={() =>
                                    handleTimeChange(
                                      rangeType as "from" | "to",
                                      "minute",
                                      minute.toString()
                                    )
                                  }
                                >
                                  {minute.toString().padStart(2, "0")}
                                </Button>
                              )
                            )}
                          </div>
                          <ScrollBar
                            orientation="horizontal"
                            className="sm:hidden"
                          />
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">filter</Button>
      </form>
    </Form>
    
  );
}
