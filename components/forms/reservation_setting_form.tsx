"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { Control, FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Banknote,
  BellRing,
  CalendarCheck,
  CalendarRange,
  Clock,
  Globe,
  Hash,
  Hourglass,
  ListOrdered,
  MessageSquareText,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  ToggleRow,
} from "@/components/ui/field";
import { SettingsSection } from "@/components/settings/shared/settings-section";
import { SettingsSaveBar } from "@/components/settings/shared/settings-save-bar";
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

/**
 * Prefix icon and unit suffix per numeric setting. The config carries the
 * label and range; the adornments are purely how the control box reads.
 */
const NUMBER_ADORNMENTS: Record<
  string,
  { icon: React.ReactNode; suffix?: string }
> = {
  minPartySize: { icon: <Users className="h-3.5 w-3.5" />, suffix: "guests" },
  maxPartySize: { icon: <Users className="h-3.5 w-3.5" />, suffix: "guests" },
  bookingWindowDays: {
    icon: <CalendarRange className="h-3.5 w-3.5" />,
    suffix: "days",
  },
  minAdvanceBookingHours: {
    icon: <Clock className="h-3.5 w-3.5" />,
    suffix: "hours",
  },
  defaultDurationMinutes: {
    icon: <Hourglass className="h-3.5 w-3.5" />,
    suffix: "min",
  },
  slotIntervalMinutes: { icon: <Timer className="h-3.5 w-3.5" />, suffix: "min" },
  autoConfirmMaxPartySize: {
    icon: <Users className="h-3.5 w-3.5" />,
    suffix: "guests",
  },
  cancellationPolicyHours: {
    icon: <Clock className="h-3.5 w-3.5" />,
    suffix: "hours",
  },
  noShowFeeAmount: { icon: <Banknote className="h-3.5 w-3.5" /> },
  noShowGraceMinutes: { icon: <Timer className="h-3.5 w-3.5" />, suffix: "min" },
  reminderHoursBeforeReservation: {
    icon: <BellRing className="h-3.5 w-3.5" />,
    suffix: "hours",
  },
  defaultTurnTimeMinutes: {
    icon: <Hourglass className="h-3.5 w-3.5" />,
    suffix: "min",
  },
  bufferMinutesBetweenSeatings: {
    icon: <Timer className="h-3.5 w-3.5" />,
    suffix: "min",
  },
  maxDailyReservations: {
    icon: <CalendarCheck className="h-3.5 w-3.5" />,
    suffix: "bookings",
  },
  maxDailyGuests: { icon: <Users className="h-3.5 w-3.5" />, suffix: "guests" },
  maxWaitlistSize: {
    icon: <ListOrdered className="h-3.5 w-3.5" />,
    suffix: "guests",
  },
};

