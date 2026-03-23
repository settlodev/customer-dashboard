"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Settings2, MessageSquareText, Clock, CalendarOff } from "lucide-react";

import ReservationSettingForm from "@/components/forms/reservation_setting_form";
import BookingQuestionsManager from "@/components/forms/booking_question_form";
import ReservationSlotManager from "@/components/forms/reservation_slot_form";
import ReservationExceptionManager from "@/components/forms/reservation_exception_form";
import {
  fetchReservationSettings,
  fetchBookingQuestions,
} from "@/lib/actions/reservation-setting-actions";
import {
  fetchReservationSlots,
  fetchReservationExceptions,
} from "@/lib/actions/reservation-actions";
import {
  ReservationSetting,
  BookingQuestion,
} from "@/types/reservation-setting/type";
import { ReservationSlot, ReservationException } from "@/types/reservation/type";

const ReservationSettings = ({ defaultTab }: { defaultTab?: string }) => {
  const [settings, setSettings] = useState<ReservationSetting | null>(null);
  const [questions, setQuestions] = useState<BookingQuestion[]>([]);
  const [slots, setSlots] = useState<ReservationSlot[]>([]);
  const [exceptions, setExceptions] = useState<ReservationException[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [settingsData, questionsData, slotsData, exceptionsData] = await Promise.all([
        fetchReservationSettings(),
        fetchBookingQuestions(),
        fetchReservationSlots(),
        fetchReservationExceptions(),
      ]);
      setSettings(settingsData);
      setQuestions(questionsData);
      setSlots(slotsData);
      setExceptions(exceptionsData);
    } catch (err) {
      console.error("Failed to load reservation settings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load settings",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reservations</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure booking rules, policies, and custom questions for your location
          </p>
        </div>
        <div className="max-w-2xl overflow-hidden">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <div className="flex-1 h-9 bg-white dark:bg-gray-900 rounded-md shadow-sm animate-pulse" />
            <div className="flex-1 h-9 rounded-md animate-pulse" />
            <div className="flex-1 h-9 rounded-md animate-pulse" />
            <div className="flex-1 h-9 rounded-md animate-pulse" />
          </div>
        </div>
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
                </div>
                <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto rounded-xl border shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-2">
            <svg
              className="w-8 h-8 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Reservation Settings
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reservations</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure booking rules, policies, and custom questions for your
          location
        </p>
      </div>

      <Tabs defaultValue={defaultTab || "settings"} className="w-full">
        <TabsList className="inline-flex w-full max-w-2xl bg-primary/10 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto no-scrollbar">
          <TabsTrigger
            value="settings"
            className="flex-1 min-w-0 gap-1.5 rounded-md text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Settings2 className="h-4 w-4 hidden sm:block flex-shrink-0" />
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="flex-1 min-w-0 gap-1.5 rounded-md text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Clock className="h-4 w-4 hidden sm:block flex-shrink-0" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="exceptions"
            className="flex-1 min-w-0 gap-1.5 rounded-md text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <CalendarOff className="h-4 w-4 hidden sm:block flex-shrink-0" />
            Exceptions
          </TabsTrigger>
          <TabsTrigger
            value="questions"
            className="flex-1 min-w-0 gap-1.5 rounded-md text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <MessageSquareText className="h-4 w-4 hidden sm:block flex-shrink-0" />
            Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <ReservationSettingForm item={settings} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <ReservationSlotManager
            slots={slots}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="exceptions" className="mt-6">
          <ReservationExceptionManager
            exceptions={exceptions}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          <BookingQuestionsManager
            questions={questions}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReservationSettings;
