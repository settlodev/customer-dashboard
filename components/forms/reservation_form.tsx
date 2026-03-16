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

import { FormResponse } from "@/types/types";
import {
  Reservation,
  RESERVATION_SOURCE_LABELS,
  RESERVATION_SOURCES,
} from "@/types/reservation/type";
import { Space } from "@/types/space/type";
import { ReservationSchema } from "@/types/reservation/schema";
import {
  createReservation,
  updateReservation,
} from "@/lib/actions/reservation-actions";
import { fetchAllSpaces } from "@/lib/actions/space-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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
      console.log("Errors during form submission:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description:
          typeof errors.message === "string"
            ? errors.message
            : "There was an issue submitting your form, please try later",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof ReservationSchema>) => {
    startTransition(() => {
      const handleResponse = (data: FormResponse | void) => {
        if (!data) return;
        setResponse(data);
        const msg = SettloErrorHandler.safeMessage(data.message);
        if (data.responseType === "success") {
          toast({ title: "Success", description: msg });
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
      <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
        <div className="space-y-6">
          {/* Date & Time */}
          <div>
            <h3 className="text-lg font-medium mb-4">Date & Time</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="reservationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reservation Date</FormLabel>
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
                    <FormLabel>Start Time</FormLabel>
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
                    <FormLabel>End Time (Optional)</FormLabel>
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
                    <FormLabel>Customer (Optional)</FormLabel>
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
                    <FormLabel>Table (Optional)</FormLabel>
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

          <Separator />

          {/* Source & Requests */}
          <div>
            <h3 className="text-lg font-medium mb-4">Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Source (Optional)</FormLabel>
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
                    <FormLabel>Special Requests (Optional)</FormLabel>
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

          <div className="flex h-5 items-center space-x-4 mt-7">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update Reservation" : "Create Reservation"}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};

export default ReservationForm;