/** Shared responsive grid for a run of ToggleRows / control boxes. */
const gridClass = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";

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
  const dirtyCount = Object.keys(form.formState.dirtyFields).length;
  // Save stays reachable on a settings row that doesn't exist yet — creating it
  // from the defaults is a legitimate first save — and is off entirely while
  // online booking is disabled, since nothing below it applies.
  const saveCount = !isOnlineBookingEnabled
    ? 0
    : isNew
      ? Math.max(dirtyCount, 1)
      : dirtyCount;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        {/* Master toggle */}
        <SettingsSection
          icon={<Globe className="h-4 w-4" />}
          title="Online booking"
          description="Whether guests can reserve a table from your public booking page."
        >
          <div className="grid grid-cols-1 gap-3">
            <FormField
              control={form.control}
              name="enableOnlineBooking"
              render={({ field: formField }) => (
                <ToggleRow
                  label={fieldOf("enableOnlineBooking").label}
                  hint="Master switch — turn off to hide the public booking page and pause every section below."
                  checked={!!formField.value}
                  onChange={(checked) => {
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
              )}
            />
          </div>
        </SettingsSection>

        {!isOnlineBookingEnabled && (
          <div className="rounded-xl border border-dashed border-line bg-canvas p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Online booking is disabled. Enable it above to configure booking
              rules, policies, notifications, and more.
            </p>
          </div>
        )}

        {isOnlineBookingEnabled && (
          <>
            {/* 1 — Booking rules */}
            <SettingsSection
              icon={<CalendarRange className="h-4 w-4" />}
              title="Booking rules"
              description="Party-size limits, how far ahead guests can book, and what's required from them."
            >
              <div className={gridClass}>
                <NumberField control={form.control} name="minPartySize" disabled={isPending} />
                <NumberField control={form.control} name="maxPartySize" disabled={isPending} />
                <NumberField control={form.control} name="bookingWindowDays" disabled={isPending} />
                <NumberField control={form.control} name="minAdvanceBookingHours" disabled={isPending} />
                <NumberField control={form.control} name="defaultDurationMinutes" disabled={isPending} />
                <NumberField control={form.control} name="slotIntervalMinutes" disabled={isPending} />
              </div>
              <div className={gridClass}>
                <SwitchRow control={form.control} name="requireGuestEmail" disabled={isPending} />
                <SwitchRow control={form.control} name="requireGuestPhone" disabled={isPending} />
                <SwitchRow control={form.control} name="allowSpecialRequests" disabled={isPending} />
              </div>
            </SettingsSection>

            {/* 2 — Confirmation & cancellation */}
            <SettingsSection
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Confirmation & cancellation"
              description="Auto-confirmation, no-show charges, and the cancellation policy shown to guests."
            >
              <div className={gridClass}>
                <SwitchRow control={form.control} name="autoConfirm" disabled={isPending} />
                <SwitchRow control={form.control} name="allowOnlineCancellation" disabled={isPending} />
                <SwitchRow control={form.control} name="chargeNoShowFee" disabled={isPending} />
              </div>
              <div className={gridClass}>
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
            </SettingsSection>

            {/* 3 — Notifications & reminders */}
            <SettingsSection
              icon={<BellRing className="h-4 w-4" />}
              title="Notifications & reminders"
              description="Confirmation channels and how far in advance to remind guests."
            >
              <div className={gridClass}>
                <SwitchRow control={form.control} name="sendConfirmationEmail" disabled={isPending} />
                <SwitchRow control={form.control} name="sendConfirmationSms" disabled={isPending} />
                <SwitchRow control={form.control} name="sendReminderNotification" disabled={isPending} />
              </div>
              {sendReminderNotification && (
                <div className={gridClass}>
                  <NumberField
                    control={form.control}
                    name="reminderHoursBeforeReservation"
                    disabled={isPending}
                  />
                </div>
              )}
            </SettingsSection>

            {/* 4 — Pacing, tables & waitlist (combined) */}
            <SettingsSection
              icon={<Timer className="h-4 w-4" />}
              title="Pacing, tables & waitlist"
              description="Daily caps, turn time between seatings, table assignment and waitlist behaviour."
            >
              <div className={gridClass}>
                <NumberField control={form.control} name="defaultTurnTimeMinutes" disabled={isPending} />
                <NumberField control={form.control} name="bufferMinutesBetweenSeatings" disabled={isPending} />
                <NumberField control={form.control} name="maxDailyReservations" disabled={isPending} />
                <NumberField control={form.control} name="maxDailyGuests" disabled={isPending} />
                {enableWaitlist && (
                  <NumberField control={form.control} name="maxWaitlistSize" disabled={isPending} />
                )}
              </div>
              <div className={gridClass}>
                <SwitchRow control={form.control} name="enableWaitlist" disabled={isPending} />
                <SwitchRow control={form.control} name="autoAssignTable" disabled={isPending} />
                <SwitchRow control={form.control} name="allowGuestTablePreference" disabled={isPending} />
                <SwitchRow control={form.control} name="enableOnlineDepositPayment" disabled={isPending} />
              </div>
            </SettingsSection>

            {/* 5 — Guest-facing messages */}
            <SettingsSection
              icon={<MessageSquareText className="h-4 w-4" />}
              title="Guest-facing messages"
              description="Welcome copy, confirmation message and terms shown on the public booking page."
            >
              <div className="grid grid-cols-1 gap-3.5">
                <TextareaField control={form.control} name="bookingPageWelcomeMessage" rows={3} disabled={isPending} />
                <TextareaField control={form.control} name="confirmationMessage" rows={3} disabled={isPending} />
                <TextareaField control={form.control} name="termsAndConditions" rows={4} disabled={isPending} />
              </div>
            </SettingsSection>
          </>
        )}

        <SettingsSaveBar
          submit
          dirtyCount={saveCount}
          isPending={isPending}
          saveLabel={isNew ? "Create settings" : "Save changes"}
          pendingLabel={isNew ? "Creating settings…" : "Updating settings…"}
        />
      </form>
    </Form>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Field primitives — config-driven wrappers over the shared control set
// ──────────────────────────────────────────────────────────────────────

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
        <ToggleRow
          label={f.label}
          hint={f.helperText}
          checked={!!formField.value}
          onChange={formField.onChange}
          disabled={disabled}
        />
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
  const adornment = NUMBER_ADORNMENTS[name as string];
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field: formField }) => (
        <FormItem className="min-w-0 space-y-[7px]">
          <FieldLabel>{f.label}</FieldLabel>
          <FormControl>
            <ControlInput
              type="number"
              mono
              prefix={adornment?.icon ?? <Hash className="h-3.5 w-3.5" />}
              suffix={adornment?.suffix}
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
          {f.helperText && <FieldHint>{f.helperText}</FieldHint>}
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
        <FormItem className="min-w-0 space-y-[7px]">
          <FieldLabel>{f.label}</FieldLabel>
          <FormControl>
            <ControlTextarea
              placeholder={f.placeholder}
              disabled={disabled}
              rows={rows}
              value={formField.value ?? ""}
              onChange={formField.onChange}
              onBlur={formField.onBlur}
              name={formField.name}
              ref={formField.ref}
            />
          </FormControl>
          {f.helperText && <FieldHint>{f.helperText}</FieldHint>}
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
              <div className="h-4 w-1/4 animate-pulse rounded bg-canvas" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-canvas" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-1/2 animate-pulse rounded bg-canvas" />
                  <div className="h-11 animate-pulse rounded-[10px] bg-canvas" />
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
