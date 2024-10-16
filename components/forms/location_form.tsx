"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { LocationSchema } from "@/types/location/schema";
import { Loader2Icon } from "lucide-react";
import {Location} from "@/types/location/type";
import {createLocation, updateLocation} from "@/lib/actions/location-actions";
import { toast } from "@/hooks/use-toast";
import { PhoneInput } from "../ui/phone-input";
import { createBusinessLocation } from "@/lib/actions/auth/location";

const LocationForm = ({ item }: { item: Location | null | undefined }) => {
    const [isPending, startTransition] = useTransition();
    const [, setResponse] = useState<FormResponse | undefined>();
    // const [isActive, setIsActive] = useState(item ? item.status : true);

    const form = useForm<z.infer<typeof LocationSchema>>({
        resolver: zodResolver(LocationSchema),
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
    const submitData = (values: z.infer<typeof LocationSchema>) => {
        setResponse(undefined);

        startTransition(() => {
            if (item) {
                updateLocation(item.id, values).then((data) => {
                    if (data) setResponse(data);
                });
            } else {
                createBusinessLocation(values).then((data) => {
                    if (data) setResponse(data);
                });
            }
        });
    };

  return (
    <Card >
      <CardHeader>
        <CardTitle>Setup Business Location</CardTitle>
        <CardDescription>
          Setup your business locations,if you have multiple locations
        </CardDescription>
      </CardHeader>
      <CardContent>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitData, onInvalid)}>

            <div className="grid gap-2">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="Eg. Mark Juices Sinza"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
              <div className="lg:grid grid-cols-2 gap-4 mt-2">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-start">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl >
                         <PhoneInput
                            {...field}
                            disabled={isPending}
                            placeholder="Enter business location phone number"
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
                            placeholder="Enter business location email"
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="Enter business location address"
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
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="Which city do you operate?"
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
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="Which region do you operate?"
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
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="Which street do you operate?"
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
                    name="openingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="HH:MM (24 hour format)"
                            pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
                            title="Please enter time in 24-hour format (HH:mm)"
                          />
                        </FormControl>
                        <FormDescription>
                        When do you open your business location?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="closingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Closing Time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="HH:MM (24 hour format)"
                            pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
                            title="Please enter time in 24-hour format (HH:mm)"
                          />
                        </FormControl>
                        <FormDescription>
                        When do you close your business location?
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description of your business location</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={isPending}
                        placeholder="Describe your business location"
                      />
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
                    setup business location
                  </Button>
                )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LocationForm;
