"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { BusinessTimeType, FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { LocationSchema, OperatingHoursEntry } from "@/types/location/schema";
import { Loader2Icon } from "lucide-react";
import { Location } from "@/types/location/type";
import { updateLocation } from "@/lib/actions/location-actions";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { toast } from "@/hooks/use-toast";
import { PhoneInput } from "../ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { businessTimes } from "@/types/constants";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { createStandaloneLocation } from "@/lib/actions/auth/location";

// ── Days ─────────────────────────────────────────────────────────

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

// ── Default hours ─────────────────────────────────────────────────

function getDefaultOperatingHours(): OperatingHoursEntry[] {
  return DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day,
    openTime: "08:00",
    closeTime: "21:00",
    closed: day === "SUNDAY",
  }));
}

function seedOperatingHours(
  location: Location | null | undefined,
): OperatingHoursEntry[] {
  const raw = (location as any)?.operatingHours as any[] | undefined;
  if (raw && raw.length > 0) {
    return DAYS_OF_WEEK.map((day) => {
      const match = raw.find(
        (h: any) => (h.dayOfWeek ?? h.day ?? "").toUpperCase() === day,
      );
      if (match) {
        return {
          dayOfWeek: day,
          openTime: match.openTime ?? match.openingTime ?? "08:00",
          closeTime: match.closeTime ?? match.closingTime ?? "21:00",
          closed: match.closed ?? false,
        };
      }
      return {
        dayOfWeek: day,
        openTime: "08:00",
        closeTime: "21:00",
        closed: day === "SUNDAY",
      };
    });
  }
  return getDefaultOperatingHours();
}

// ── OperatingHoursTable ───────────────────────────────────────────

