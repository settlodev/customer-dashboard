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

import { BusinessTimeType, FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { LocationSchema } from "@/types/location/schema";
import { Building2, Clock, Loader2Icon, Mail, MapPin } from "lucide-react";
import { Location } from "@/types/location/type";
import { createLocation, updateLocation } from "@/lib/actions/location-actions";
import { toast } from "@/hooks/use-toast";
import { PhoneInput } from "../ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { businessTimes } from "@/types/constants";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CancelButton from "../widgets/cancel-button";
import { Separator } from "../ui/separator";

const LocationForm = ({ 
  item, 
  // onSubmit, 
  multipleStep = false 
}: { 
  item: Location | null | undefined, 
  onSubmit: (values: z.infer<typeof LocationSchema>) => void, 
  multipleStep?: boolean 
}) => {

  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();


  const formatTimeForSelect = (timeString: string | null | undefined) => {
    if (!timeString) return undefined;

    const hourAndMinutes = timeString.substring(0, 5);

    return hourAndMinutes;
  };

  const form = useForm<z.infer<typeof LocationSchema>>({
    resolver: zodResolver(LocationSchema),
    defaultValues: {
      ...item,
      openingTime: item?.openingTime ? formatTimeForSelect(item.openingTime) : undefined,
      closingTime: item?.closingTime ? formatTimeForSelect(item.closingTime) : undefined,
      status: item ? item.status : true
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("The errors are:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' ? errors.message : "There was an issue submitting your form, please try later",
      });
    },
    [],
  );


   const submitData = (values: z.infer<typeof LocationSchema>) => {
//     console.log("Submitting data:", values);
    setResponse(undefined);

    startTransition(async () => {
      try {
        const operation = item ? 'update' : 'create';
        console.log(`Performing ${operation} operation`);

        const response = item
          ? await updateLocation(item.id, values)
          : await createLocation(values);

        if (response) {
          setResponse(response);
          if (!item) {
            // Only reload for create operations
            window.location.reload();
          }
        }
      } catch (error) {
        console.error(`${item ? 'Update' : 'Create'} failed:`, error);
        toast({
          variant: "destructive",
          title: `${item ? 'Update' : 'Create'} failed`,
          description: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          className="pl-10"
                          {...field}
                          disabled={isPending}
                          placeholder="Eg. Mark Juices Sinza"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        disabled={isPending}
                        onChange={(value) => field.onChange(value)}
                        placeholder="Enter business location phone number"
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          className="pl-10"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                          type="email"
                          placeholder="Enter business location email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          className="pl-10"
                          {...field}
                          disabled={isPending}
                          placeholder="Enter business location address"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="openingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Time</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isPending}
                        onValueChange={field.onChange}
                        value={field.value}>
                        <SelectTrigger className="pl-10">
                          <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <SelectValue placeholder="Select opening time" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTimes.map((item: BusinessTimeType, index: number) => (
                            <SelectItem key={index} value={item.name}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      When do you open your business location?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Time</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isPending}
                        onValueChange={field.onChange}
                        value={field.value}>
                        <SelectTrigger className="pl-10">
                          <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <SelectValue placeholder="Select closing time" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTimes.map((item: BusinessTimeType, index: number) => (
                            <SelectItem key={index} value={item.name}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      When do you close your business location?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Address Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City / Region</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          className="pl-10"
                          {...field}
                          disabled={isPending}
                          placeholder="Which city do you operate?"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          className="pl-10"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                          placeholder="Enter business location street"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isPending}
                      value={field.value || ""}
                      placeholder="Describe your business location"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {item && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel className="text-base">Location Status</FormLabel>
                  <FormDescription>Enable or disable this business location</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center space-x-4 mt-4 border-t-1 border-t-gray-200 pt-5">
          <CancelButton />
          <Separator orientation="vertical" />
          <Button
            type="submit"
            disabled={isPending}
            className="h-11">
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Processing
              </div>
            ) : (
              item ? 'Update business location' : (multipleStep ? 'Complete Setup' : 'Setup business location')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LocationForm;
