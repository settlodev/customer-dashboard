"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Reservation,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS,
} from "@/types/reservation/type";
import { ReservationStatus } from "@/types/enums";

interface ReservationCalendarViewProps {
  reservations: Reservation[];
  currentMonth: Date;
}

const MAX_VISIBLE_PER_DAY = 3;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ReservationCalendarView({
  reservations,
  currentMonth,
}: ReservationCalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Group reservations by date
  const reservationsByDate = React.useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) {
      const key = r.reservationDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    // Sort each day's reservations by time
    for (const [, dayReservations] of map) {
      dayReservations.sort((a, b) =>
        (a.reservationTime || "").localeCompare(b.reservationTime || ""),
      );
    }
    return map;
  }, [reservations]);

  // Build calendar grid (weeks starting Monday)
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth =
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1);
    const params = new URLSearchParams(searchParams?.toString());
    params.set("view", "calendar");
    params.set("month", format(newMonth, "yyyy-MM"));
    router.push(`/reservations?${params.toString()}`);
  };

  const goToToday = () => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("view", "calendar");
    params.set("month", format(new Date(), "yyyy-MM"));
    router.push(`/reservations?${params.toString()}`);
  };

  const getStatusDotColor = (status: ReservationStatus): string => {
    switch (status) {
      case ReservationStatus.PENDING:
        return "bg-yellow-500";
      case ReservationStatus.CONFIRMED:
        return "bg-blue-500";
      case ReservationStatus.SEATED:
        return "bg-emerald-500";
      case ReservationStatus.COMPLETED:
        return "bg-gray-400";
      case ReservationStatus.CANCELLED:
        return "bg-red-500";
      case ReservationStatus.NO_SHOW:
        return "bg-orange-500";
      default:
        return "bg-gray-400";
    }
  };

  // Split days into week rows
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold ml-2">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-md border overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 px-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Week Rows */}
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 divide-x">
              {week.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayReservations = reservationsByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const visibleReservations = dayReservations.slice(
                  0,
                  MAX_VISIBLE_PER_DAY,
                );
                const hiddenCount =
                  dayReservations.length - MAX_VISIBLE_PER_DAY;

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "min-h-[120px] p-1.5 border-b transition-colors",
                      !isCurrentMonth && "bg-muted/30",
                      today && "bg-blue-50/50 dark:bg-blue-950/20",
                    )}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-sm font-medium inline-flex items-center justify-center",
                          !isCurrentMonth && "text-muted-foreground",
                          today &&
                            "bg-primary text-primary-foreground rounded-full w-6 h-6 text-xs",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayReservations.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {dayReservations.length}
                        </span>
                      )}
                    </div>

                    {/* Reservation Cards */}
                    <div className="space-y-0.5">
                      {visibleReservations.map((reservation) => (
                        <Tooltip key={reservation.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() =>
                                router.push(
                                  `/reservations/${reservation.id}`,
                                )
                              }
                              className={cn(
                                "w-full text-left rounded px-1.5 py-0.5 text-xs truncate cursor-pointer",
                                "hover:opacity-80 transition-opacity",
                                getCardBgColor(
                                  reservation.reservationStatus as ReservationStatus,
                                ),
                              )}
                            >
                              <span className="font-medium">
                                {reservation.reservationTime
                                  ? reservation.reservationTime.substring(0, 5)
                                  : ""}
                              </span>{" "}
                              {reservation.customerName || "Walk-in"}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-[240px]"
                          >
                            <div className="space-y-1.5">
                              <div className="font-medium">
                                {reservation.customerName || "Walk-in"}
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                {reservation.reservationTime
                                  ? reservation.reservationTime.substring(0, 5)
                                  : "N/A"}
                                {reservation.reservationEndTime && (
                                  <>
                                    {" - "}
                                    {reservation.reservationEndTime.substring(
                                      0,
                                      5,
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Users className="h-3 w-3" />
                                {reservation.peopleCount} guest
                                {reservation.peopleCount !== 1 ? "s" : ""}
                              </div>
                              {reservation.tableAndSpaceName && (
                                <div className="text-xs">
                                  Table: {reservation.tableAndSpaceName}
                                </div>
                              )}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  RESERVATION_STATUS_COLORS[
                                    reservation.reservationStatus as ReservationStatus
                                  ],
                                )}
                              >
                                {RESERVATION_STATUS_LABELS[
                                  reservation.reservationStatus as ReservationStatus
                                ] || reservation.reservationStatus}
                              </Badge>
                              {reservation.specialRequests && (
                                <div className="text-xs text-muted-foreground italic">
                                  {reservation.specialRequests}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {hiddenCount > 0 && (
                        <div className="text-xs text-muted-foreground px-1.5 py-0.5">
                          +{hiddenCount} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {Object.entries(RESERVATION_STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  getStatusDotColor(status as ReservationStatus),
                )}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function getCardBgColor(status: ReservationStatus): string {
  switch (status) {
    case ReservationStatus.PENDING:
      return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200";
    case ReservationStatus.CONFIRMED:
      return "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200";
    case ReservationStatus.SEATED:
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200";
    case ReservationStatus.COMPLETED:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300";
    case ReservationStatus.CANCELLED:
      return "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200";
    case ReservationStatus.NO_SHOW:
      return "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