function OperatingHoursTable({
  hours,
  onChange,
  disabled,
}: {
  hours: OperatingHoursEntry[];
  onChange: (hours: OperatingHoursEntry[]) => void;
  disabled: boolean;
}) {
  const update = (
    dayOfWeek: string,
    field: keyof OperatingHoursEntry,
    value: string | boolean,
  ) => {
    onChange(
      hours.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h,
      ),
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-border overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-muted/50 text-[10px] font-semibold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
        <span className="w-24 shrink-0">Day</span>
        <span className="w-10 shrink-0">Open</span>
        <span className="flex-1">From</span>
        <span className="flex-1">To</span>
      </div>

      {hours.map((entry) => (
        <div
          key={entry.dayOfWeek}
          className={`flex items-center gap-3 px-4 py-2 border-t border-gray-100 dark:border-border ${
            entry.closed ? "bg-gray-50/60 dark:bg-muted/40" : ""
          }`}
        >
          <span className="w-24 shrink-0 text-sm font-medium text-gray-700 dark:text-foreground">
            {DAY_LABELS[entry.dayOfWeek]}
          </span>

          <div className="w-10 shrink-0">
            <Switch
              checked={!entry.closed}
              onCheckedChange={(checked) =>
                update(entry.dayOfWeek, "closed", !checked)
              }
              disabled={disabled}
            />
          </div>

          <div className="flex-1">
            <Select
              disabled={disabled || entry.closed}
              value={entry.openTime}
              onValueChange={(v) => update(entry.dayOfWeek, "openTime", v)}
            >
              <SelectTrigger
                className={`h-9 text-sm ${entry.closed ? "opacity-40" : ""}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {businessTimes.map((t: BusinessTimeType, i: number) => (
                  <SelectItem key={i} value={t.name}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select
              disabled={disabled || entry.closed}
              value={entry.closeTime}
              onValueChange={(v) => update(entry.dayOfWeek, "closeTime", v)}
            >
              <SelectTrigger
                className={`h-9 text-sm ${entry.closed ? "opacity-40" : ""}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {businessTimes.map((t: BusinessTimeType, i: number) => (
                  <SelectItem key={i} value={t.name}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── LocationForm ──────────────────────────────────────────────────

export const LocationForm = ({
  item,
  onSubmit: _onSubmit,
  multipleStep = false,
  businessId,
}: {
  item: Location | null | undefined;
  onSubmit: (values: z.infer<typeof LocationSchema>) => void;
  multipleStep?: boolean;
  businessId?: string | null;
}) => {
  const [isPending, startTransition] = useTransition();
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Operating hours state — kept outside RHF to avoid deeply nested array
  const [operatingHours, setOperatingHours] = useState<OperatingHoursEntry[]>(
    () => seedOperatingHours(item),
  );
  const [continuousOperation, setContinuousOperation] = useState<boolean>(
    () => (item as any)?.continuousOperation ?? false,
  );
  const [dailyCutoffTime, setDailyCutoffTime] = useState<string>(
    () => (item as any)?.dailyCutoffTime ?? "04:00",
  );

  const form = useForm<z.infer<typeof LocationSchema>>({
    resolver: zodResolver(LocationSchema),
    defaultValues: {
      name: item?.name ?? "",
      phone: item?.phoneNumber ?? "",
      email: item?.email ?? "",
      city: item?.region ?? "",
      street: item?.address ?? "",
      continuousOperation: (item as any)?.continuousOperation ?? false,
      dailyCutoffTime: (item as any)?.dailyCutoffTime ?? "04:00",
      status: item ? item.active : true,
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.log("Form errors:", errors);
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong",
      description: "There was an issue submitting your form, please try later",
    });
  }, []);

  const validateHours = (): boolean => {
    if (!continuousOperation && operatingHours.every((h) => h.closed)) {
      toast({
        variant: "destructive",
        title: "Operating hours required",
        description: "Your location must be open at least one day of the week.",
      });
      return false;
    }
    if (continuousOperation && !dailyCutoffTime) {
      toast({
        variant: "destructive",
        title: "Cutoff time required",
        description: "Please select a daily cutoff time for 24-hour operation.",
      });
      return false;
    }
    return true;
  };

  // ── Submit: create ───────────────────────────────────────────────
  // Uses createStandaloneLocation which handles auth-token refresh,
  // cookie writes, and the /api/v1/locations POST correctly.

  const handleCreate = (values: z.infer<typeof LocationSchema>) => {
    if (!validateHours()) return;

    startTransition(async () => {
      try {
        const resolvedBusinessId =
          businessId ?? (await getCurrentBusiness())?.id;

        if (!resolvedBusinessId) {
          toast({
            variant: "destructive",
            title: "Business not found",
            description:
              "Could not determine the current business. Please try again.",
          });
          return;
        }

        const response = await createStandaloneLocation({
          businessId: resolvedBusinessId,
          name: values.name,
          phoneNumber: values.phone || undefined,
          email: values.email || undefined,
          region: values.city || undefined,
          address: values.street || undefined,
          operatingHours: continuousOperation ? undefined : operatingHours,
        });

        if (response.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Create failed",
            description: response.message,
          });
          return;
        }

        toast({ title: "Location created successfully!" });
        window.location.href = "/dashboard";
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Create failed",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      }
    });
  };

  // ── Submit: update ───────────────────────────────────────────────

  const handleUpdate = (values: z.infer<typeof LocationSchema>) => {
    if (!validateHours() || !item) return;

    startTransition(async () => {
      try {
        const response = await updateLocation(item.id, {
          ...values,
          continuousOperation,
          dailyCutoffTime: continuousOperation ? dailyCutoffTime : undefined,
          operatingHours: continuousOperation ? undefined : operatingHours,
        });

        if (response.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Update failed",
            description: response.message,
          });
          return;
        }

        toast({ title: "Location updated successfully!" });
        window.location.href = "/select-location";
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      }
    });
  };

  const submitData = (values: z.infer<typeof LocationSchema>) => {
    if (item) {
      handleUpdate(values);
    } else {
      handleCreate(values);
    }
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="mx-auto space-y-8"
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* ── Basic Information ── */}
            <div className="space-y-3">
              {/* Row 1: Location name + City/Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-gray-600 dark:text-foreground/80">
                        Location name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-9 text-sm"
                          {...field}
                          disabled={isPending}
                          placeholder="e.g. Main Branch"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-gray-600 dark:text-foreground/80">
                        City / Region
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-9 text-sm"
                          {...field}
                          disabled={isPending}
                          placeholder="e.g. Dar es Salaam"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Street address full width */}
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-600 dark:text-foreground/80">
                      Street address
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-9 text-sm"
                        {...field}
                        value={field.value || ""}
                        disabled={isPending}
                        placeholder="e.g. 123 Uhuru Street"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 3: Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-gray-600 dark:text-foreground/80">
                        Phone{" "}
                        <span className="font-normal text-gray-400 dark:text-muted-foreground">
                          (inherits from business)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <PhoneInput
                          {...field}
                          disabled={isPending}
                          onChange={(value) => field.onChange(value)}
                          placeholder="Leave empty to inherit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-gray-600 dark:text-foreground/80">
                        Email{" "}
                        <span className="font-normal text-gray-400 dark:text-muted-foreground">
                          (inherits from business)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-9 text-sm"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                          type="email"
                          placeholder="Leave empty to inherit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Business Hours ── */}
            <div className="space-y-3">
              {/* 24-hour toggle — matches the screenshot's clean pill row */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-muted/50 border border-gray-200 dark:border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-foreground">
                    Open 24 hours
                  </p>
                </div>
                <Switch
                  checked={continuousOperation}
                  onCheckedChange={setContinuousOperation}
                  disabled={isPending}
                />
              </div>

              {continuousOperation ? (
                <div className="rounded-lg border border-gray-200 dark:border-border p-4 space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-foreground">
                    Daily cutoff time <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={dailyCutoffTime}
                    onValueChange={setDailyCutoffTime}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="e.g. 04:00" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTimes.map((t: BusinessTimeType, i: number) => (
                        <SelectItem key={i} value={t.name}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 dark:text-muted-foreground">
                    The quiet hour when the business day rolls over (e.g. 04:00)
                  </p>
                </div>
              ) : (
                <OperatingHoursTable
                  hours={operatingHours}
                  onChange={setOperatingHours}
                  disabled={isPending}
                />
              )}
            </div>

            {/* ── Submit ── */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full md:w-auto"
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    {item ? "Updating..." : "Processing..."}
                  </>
                ) : item ? (
                  "Update Location"
                ) : multipleStep ? (
                  "Complete Setup"
                ) : (
                  "Add Location"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Status toggle (edit mode only) ── */}
        {item && (
          <Card className="rounded-xl border border-red-200 shadow-sm">
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <>
                    <FormItem className="flex flex-row items-center justify-between">
                      <div>
                        <FormLabel className="text-base">
                          Location Status
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          This location is currently{" "}
                          <span
                            className={
                              field.value
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {field.value ? "enabled" : "disabled"}
                          </span>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={field.value ? "destructive" : "default"}
                        size="sm"
                        disabled={isPending}
                        onClick={() => setShowStatusDialog(true)}
                      >
                        {field.value ? "Disable" : "Enable"}
                      </Button>
                      <FormMessage />
                    </FormItem>

                    <Dialog
                      open={showStatusDialog}
                      onOpenChange={setShowStatusDialog}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {field.value ? "Disable" : "Enable"} Location
                          </DialogTitle>
                          <DialogDescription>
                            {field.value
                              ? "Are you sure you want to disable this location? This will make it inactive and may affect all associated services."
                              : "Are you sure you want to enable this location? This will make it active again."}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowStatusDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant={field.value ? "destructive" : "default"}
                            onClick={() => {
                              field.onChange(!field.value);
                              setShowStatusDialog(false);
                            }}
                          >
                            {field.value ? "Disable" : "Enable"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              />
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
};
