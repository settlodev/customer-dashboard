"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { Control, FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";

import {
  ReservationSetting,
  ReservationSettingField,
  RESERVATION_SETTINGS_CONFIG,
} from "@/types/reservation-setting/type";
import { ReservationSettingSchema } from "@/types/reservation-setting/schema";
import { upsertReservationSettings } from "@/lib/actions/reservation-setting-actions";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";

const DEFAULTS = {
  minPartySize: 1,
  bookingWindowDays: 30,
  minAdvanceBookingHours: 1,
  defaultDurationMinutes: 90,
  slotIntervalMinutes: 30,
  enableOnlineBooking: true,
  requireGuestEmail: true,
  requireGuestPhone: false,
  allowSpecialRequests: true,
  autoConfirm: false,
  allowOnlineCancellation: true,
  chargeNoShowFee: false,
  noShowGraceMinutes: 30,
  sendConfirmationEmail: true,
  sendConfirmationSms: false,
  sendReminderNotification: true,
  reminderHoursBeforeReservation: 24,
  defaultTurnTimeMinutes: 15,
  bufferMinutesBetweenSeatings: 0,
  enableWaitlist: false,
  enableOnlineDepositPayment: false,
  autoAssignTable: true,
  allowGuestTablePreference: false,
} satisfies Partial<z.input<typeof ReservationSettingSchema>>;

type FieldKey = keyof ReservationSetting;
type FormValues = z.infer<typeof ReservationSettingSchema>;

const FIELD_BY_KEY: Record<string, ReservationSettingField> = Object.fromEntries(
  RESERVATION_SETTINGS_CONFIG.map((f) => [f.key as string, f]),
);

const fieldOf = (key: FieldKey): ReservationSettingField => {
  const f = FIELD_BY_KEY[key as string];
  if (!f) throw new Error(`Missing config entry for ${String(key)}`);
  return f;
};

