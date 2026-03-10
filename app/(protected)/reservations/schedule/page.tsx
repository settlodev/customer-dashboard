"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import Loading from "@/app/loading";
import ReservationSlotManager from "@/components/forms/reservation_slot_form";
import { fetchReservationSlots } from "@/lib/actions/reservation-actions";
import { ReservationSlot } from "@/types/reservation/type";

const breadcrumbItems = [
  { title: "Reservations", link: "/reservations" },
  { title: "Schedule", link: "/reservations/schedule" },
];

export default function SchedulePage() {
  const [slots, setSlots] = useState<ReservationSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchReservationSlots();
      setSlots(data ?? []);
    } catch (error) {
      console.error("Failed to load reservation slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1 md:max-w-md">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservation Schedule</CardTitle>
          <CardDescription>
            Define time windows for each day of the week when reservations are
            accepted. Each rule generates bookable time slots at the specified
            interval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReservationSlotManager slots={slots} onRefresh={loadData} />
        </CardContent>
      </Card>
    </div>
  );
}
