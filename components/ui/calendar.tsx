"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
        // Fluid grid (flex-1 / aspect-square cells) has no intrinsic width,
        // so without a floor it collapses to min-content inside w-auto
        // popovers. min-w keeps each month usable; w-full still lets it grow.
        month: "space-y-4 w-full min-w-[16rem]",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label:
          "inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium",
        caption_dropdowns: "flex justify-center gap-1",
        dropdown:
          "absolute inset-0 z-20 w-full cursor-pointer appearance-none bg-transparent opacity-0",
        dropdown_month:
          "relative inline-flex items-center whitespace-nowrap rounded px-2 py-1 hover:bg-accent",
        dropdown_year:
          "relative inline-flex items-center whitespace-nowrap rounded px-2 py-1 hover:bg-accent",
        vhidden: "sr-only",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full",
        head_cell:
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "flex-1 aspect-square text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-full p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ }) => <ChevronRight className="h-4 w-4" />,
        // Default IconDropdown ships an 8px SVG that doesn't pick up the
        // surrounding font color and can wrap below the label depending
        // on width. Replace it with a Lucide chevron so it inherits
        // currentColor and stays inline with the month / year text.
        IconDropdown: ({ }) => (
          <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-60" />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
