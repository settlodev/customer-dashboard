"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  StickyNote,
  Table2,
  Users,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Reservation,
  RESERVATION_STATUS_LABELS,
  RESERVATION_SOURCE_LABELS,
  DEPOSIT_STATUS_LABELS,
} from "@/types/reservation/type";
import {
  DepositPaymentStatus,
  ReservationSource,
  ReservationStatus,
} from "@/types/enums";

interface ReservationCalendarViewProps {
  reservations: Reservation[];
  currentMonth: Date;
}

const MAX_VISIBLE_PER_DAY = 3;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_TONE: Record<
  ReservationStatus,
  { variant: "pos" | "neg" | "warn" | "soft"; label: string }
> = {
  [ReservationStatus.PENDING]: { variant: "warn", label: "Pending" },
  [ReservationStatus.CONFIRMED]: { variant: "pos", label: "Confirmed" },
  [ReservationStatus.SEATED]: { variant: "pos", label: "Seated" },
  [ReservationStatus.COMPLETED]: { variant: "soft", label: "Completed" },
  [ReservationStatus.CANCELLED]: { variant: "neg", label: "Cancelled" },
  [ReservationStatus.NO_SHOW]: { variant: "neg", label: "No-show" },
};

export function ReservationCalendarView({
  reservations,
  currentMonth,
}: ReservationCalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = React.useState<Reservation | null>(null);
  const [dayContext, setDayContext] = React.useState<{
    date: Date;
    items: Reservation[];
  } | null>(null);

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
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("next")}
            >
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
                        <button
                          type="button"
                          onClick={() =>
                            setDayContext({ date: day, items: dayReservations })
                          }
                          className="text-xs text-muted-foreground hover:text-ink transition-colors"
                          title={`Show all ${dayReservations.length} bookings`}
                        >
                          {dayReservations.length}
                        </button>
                      )}
                    </div>

                    {/* Reservation Cards */}
                    <div className="space-y-0.5">
                      {visibleReservations.map((reservation) => (
                        <Tooltip key={reservation.id}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setSelected(reservation)}
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
                              <div className="text-[10.5px] text-muted-foreground italic">
                                Click for details
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {hiddenCount > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDayContext({ date: day, items: dayReservations })
                          }
                          className="w-full text-left text-xs text-muted-foreground hover:text-ink px-1.5 py-0.5 rounded hover:bg-accent transition-colors"
                        >
                          +{hiddenCount} more
                        </button>
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

        {/* Day reservations dialog (when user clicks day count or +N more) */}
        <DayReservationsDialog
          context={dayContext}
          onClose={() => setDayContext(null)}
          onSelect={(r) => {
            setDayContext(null);
            setSelected(r);
          }}
        />

        {/* Single reservation detail dialog */}
        <ReservationQuickViewDialog
          reservation={selected}
          onClose={() => setSelected(null)}
        />
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

// ─────────────────────────────────────────────────────────────────────
// Quick-view dialog — single reservation summary with deep-link CTA.
// ─────────────────────────────────────────────────────────────────────

function ReservationQuickViewDialog({
  reservation,
  onClose,
}: {
  reservation: Reservation | null;
  onClose: () => void;
}) {
  const open = reservation !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        {reservation ? (
          <ReservationQuickViewBody reservation={reservation} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ReservationQuickViewBody({
  reservation,
}: {
  reservation: Reservation;
}) {
  const tone = STATUS_TONE[reservation.reservationStatus as ReservationStatus];
  const dateLabel = reservation.reservationDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(
        new Date(reservation.reservationDate + "T00:00:00"),
      )
    : "—";
  const timeLabel = reservation.reservationTime
    ? reservation.reservationEndTime
      ? `${reservation.reservationTime.substring(0, 5)} – ${reservation.reservationEndTime.substring(0, 5)}`
      : reservation.reservationTime.substring(0, 5)
    : "—";
  const sourceLabel = reservation.source
    ? RESERVATION_SOURCE_LABELS[reservation.source as ReservationSource] ??
      String(reservation.source)
    : null;
  const depositVisible =
    reservation.depositPaymentStatus &&
    reservation.depositPaymentStatus !== DepositPaymentStatus.NOT_REQUIRED;

  return (
    <>
      <DialogHeader className="text-left">
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base">
              {reservation.customerName || "Walk-in"}
            </DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              {dateLabel} · {timeLabel}
            </DialogDescription>
          </div>
          {tone ? (
            <Badge variant={tone.variant} className="text-[10.5px] shrink-0">
              {tone.label}
            </Badge>
          ) : null}
        </div>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-2.5">
        <QuickField
          icon={CalendarDays}
          label="Date"
          value={
            reservation.reservationDate
              ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                  new Date(reservation.reservationDate + "T00:00:00"),
                )
              : "—"
          }
        />
        <QuickField icon={Clock} label="Time" value={timeLabel} />
        <QuickField
          icon={Users}
          label="Guests"
          value={
            reservation.peopleCount != null
              ? `${reservation.peopleCount} guest${reservation.peopleCount === 1 ? "" : "s"}`
              : "—"
          }
        />
        <QuickField
          icon={Table2}
          label="Table"
          value={reservation.tableAndSpaceName ?? "Unassigned"}
        />
        {reservation.sectionName ? (
          <QuickField
            icon={MapPin}
            label="Section"
            value={reservation.sectionName}
          />
        ) : null}
        {sourceLabel ? (
          <QuickField icon={Sparkles} label="Source" value={sourceLabel} />
        ) : null}
        {reservation.customerPhone ? (
          <QuickField
            icon={Phone}
            label="Phone"
            value={reservation.customerPhone}
          />
        ) : null}
        {reservation.customerEmail ? (
          <QuickField
            icon={Mail}
            label="Email"
            value={reservation.customerEmail}
          />
        ) : null}
        {depositVisible ? (
          <QuickField
            icon={CreditCard}
            label="Deposit"
            value={
              DEPOSIT_STATUS_LABELS[
                reservation.depositPaymentStatus as DepositPaymentStatus
              ] ?? String(reservation.depositPaymentStatus)
            }
          />
        ) : null}
      </div>

      {reservation.specialRequests ? (
        <div className="rounded-md border border-line bg-canvas px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            <StickyNote className="h-3 w-3" />
            Special requests
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[12.5px] text-ink-2">
            {reservation.specialRequests}
          </p>
        </div>
      ) : null}

      <DialogFooter className="gap-2 sm:gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/reservations/${reservation.id}/edit`}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/reservations/${reservation.id}`}>
            View full details
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </DialogFooter>
    </>
  );
}

function QuickField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-line bg-canvas px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-2.5 w-2.5" />
        {label}
      </div>
      <p className="mt-0.5 truncate text-[12.5px] text-ink-2">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Day-level dialog — list every reservation for a single day.
// ─────────────────────────────────────────────────────────────────────

function DayReservationsDialog({
  context,
  onClose,
  onSelect,
}: {
  context: { date: Date; items: Reservation[] } | null;
  onClose: () => void;
  onSelect: (r: Reservation) => void;
}) {
  const open = context !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        {context ? (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="text-base">
                {format(context.date, "EEEE, MMMM d")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {context.items.length} reservation
                {context.items.length === 1 ? "" : "s"} on this day
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="space-y-1.5">
                {context.items.map((r) => {
                  const tone =
                    STATUS_TONE[r.reservationStatus as ReservationStatus];
                  const time = r.reservationTime
                    ? r.reservationTime.substring(0, 5)
                    : "—";
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelect(r)}
                      className={cn(
                        "w-full text-left rounded-md border border-line bg-canvas px-3 py-2.5",
                        "hover:bg-accent transition-colors",
                        "flex items-center gap-3",
                      )}
                    >
                      <div className="text-[12.5px] font-mono font-medium text-ink-2 w-12 shrink-0">
                        {time}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-ink truncate">
                          {r.customerName || "Walk-in"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {r.peopleCount} guest{r.peopleCount === 1 ? "" : "s"}
                          {r.tableAndSpaceName
                            ? ` · ${r.tableAndSpaceName}`
                            : ""}
                        </div>
                      </div>
                      {tone ? (
                        <Badge
                          variant={tone.variant}
                          className="text-[10px] shrink-0"
                        >
                          {tone.label}
                        </Badge>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
