"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
import { Reservation } from "@/types/reservation/type";
import { ReservationSchema } from "@/types/reservation/schema";
import {
  createReservation,
  updateReservation,
} from "@/lib/actions/reservation-actions";
import DateTimePicker from "../widgets/datetimepicker";
import { fectchAllCustomers } from "@/lib/actions/customer-actions";
import { Customer } from "@/types/customer/type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PhoneInput } from "../ui/phone-input";
import{useToast} from "@/hooks/use-toast";
import { Product } from "@/types/product/type";
import { fectchAllProducts } from "@/lib/actions/product-actions";

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
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [rooms, setRooms] = useState<Product[]>([]);
    const { toast } = useToast();

    useEffect(() => {
      const fetchData = async () => {
        try {
          const [customerResponse, roomResponse] = await Promise.all([
            fectchAllCustomers(),
            fectchAllProducts(),
          ]);
          setCustomers(customerResponse);
          setRooms(roomResponse);
        } catch (error) {
          console.error("Error fetching data", error);
        }
      };
    
      fetchData();
    }, []);
    

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
            });
          } else {
            createReservation(values).then((data) => {
              if (data) setResponse(data);
            });
          }
        });
    };

  const handleTimeChange = (type: "hour" | "minutes", value: string) => {
    const currentDate = new Date();
    const newDate = new Date(currentDate);
    if (type === "hour") {
      newDate.setHours(Number(value));
    } else if (type === "minutes") {
      newDate.setMinutes(Number(value));
    }
  };

  const handleDateSelect = (date: Date) => {
    setStartDate(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Reservation</CardTitle>
        <CardDescription>
          Setup reservation details for your customer
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                        <Select
                          disabled={isPending || customers.length === 0}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.length > 0
                              ? customers.map(
                                  (cust: Customer, index: number) => (
                                    <SelectItem key={index} value={cust.id}>
                                      {cust.firstName} {cust.lastName}{" "}
                                    </SelectItem>
                                  )
                                )
                              : null}
                          </SelectContent>
                        </Select>
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
                      <FormControl className="w-full">
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

            <div className="grid gap-2 mt-2">
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isPending || rooms.length === 0}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room to reserve" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.length > 0
                            ? rooms.map((rm: Product, index: number) => (
                                <SelectItem key={index} value={rm.id}>
                                  {rm.name}{" "}
                                </SelectItem>
                              ))
                            : null}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isPending ? (
              <div className="flex justify-center items-center bg-black rounded p-2 text-white">
                <Loader2Icon className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Button
                type="submit"
                disabled={isPending}
                className={`mt-4 w-full capitalize`}
              >
                setup reservation
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReservationForm;
