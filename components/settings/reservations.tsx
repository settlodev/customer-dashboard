"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import {
  Settings2,
  MessageSquareText,
  Clock,
  CalendarOff,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { PanelHeader } from "./shared/panel-header";
import {
  settingsTabsListClass,
  settingsTabTriggerClass,
} from "./shared/settings-tabs";

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
        <PanelHeader
          title="Reservations"
          description="Configure booking rules, policies, and custom questions for your location."
        />
        <div className="max-w-2xl overflow-hidden">
          <div className="flex gap-1 rounded-lg border border-line bg-canvas p-1">
            <div className="h-9 flex-1 animate-pulse rounded-md bg-card shadow-sm" />
            <div className="h-9 flex-1 animate-pulse rounded-md" />
            <div className="h-9 flex-1 animate-pulse rounded-md" />
            <div className="h-9 flex-1 animate-pulse rounded-md" />
          </div>
        </div>
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-canvas" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-canvas" />
                <div className="h-3 w-64 animate-pulse rounded bg-canvas" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-line p-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 animate-pulse rounded bg-canvas" />
                  <div className="h-3 w-48 animate-pulse rounded bg-canvas" />
                </div>
                <div className="h-6 w-11 animate-pulse rounded-full bg-canvas" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-md rounded-xl border-neg/40 shadow-sm">
        <CardContent className="p-6 text-center">
          <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-neg-tint text-neg">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <h3 className="mb-2 font-semibold text-ink">
            Couldn&apos;t load reservation settings
          </h3>
          <p className="mb-4 text-[13px] text-muted-foreground">{error}</p>
          <Button type="button" variant="outline" onClick={() => loadData()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Reservations"
        description="Configure booking rules, policies, and custom questions for your location."
      />

      <Tabs defaultValue={defaultTab || "settings"} className="w-full">
        <TabsList className={settingsTabsListClass}>
          <TabsTrigger value="settings" className={settingsTabTriggerClass}>
            <Settings2 className="hidden h-4 w-4 shrink-0 sm:block" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="schedule" className={settingsTabTriggerClass}>
            <Clock className="hidden h-4 w-4 shrink-0 sm:block" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="exceptions" className={settingsTabTriggerClass}>
            <CalendarOff className="hidden h-4 w-4 shrink-0 sm:block" />
            Exceptions
          </TabsTrigger>
          <TabsTrigger value="questions" className={settingsTabTriggerClass}>
            <MessageSquareText className="hidden h-4 w-4 shrink-0 sm:block" />
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
