import Link from "next/link";
import { format, parse } from "date-fns";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CalendarOff, List, CalendarDays } from "lucide-react";
import { DataTable } from "@/components/tables/data-table";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/reservation/columns";
import { ReservationCalendarView } from "@/components/tables/reservation/reservation-calendar";
import { searchReservation, searchReservationsByMonth } from "@/lib/actions/reservation-actions";

const breadcrumbItems = [{ title: "Reservations", link: "/reservations" }];

type Params = {
    searchParams: Promise<{
        search?: string;
        page?: string;
        limit?: string;
        view?: string;
        month?: string;
    }>
};

export default async function Page({ searchParams }: Params) {
    const resolvedSearchParams = await searchParams;

    const view = resolvedSearchParams.view || "list";
    const q = resolvedSearchParams.search || "";
    const page = Number(resolvedSearchParams.page) || 0;
    const pageLimit = Number(resolvedSearchParams.limit);

    // For calendar view, determine the month and fetch data
    const now = new Date();
    const monthParam = resolvedSearchParams.month;
    const currentMonth = monthParam
        ? parse(monthParam, "yyyy-MM", new Date())
        : now;
    const calendarYear = currentMonth.getFullYear();
    const calendarMonth = currentMonth.getMonth() + 1; // 1-indexed

    // Fetch data based on view
    let data: any[] = [];
    let total = 0;
    let pageCount = 0;
    let calendarReservations: any[] = [];

    if (view === "calendar") {
        calendarReservations = await searchReservationsByMonth(calendarYear, calendarMonth);
    } else {
        const responseData = await searchReservation(q, page, pageLimit);
        data = responseData.content;
        total = responseData.totalElements;
        pageCount = responseData.totalPages;
    }

    const currentMonthStr = format(currentMonth, "yyyy-MM");

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>

                <div className="flex items-center space-x-2">
                    {/* View Toggle */}
                    <div className="flex items-center border rounded-md">
                        <Button
                            variant={view === "list" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-r-none h-9"
                            asChild
                        >
                            <Link href="/reservations?view=list">
                                <List className="h-4 w-4 mr-1.5" />
                                List
                            </Link>
                        </Button>
                        <Button
                            variant={view === "calendar" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-l-none h-9"
                            asChild
                        >
                            <Link href={`/reservations?view=calendar&month=${currentMonthStr}`}>
                                <CalendarDays className="h-4 w-4 mr-1.5" />
                                Calendar
                            </Link>
                        </Button>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/settings?tab=reservations&subtab=schedule">
                            <Clock className="h-4 w-4 mr-2" />
                            Schedule
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/settings?tab=reservations&subtab=exceptions">
                            <CalendarOff className="h-4 w-4 mr-2" />
                            Exceptions
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/reservations/new">Add Reservation</Link>
                    </Button>
                </div>
            </div>

            {view === "calendar" ? (
                <Card x-chunk="calendar-view">
                    <CardHeader>
                        <CardTitle>Reservations</CardTitle>
                        <CardDescription>
                            Calendar view of reservations for {format(currentMonth, "MMMM yyyy")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReservationCalendarView
                            reservations={calendarReservations}
                            currentMonth={currentMonth}
                        />
                    </CardContent>
                </Card>
            ) : total > 0 || q != "" ? (
                <Card x-chunk="data-table">
                    <CardHeader>
                        <CardTitle>Reservations</CardTitle>
                        <CardDescription>Manage reservations in your business location</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={data}
                            pageCount={pageCount}
                            pageNo={page}
                            searchKey="customerName"
                            total={total}
                        />
                    </CardContent>
                </Card>
            ) : (
                <NoItems itemName="reservations" newItemUrl="/reservations/new" />
            )}
        </div>
    );
}
