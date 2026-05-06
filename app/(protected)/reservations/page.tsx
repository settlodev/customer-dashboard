import Link from "next/link";
import { format, parse } from "date-fns";
import {
  CalendarDays,
  CalendarOff,
  Clock,
  List,
  Plus,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/reservation/columns";
import { ReservationCalendarView } from "@/components/tables/reservation/reservation-calendar";
import {
  searchReservation,
  searchReservationsByMonth,
  fetchAllReservations,
} from "@/lib/actions/reservation-actions";
import { Reservation } from "@/types/reservation/type";
import { ReservationStatus } from "@/types/enums";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    view?: string;
    month?: string;
  }>;
};

const TODAY = () => new Date().toISOString().slice(0, 10);

function isUpcoming(r: Reservation): boolean {
  const today = TODAY();
  return (
    r.reservationDate >= today &&
    (r.reservationStatus === ReservationStatus.PENDING ||
      r.reservationStatus === ReservationStatus.CONFIRMED)
  );
}

function isToday(r: Reservation): boolean {
  return r.reservationDate === TODAY();
}

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const view = resolvedSearchParams.view || "list";
  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);

  const now = new Date();
  const monthParam = resolvedSearchParams.month;
  const currentMonth = monthParam
    ? parse(monthParam, "yyyy-MM", new Date())
    : now;
  const calendarYear = currentMonth.getFullYear();
  const calendarMonth = currentMonth.getMonth() + 1;
  const currentMonthStr = format(currentMonth, "yyyy-MM");

  // Pull a 30-day window so the KPI strip reflects an "active" picture
  // regardless of whether the user is on the list or calendar view.
  // Fetch is best-effort — if the summary endpoint is unavailable the
  // page should still render the table or calendar.
  const today = new Date();
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - 30);
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + 30);
  const fmtIso = (d: Date) => d.toISOString().slice(0, 10);

  let allRecent: Reservation[] = [];
  try {
    const result = await fetchAllReservations({
      from: fmtIso(windowStart),
      to: fmtIso(windowEnd),
    });
    if (Array.isArray(result)) allRecent = result;
  } catch {
    allRecent = [];
  }

  const totalRecent = allRecent.length;
  const todayCount = allRecent.filter(isToday).length;
  const upcomingCount = allRecent.filter(isUpcoming).length;
  const completedCount = allRecent.filter(
    (r) => r.reservationStatus === ReservationStatus.COMPLETED,
  ).length;
  const noShowCount = allRecent.filter(
    (r) => r.reservationStatus === ReservationStatus.NO_SHOW,
  ).length;
  const guestsCount = allRecent.reduce(
    (sum, r) => sum + (r.peopleCount ?? 0),
    0,
  );

  let data: Reservation[] = [];
  let total = 0;
  let pageCount = 0;
  let calendarReservations: Reservation[] = [];

  if (view === "calendar") {
    try {
      const result = await searchReservationsByMonth(
        calendarYear,
        calendarMonth,
      );
      if (Array.isArray(result)) calendarReservations = result;
    } catch {
      calendarReservations = [];
    }
  } else {
    try {
      const responseData = await searchReservation(q, page, pageLimit);
      if (responseData && Array.isArray(responseData.content)) {
        data = responseData.content;
        total = responseData.totalElements ?? 0;
        pageCount = responseData.totalPages ?? 0;
      }
    } catch {
      data = [];
      total = 0;
      pageCount = 0;
    }
  }

  const hasAny = totalRecent > 0 || total > 0;
  const hasFilters = q !== "";

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Reservations" }]} />
      <PageHeader
        title="Reservations"
        subtitle="Bookings, walk-ins, and seating across this location."
        actions={
          <>
            <div className="inline-flex items-center rounded-md border border-line bg-card p-[3px]">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={`h-8 rounded-[5px] px-3 text-[12.5px] ${
                  view === "list"
                    ? "bg-canvas text-ink"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                <Link href="/reservations?view=list">
                  <List className="mr-1.5 h-3.5 w-3.5" />
                  List
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={`h-8 rounded-[5px] px-3 text-[12.5px] ${
                  view === "calendar"
                    ? "bg-canvas text-ink"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                <Link
                  href={`/reservations?view=calendar&month=${currentMonthStr}`}
                >
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  Calendar
                </Link>
              </Button>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings?tab=reservations&subtab=schedule">
                <Clock className="mr-1.5 h-4 w-4" />
                Schedule
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings?tab=reservations&subtab=exceptions">
                <CalendarOff className="mr-1.5 h-4 w-4" />
                Exceptions
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/reservations/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add reservation
              </Link>
            </Button>
          </>
        }
      />

      <PageBody>
        {hasAny || hasFilters ? (
          <>
            <KpiStrip cols={5}>
              <KpiCard
                icon={<CalendarDays className="h-3 w-3" />}
                label="Last 30d"
                value={totalRecent.toLocaleString()}
                delta="±15 day window"
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CalendarCheck className="h-3 w-3" />}
                label="Today"
                value={todayCount > 0 ? todayCount.toLocaleString() : "—"}
                deltaTone="pos"
              />
              <KpiCard
                icon={<CalendarClock className="h-3 w-3" />}
                label="Upcoming"
                value={upcomingCount > 0 ? upcomingCount.toLocaleString() : "—"}
                delta={
                  upcomingCount > 0
                    ? "Pending or confirmed"
                    : undefined
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Guests"
                value={guestsCount > 0 ? guestsCount.toLocaleString() : "—"}
                delta={
                  completedCount > 0
                    ? `${completedCount.toLocaleString()} completed`
                    : undefined
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CalendarX className="h-3 w-3" />}
                label="No-shows"
                value={noShowCount > 0 ? noShowCount.toLocaleString() : "—"}
                deltaTone={noShowCount > 0 ? "neg" : "neutral"}
              />
            </KpiStrip>

            {view === "calendar" ? (
              <Card>
                <CardContent className="space-y-1 px-2 pt-6 sm:px-6">
                  <h2 className="text-sm font-semibold text-ink">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                  <p className="mb-4 text-[12.5px] text-muted-foreground">
                    Calendar view — click any day to see its bookings.
                  </p>
                  <ReservationCalendarView
                    reservations={calendarReservations}
                    currentMonth={currentMonth}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="px-2 pt-6 sm:px-6">
                  <DataTable
                    columns={columns}
                    data={data}
                    pageCount={pageCount}
                    pageNo={page}
                    searchKey="customerName"
                    total={total}
                    rowClickBasePath="/reservations"
                  />
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <NoItems
            itemName="reservations"
            newItemUrl="/reservations/new"
          />
        )}
      </PageBody>
    </PageShell>
  );
}
