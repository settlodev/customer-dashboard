"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";

import {
  ReservationSetting,
  ReservationSettingField,
  RESERVATION_SETTINGS_CONFIG,
  RESERVATION_SETTING_CATEGORY_TITLES,
  ReservationSettingCategory,
} from "@/types/reservation-setting/type";
import { ReservationSettingSchema } from "@/types/reservation-setting/schema";
import {
  createReservationSettings,
  updateReservationSettings,
} from "@/lib/actions/reservation-setting-actions";
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
  sendConfirmationEmail: true,
  sendConfirmationSms: false,
  sendReminderNotification: true,
  reminderHoursBeforeReservation: 24,
  defaultTurnTimeMinutes: 15,
  bufferMinutesBetweenSeatings: 0,
  enableWaitlist: false,
  autoAssignTable: true,
  allowGuestTablePreference: false,
} satisfies Partial<z.input<typeof ReservationSettingSchema>>;

const groupByCategory = (fields: ReservationSettingField[]) =>
  fields.reduce(
    (acc, field) => {
      if (!acc[field.category]) acc[field.category] = [];
      acc[field.category].push(field);
      return acc;
    },
    {} as Record<string, ReservationSettingField[]>,
  );

const getGridClass = (fields: ReservationSettingField[]): string => {
  const hasInputFields = fields.some((f) =>
    ["number", "text", "textarea"].includes(f.type),
  );
  return hasInputFields
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "grid grid-cols-1 md:grid-cols-2 gap-4";
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

  const form = useForm<z.infer<typeof ReservationSettingSchema>>({
    resolver: zodResolver(ReservationSettingSchema),
    defaultValues: item ? { ...DEFAULTS, ...item } as any : DEFAULTS,
  });

  useEffect(() => {
    if (item) {
      form.reset({ ...DEFAULTS, ...item } as any);
    }
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

  const submitData = (values: z.infer<typeof ReservationSettingSchema>) => {
    setResponse(undefined);
    startTransition(() => {
      const action = isNew
        ? createReservationSettings(values)
        : updateReservationSettings(values);

      action.then((data) => {
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

  const getFilteredSettings = () => {
    const currentValues = form.watch();
    return RESERVATION_SETTINGS_CONFIG.filter((setting) => {
      if (setting.dependsOn) {
        return !!currentValues[setting.dependsOn as keyof typeof currentValues];
      }
      return true;
    });
  };

  const renderFormControl = (field: ReservationSettingField) => {
    const { key, type, placeholder, helperText, min, max, step } = field;

    switch (type) {
      case "switch":
        return (
          <FormField
            key={key}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    {field.label}
                  </FormLabel>
                  {helperText && (
                    <FormDescription className="text-xs">
                      {helperText}
                    </FormDescription>
                  )}
                </div>
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <FormField
            key={key}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem className="col-span-full">
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea
                    {...formField}
                    placeholder={placeholder}
                    disabled={isPending}
                    value={formField.value ?? ""}
                    rows={3}
                  />
                </FormControl>
                {helperText && (
                  <FormDescription className="text-xs">
                    {helperText}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
      case "text":
        return (
          <FormField
            key={key}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={type === "number" ? "number" : "text"}
                    placeholder={placeholder}
                    disabled={isPending}
                    value={formField.value ?? ""}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => {
                      if (type === "number") {
                        const value =
                          e.target.value === ""
                            ? undefined
                            : parseFloat(e.target.value);
                        formField.onChange(
                          value !== undefined && isNaN(value)
                            ? undefined
                            : value,
                        );
                      } else {
                        formField.onChange(e.target.value);
                      }
                    }}
                  />
                </FormControl>
                {helperText && (
                  <FormDescription className="text-xs">
                    {helperText}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-6 pt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((j) => (
                  <div key={j} className="animate-pulse border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                      <div className="h-6 bg-gray-200 rounded-full w-12" />
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const isOnlineBookingEnabled = form.watch("enableOnlineBooking");

  const filteredSettings = getFilteredSettings().filter(
    (f) => f.key !== "enableOnlineBooking",
  );
  const settingsGroups = groupByCategory(filteredSettings);

  const categoryOrder: ReservationSettingCategory[] = [
    "booking_rules",
    "confirmation",
    "cancellation",
    "notifications",
    "pacing",
    "waitlist",
    "table_assignment",
    "messages",
  ];

  const orderedGroups = categoryOrder
    .filter((cat) => settingsGroups[cat])
    .map((cat) => [cat, settingsGroups[cat]] as [string, ReservationSettingField[]]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reservation Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitData, onInvalid)}
            className="space-y-6"
          >
            {/* Master toggle */}
            <FormField
              control={form.control}
              name="enableOnlineBooking"
              render={({ field: formField }) => (
                <FormItem className={`flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4 transition-colors ${formField.value ? "border-[#EB7F44]/30 bg-[#EB7F44]/5" : ""}`}>
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Enable Online Booking
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Allow guests to book online
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={formField.value}
                      onCheckedChange={(checked) => {
                        formField.onChange(checked);
                        if (!checked) {
                          // Merge defaults with current values so required fields are always populated
                          const currentValues = form.getValues();
                          const payload = { ...DEFAULTS, ...currentValues, enableOnlineBooking: false };
                          submitData(payload as any);
                        }
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isOnlineBookingEnabled && (
              <div className="rounded-lg border border-dashed border-[#EB7F44]/30 bg-[#EB7F44]/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Online booking is disabled. Enable it to configure booking rules, policies, and more.
                </p>
              </div>
            )}

            {isOnlineBookingEnabled && (
              <>
                <Separator />
                {orderedGroups.map(([category, settings], index) => (
                  <React.Fragment key={category}>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[#EB7F44]"></span>
                        {RESERVATION_SETTING_CATEGORY_TITLES[
                          category as ReservationSettingCategory
                        ] || category}
                      </h3>
                      <div className={getGridClass(settings)}>
                        {settings.map((field) => renderFormControl(field))}
                      </div>
                    </div>
                    {index < orderedGroups.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </>
            )}

            <div className="flex justify-end pt-6">
              {isPending ? (
                <Button disabled className="w-full md:w-auto">
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  {isNew ? "Creating Settings..." : "Updating Settings..."}
                </Button>
              ) : (
                <Button type="submit" className="w-full md:w-auto hover:opacity-90">
                  {isNew ? "Create Settings" : "Update Settings"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReservationSettingForm;
