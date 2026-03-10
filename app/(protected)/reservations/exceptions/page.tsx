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
import ReservationExceptionManager from "@/components/forms/reservation_exception_form";
import { fetchReservationExceptions } from "@/lib/actions/reservation-actions";
import { ReservationException } from "@/types/reservation/type";

const breadcrumbItems = [
  { title: "Reservations", link: "/reservations" },
  { title: "Exceptions", link: "/reservations/exceptions" },
];

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<ReservationException[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchReservationExceptions();
      setExceptions(data ?? []);
    } catch (error) {
      console.error("Failed to load reservation exceptions:", error);
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
          <CardTitle>Reservation Exceptions</CardTitle>
          <CardDescription>
            Add date-based closures, holidays, or blocked time ranges that
            override the normal schedule and prevent reservations from being
            accepted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReservationExceptionManager
            exceptions={exceptions}
            onRefresh={loadData}
          />
        </CardContent>
      </Card>
    </div>
  );
}
