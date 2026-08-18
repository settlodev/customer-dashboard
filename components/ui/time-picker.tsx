"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * Shadcn-style time picker — Popover with two scroll-columns (hours, minutes)
 * matching the look-and-feel of the existing DateTimePicker, but working on
 * a plain "HH:mm" string instead of a Date object.
 *
 *   <TimePicker value={field.value} onChange={field.onChange} />
 *
 * Empty string represents "no time set". Selecting either column populates
 * the other half from the current value (or sane defaults: 12:00).
 */

export interface TimePickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Minutes step — defaults to 5. */
  minuteStep?: number;
  className?: string;
}

function parseTime(raw: string | undefined): { hour: number; minute: number } | null {
  if (!raw) return null;
  const [h, m] = raw.split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { hour, minute };
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function TimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Pick a time",
  minuteStep = 5,
  className,
}: TimePickerProps) {
  const parsed = parseTime(value);
  const display = parsed
    ? formatTime(parsed.hour, parsed.minute)
    : undefined;

  // Pre-compute the minutes column. 5-minute steps by default → 12 cells.
  const minutes = React.useMemo(
    () =>
      Array.from(
        { length: Math.floor(60 / minuteStep) },
        (_, i) => i * minuteStep,
      ),
    [minuteStep],
  );

  const setHour = (h: number) => {
    const minute = parsed?.minute ?? 0;
    onChange(formatTime(h, minute));
  };

  const setMinute = (m: number) => {
    const hour = parsed?.hour ?? 12;
    onChange(formatTime(hour, m));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left font-normal",
            !display && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="mr-2 h-4 w-4 opacity-50" />
          {display ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex h-[260px]">
          <ScrollArea className="w-16">
            <div className="flex flex-col p-2">
              {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                const active = parsed?.hour === hour;
                return (
                  <Button
                    key={hour}
                    size="icon"
                    variant={active ? "default" : "ghost"}
                    className="aspect-square w-full shrink-0 font-mono text-[12.5px] tabular-nums"
                    onClick={() => setHour(hour)}
                  >
                    {String(hour).padStart(2, "0")}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
          <div className="w-px bg-border" />
          <ScrollArea className="w-16">
            <div className="flex flex-col p-2">
              {minutes.map((minute) => {
                const active = parsed?.minute === minute;
                return (
                  <Button
                    key={minute}
                    size="icon"
                    variant={active ? "default" : "ghost"}
                    className="aspect-square w-full shrink-0 font-mono text-[12.5px] tabular-nums"
                    onClick={() => setMinute(minute)}
                  >
                    {String(minute).padStart(2, "0")}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