const ReservationSettingForm = ({
  item,
}: {
  item: ReservationSetting | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [, setResponse] = useState<FormResponse | undefined>();
  const isNew = !item?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(ReservationSettingSchema),
    defaultValues: item ? ({ ...DEFAULTS, ...item } as any) : DEFAULTS,
  });

  useEffect(() => {
    if (item) form.reset({ ...DEFAULTS, ...item } as any);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.error("Form validation errors:", JSON.stringify(errors, null, 2));
    const firstError = Object.values(errors).find(
      (e) => e && typeof e === "object" && "message" in e,
    );
    toast({
      variant: "destructive",
      title: "Validation Error",
      description:
        (firstError as { message?: string })?.message ||
        "Please fill all the required fields correctly",
    });
  }, []);

  const submitData = (values: FormValues) => {
    setResponse(undefined);
    void isNew;
    startTransition(() => {
      upsertReservationSettings(values).then((data: FormResponse | void) => {
        if (data) {
          setResponse(data);
          const msg = SettloErrorHandler.safeMessage(data.message);
          if (data.responseType === "success") {
            toast({ variant: "success", title: "Success", description: msg });
          } else {
            toast({ variant: "destructive", title: "Error", description: msg });
          }
        }
      });
    });
  };

  if (isLoading) return <FormSkeleton />;

  const isOnlineBookingEnabled = form.watch("enableOnlineBooking");
  const autoConfirm = form.watch("autoConfirm");
  const chargeNoShowFee = form.watch("chargeNoShowFee");
  const sendReminderNotification = form.watch("sendReminderNotification");
  const enableWaitlist = form.watch("enableWaitlist");
  const isDirty = form.formState.isDirty;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        {/* Master toggle */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-5 pb-5">
            <FormField
              control={form.control}
              name="enableOnlineBooking"
              render={({ field: formField }) => (
                <FormItem
                  className={`flex items-center justify-between gap-4 space-y-0 rounded-lg border p-4 transition-colors ${
                    formField.value
                      ? "border-[#EB7F44]/30 bg-[#EB7F44]/5"
                      : ""
                  }`}
                >
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Enable Online Booking
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Master switch — turn off to hide the public booking page
                      and pause every section below.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={formField.value}
                      onCheckedChange={(checked) => {
                        formField.onChange(checked);
                        if (!checked) {
                          const currentValues = form.getValues();
                          const payload = {
                            ...DEFAULTS,
                            ...currentValues,
                            enableOnlineBooking: false,
                          };
                          submitData(payload as any);
                        }
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {!isOnlineBookingEnabled && (
          <div className="rounded-xl border border-dashed border-[#EB7F44]/30 bg-[#EB7F44]/5 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Online booking is disabled. Enable it above to configure booking
              rules, policies, notifications, and more.
            </p>
          </div>
        )}

        {isOnlineBookingEnabled && (
          <>
            {/* 1 — Booking rules */}
            <SectionCard
              title="Booking rules"
              description="Party-size limits, how far ahead guests can book, and what's required from them."
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                <NumberField control={form.control} name="minPartySize" disabled={isPending} />
                <NumberField control={form.control} name="maxPartySize" disabled={isPending} />
                <NumberField control={form.control} name="bookingWindowDays" disabled={isPending} />
                <NumberField control={form.control} name="minAdvanceBookingHours" disabled={isPending} />
                <NumberField control={form.control} name="defaultDurationMinutes" disabled={isPending} />
                <NumberField control={form.control} name="slotIntervalMinutes" disabled={isPending} />
              </div>
              <div className="space-y-0.5 pt-2">
                <SwitchRow control={form.control} name="requireGuestEmail" disabled={isPending} />
                <SwitchRow control={form.control} name="requireGuestPhone" disabled={isPending} />
                <SwitchRow control={form.control} name="allowSpecialRequests" disabled={isPending} />
              </div>
            </SectionCard>

            {/* 2 — Confirmation & cancellation */}
            <SectionCard
              title="Confirmation & cancellation"
              description="Auto-confirmation, no-show charges, and the cancellation policy shown to guests."
            >
              <div className="space-y-0.5">
                <SwitchRow control={form.control} name="autoConfirm" disabled={isPending} />
                <SwitchRow control={form.control} name="allowOnlineCancellation" disabled={isPending} />
                <SwitchRow control={form.control} name="chargeNoShowFee" disabled={isPending} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                {autoConfirm && (
                  <NumberField control={form.control} name="autoConfirmMaxPartySize" disabled={isPending} />
                )}
                <NumberField control={form.control} name="cancellationPolicyHours" disabled={isPending} />
                {chargeNoShowFee && (
                  <NumberField control={form.control} name="noShowFeeAmount" disabled={isPending} />
                )}
                <NumberField control={form.control} name="noShowGraceMinutes" disabled={isPending} />
              </div>
              <TextareaField control={form.control} name="cancellationPolicyText" rows={3} disabled={isPending} />
            </SectionCard>

            {/* 3 — Notifications & reminders */}
            <SectionCard
              title="Notifications & reminders"
              description="Confirmation channels and how far in advance to remind guests."
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                <div className="space-y-0.5">
                  <SwitchRow control={form.control} name="sendConfirmationEmail" disabled={isPending} />
                  <SwitchRow control={form.control} name="sendConfirmationSms" disabled={isPending} />
                  <SwitchRow control={form.control} name="sendReminderNotification" disabled={isPending} />
                </div>
                {sendReminderNotification && (
                  <div className="lg:w-56">
                    <NumberField
                      control={form.control}
                      name="reminderHoursBeforeReservation"
                      disabled={isPending}
                    />
                  </div>
                )}
              </div>
            </SectionCard>

            {/* 4 — Pacing, tables & waitlist (combined) */}
            <SectionCard
              title="Pacing, tables & waitlist"
              description="Daily caps, turn time between seatings, table assignment and waitlist behaviour."
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <NumberField control={form.control} name="defaultTurnTimeMinutes" disabled={isPending} />
                <NumberField control={form.control} name="bufferMinutesBetweenSeatings" disabled={isPending} />
                <NumberField control={form.control} name="maxDailyReservations" disabled={isPending} />
                <NumberField control={form.control} name="maxDailyGuests" disabled={isPending} />
                {enableWaitlist && (
                  <NumberField control={form.control} name="maxWaitlistSize" disabled={isPending} />
                )}
              </div>
              <div className="space-y-0.5 pt-2">
                <SwitchRow control={form.control} name="enableWaitlist" disabled={isPending} />
                <SwitchRow control={form.control} name="autoAssignTable" disabled={isPending} />
                <SwitchRow control={form.control} name="allowGuestTablePreference" disabled={isPending} />
                <SwitchRow control={form.control} name="enableOnlineDepositPayment" disabled={isPending} />
              </div>
            </SectionCard>

            {/* 5 — Guest-facing messages */}
            <SectionCard
              title="Guest-facing messages"
              description="Welcome copy, confirmation message and terms shown on the public booking page."
            >
              <div className="space-y-4">
                <TextareaField control={form.control} name="bookingPageWelcomeMessage" rows={3} disabled={isPending} />
                <TextareaField control={form.control} name="confirmationMessage" rows={3} disabled={isPending} />
                <TextareaField control={form.control} name="termsAndConditions" rows={4} disabled={isPending} />
              </div>
            </SectionCard>
          </>
        )}

        {/* Sticky save bar */}
        <div className="sticky bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-background/0 pt-4 pb-2 -mx-4 px-4 md:-mx-0 md:px-0">
          <div className="flex items-center justify-end gap-3">
            {isOnlineBookingEnabled && (
              <span className="text-xs text-muted-foreground">
                {isDirty ? "Unsaved changes" : "All changes saved"}
              </span>
            )}
            {isPending ? (
              <Button disabled className="w-full md:w-auto">
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                {isNew ? "Creating settings…" : "Updating settings…"}
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full md:w-auto hover:opacity-90"
                disabled={!isOnlineBookingEnabled || (!isNew && !isDirty)}
              >
                {isNew ? "Create settings" : "Save changes"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Layout primitives — match SettingsSection / SettingsSwitchRow density
// ──────────────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function SwitchRow({
  control,
  name,
  disabled,
}: {
  control: Control<FormValues>;
  name: FieldKey;
  disabled?: boolean;
}) {
  const f = fieldOf(name);
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field: formField }) => (
        <FormItem className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0 space-y-0">
          <div className="min-w-0 flex-1">
            <FormLabel className="text-sm font-medium leading-tight cursor-pointer">
              {f.label}
            </FormLabel>
            {f.helperText && (
              <FormDescription className="text-xs mt-0.5">
                {f.helperText}
              </FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={!!formField.value}
              onCheckedChange={formField.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function NumberField({
  control,
  name,
  disabled,
}: {
  control: Control<FormValues>;
  name: FieldKey;
  disabled?: boolean;
}) {
  const f = fieldOf(name);
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field: formField }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {f.label}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={f.placeholder}
              min={f.min}
              max={f.max}
              step={f.step}
              disabled={disabled}
              value={formField.value ?? ""}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? undefined : parseFloat(e.target.value);
                formField.onChange(
                  value !== undefined && isNaN(value) ? undefined : value,
                );
              }}
              onBlur={formField.onBlur}
              name={formField.name}
              ref={formField.ref}
            />
          </FormControl>
          {f.helperText && (
            <FormDescription className="text-[11px] leading-tight">
              {f.helperText}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextareaField({
  control,
  name,
  rows = 3,
  disabled,
}: {
  control: Control<FormValues>;
  name: FieldKey;
  rows?: number;
  disabled?: boolean;
}) {
  const f = fieldOf(name);
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field: formField }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {f.label}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={f.placeholder}
              disabled={disabled}
              rows={rows}
              className="resize-y"
              value={formField.value ?? ""}
              onChange={formField.onChange}
              onBlur={formField.onBlur}
              name={formField.name}
              ref={formField.ref}
            />
          </FormControl>
          {f.helperText && (
            <FormDescription className="text-[11px] leading-tight">
              {f.helperText}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="rounded-xl shadow-sm">
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                  <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ReservationSettingForm;
