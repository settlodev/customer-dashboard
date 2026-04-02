"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

import { FormResponse } from "@/types/types";
import {
  Reservation,
  RESERVATION_SOURCE_LABELS,
  RESERVATION_SOURCES,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS,
  DEPOSIT_STATUS_LABELS,
  DEPOSIT_STATUS_COLORS,
  VALID_STATUS_TRANSITIONS,
} from "@/types/reservation/type";
import { Space } from "@/types/space/type";
import { ReservationStatus, DepositPaymentStatus } from "@/types/enums";
import { ReservationSchema } from "@/types/reservation/schema";
import {
  createReservation,
  updateReservation,
  updateReservationStatus,
} from "@/lib/actions/reservation-actions";
import { fetchAllSpaces } from "@/lib/actions/space-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import CustomerSelector from "../widgets/customer-selector";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";

const ReservationForm = ({
  item,
}: {
  item: Reservation | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [spaces, setSpaces] = useState<Space[]>([]);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const data = await fetchAllSpaces();
        const bookable = data.filter(
          (s: Space) =>
            s.reservable &&
            s.active &&
            (s.type === "TABLE" || s.type === "SEAT"),
        );
        setSpaces(bookable);
      } catch (error) {
        console.error("Failed to load spaces:", error);
      }
    };
    loadSpaces();
  }, []);

  const form = useForm<z.infer<typeof ReservationSchema>>({
    resolver: zodResolver(ReservationSchema),
    defaultValues: {
      reservationDate: item?.reservationDate ?? "",
      reservationTime: item?.reservationTime ?? "",
      reservationEndTime: item?.reservationEndTime ?? undefined,
      peopleCount: item?.peopleCount ?? undefined,
      specialRequests: item?.specialRequests ?? undefined,
      source: (item?.source as any) ?? undefined,
      customer: (item?.customer as string) ?? undefined,
      tableAndSpace: (item?.tableAndSpace as string) ?? undefined,
      status: item?.status ?? true,
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description:
          typeof errors.message === "string"
            ? errors.message
            : "Please check your inputs and try again.",
      });
    },
    [toast],
  );

  const handleStatusChange = (newStatus: ReservationStatus) => {
    if (!item) return;
    startTransition(() => {
      updateReservationStatus(item.id, newStatus).then((data) => {
        if (!data) return;
        const msg = SettloErrorHandler.safeMessage(data.message);
        if (data.responseType === "success") {
          toast({ variant: "success", title: "Status Updated", description: msg });
          router.refresh();
        } else {
          toast({ variant: "destructive", title: "Error", description: msg });
        }
      });
    });
  };

  const submitData = (values: z.infer<typeof ReservationSchema>) => {
    startTransition(() => {
      const handleResponse = (data: FormResponse | void) => {
        if (!data) return;
        setResponse(data);
        const msg = SettloErrorHandler.safeMessage(data.message);
        if (data.responseType === "success") {
          toast({ variant: "success", title: "Success", description: msg });
          router.push("/reservations");
        } else {
          toast({ variant: "destructive", title: "Error", description: msg });
        }
      };

      if (item) {
        updateReservation(item.id, values).then(handleResponse);
      } else {
        createReservation(values).then(handleResponse);
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        {/* Status & Deposit Info (edit mode only) */}
        {item && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Current Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className={RESERVATION_STATUS_COLORS[item.reservationStatus as ReservationStatus] || "bg-gray-100 text-gray-800"}
                  >
                    {RESERVATION_STATUS_LABELS[item.reservationStatus as ReservationStatus] || item.reservationStatus}
                  </Badge>
                </div>

                {/* Status transition buttons */}
                {(() => {
                  const transitions = VALID_STATUS_TRANSITIONS[item.reservationStatus as ReservationStatus] || [];
                  if (transitions.length === 0) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Move to:</span>
                      {transitions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(status)}
                          disabled={isPending}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${RESERVATION_STATUS_COLORS[status]} hover:opacity-80 disabled:opacity-50`}
                        >
                          {RESERVATION_STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Deposit info */}
              {item.depositAmount != null && item.depositPaymentStatus && item.depositPaymentStatus !== DepositPaymentStatus.NOT_REQUIRED && (
                <div className="flex items-center gap-4 pt-2 border-t">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Deposit:</span>
                    <span className="ml-2 text-sm font-semibold">TZS {item.depositAmount.toLocaleString()}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={DEPOSIT_STATUS_COLORS[item.depositPaymentStatus as DepositPaymentStatus] || "bg-gray-100 text-gray-800"}
                  >
                    {DEPOSIT_STATUS_LABELS[item.depositPaymentStatus as DepositPaymentStatus] || item.depositPaymentStatus}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            {/* Date & Time */}
            <div>
              <h3 className="text-lg font-medium mb-4">Date & Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="reservationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Reservation Date{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reservationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Start Time <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reservationEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Guest & Table */}
            <div>
              <h3 className="text-lg font-medium mb-4">Guest & Table</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="peopleCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Guests</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Party size"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseInt(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <FormControl>
                        <CustomerSelector
                          value={field.value}
                          onChange={(id) => field.onChange(id)}
                          placeholder="Select customer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tableAndSpace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Auto-assign or select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {spaces.map((space) => (
                            <SelectItem
                              key={space.id}
                              value={space.id as string}
                            >
                              {space.name}
                              {space.capacity
                                ? ` (${space.capacity} seats)`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {item?.tableMinimumSpend != null && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium">Table Minimum Spend</p>
                <p className="text-amber-600 text-xs mt-1">
                  This table requires a minimum spend of {item.tableMinimumSpend.toLocaleString()}
                </p>
              </div>
            )}

            <Separator />

            {/* Details */}
            <div>
              <h3 className="text-lg font-medium mb-4">Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Source</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RESERVATION_SOURCES.map((src) => (
                            <SelectItem key={src} value={src}>
                              {RESERVATION_SOURCE_LABELS[src]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requests</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requests or notes"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update Reservation" : "Create Reservation"}
          />
        </div>
      </form>
    </Form>
  );
};

export default ReservationForm;
