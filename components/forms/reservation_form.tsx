"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";

import { Reservation } from "@/types/reservation/type";
import { ReservationSchema } from "@/types/reservation/schema";
import {
  createReservation,
  updateReservation,
} from "@/lib/actions/reservation-actions";
import DateTimePicker from "../widgets/datetimepicker";

import { PhoneInput } from "../ui/phone-input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import { useRouter } from "next/navigation";
import CustomerSelector from "../widgets/customer-selector";
import CancelButton from "../widgets/cancel-button";
import SubmitButton from "../widgets/submit-button";
import { Separator } from "../ui/separator";
import ProductVariantSelector from "../widgets/product-variant-selector";

const ReservationForm = ({
  item,
}: {
  item: Reservation | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [reservationDate, setReservationDate] = useState<Date | undefined>(
    item?.date ? new Date(item.date) : undefined
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    item?.startDate ? new Date(item.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    item?.endDate ? new Date(item.endDate) : undefined
  );
 
  const { toast } = useToast();
  const router = useRouter();

 


  const form = useForm<z.infer<typeof ReservationSchema>>({
    resolver: zodResolver(ReservationSchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Errors during form submission:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' ? errors.message : "There was an issue submitting your form, please try later",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof ReservationSchema>) => {
console.log("Submitting data:", values);
    setResponse(undefined);

    startTransition(() => {
      if (item) {
        updateReservation(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({
              title: "Success",
              description: data.message,
            });
            router.push("/reservations");
          }
        });
      } else {
        createReservation(values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({
              title: "Success",
              description: data.message,
            });
            router.push("/reservations");
          }
        });
      }
    });
  };



  const handleTimeChange = (type: "hour" | "minutes", value: string) => {
    if (!reservationDate || !startDate || !endDate) return;

    const newDate = new Date(reservationDate);
    const newStartDate = new Date(startDate)
    const newEndDate = new Date(endDate)

    if (type === "hour") {
      newDate.setHours(Number(value));
      newStartDate.setHours(Number(value));
      newEndDate.setHours(Number(value))
    } else if (type === "minutes") {
      newDate.setMinutes(Number(value));
      newStartDate.setMinutes(Number(value));
      newEndDate.setMinutes(Number(value))
    }
    setReservationDate(newDate);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleDateSelect = (date: Date) => {
    setReservationDate(date)
    setStartDate(date);
    setEndDate(date)
  };

  return (
    <>
      <>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
            <div className="lg:grid grid-cols-2 gap-4 mt-2">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="Enter name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <FormControl>
                        <CustomerSelector
                          value={field.value}
                          onChange={(id) => {
                            field.onChange(id);
                            form.setValue("customer", id);
                          }}
                          placeholder="Select customer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="lg:grid grid-cols-2 gap-4 mt-2">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl className="w-full border-1 rounded-sm ">
                        <PhoneInput
                          {...field}
                          disabled={isPending}
                          placeholder="Enter phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          type="email"
                          placeholder="Enter email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="lg:grid grid-cols-2  gap-4 mt-2">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Reservation</FormLabel>
                      <DateTimePicker
                        field={field}
                        date={reservationDate}
                        setDate={setReservationDate}
                        handleTimeChange={handleTimeChange}
                        onDateSelect={handleDateSelect}
                        minDate={new Date()}
                      />
                      <FormDescription>
                        Please select your preferred date of reservation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="numberOfPeople"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of People</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="Enter number of people"
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="lg:grid grid-cols-2 gap-2 mt-2">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start date </FormLabel>
                      <DateTimePicker
                        field={field}
                        date={startDate}
                        setDate={setStartDate}
                        handleTimeChange={handleTimeChange}
                        onDateSelect={handleDateSelect}
                        minDate={new Date()}
                      />
                      <FormDescription>
                        Please select your preferred start date and time.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End date</FormLabel>
                      <DateTimePicker
                        field={field}
                        date={endDate}
                        setDate={setEndDate}
                        handleTimeChange={handleTimeChange}
                        onDateSelect={handleDateSelect}
                        minDate={startDate}
                      />
                      <FormDescription>
                        Please select your preferred end date and time.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="lg:grid grid-cols-2 gap-2 mt-2">
              <div className="grid gap-2 mt-2">
                <FormField
                  control={form.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room</FormLabel>
                      <FormControl>
                        <ProductVariantSelector
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select room to reserve"
                          isDisabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {item && (
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="status"

                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <FormLabel>

                          Reservation Status
                          <span className={item.status ? "text-green-500" : "text-red-500"}>
                            ({item.status ? "Active" : "Inactive"})
                          </span>

                        </FormLabel>
                        <FormControl>
                          <Switch

                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )
              }
            </div>

            <div className="flex h-5 items-center space-x-4 mt-7">
              <CancelButton/>

              <Separator orientation="vertical"/>
              
              <SubmitButton
                  isPending={isPending}
                  label={item ? "Update Reservation" : "Reserve room"}
              />
            </div>
          </form>
        </Form>
      </>
    </>
  );
};

export default ReservationForm;
