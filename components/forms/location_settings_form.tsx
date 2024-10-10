"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { LocationSchema } from "@/types/location/schema";
import { Loader2Icon } from "lucide-react";
import { LocationSettings } from "@/types/locationSettings/type";
import { LocationSettingsSchema } from "@/types/locationSettings/schema";
import { createLocationSettings, updateLocationSettings } from "@/lib/actions/settings-actions";
import { formatNumber } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { toast } from "@/hooks/use-toast";


const LocationSettingsForm = ({ item }: { item: LocationSettings | null | undefined }) => {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();

  const form = useForm<z.infer<typeof LocationSettingsSchema>>({
    resolver: zodResolver(LocationSettingsSchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: any) => {
      // console.error("Form validation errors:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof LocationSettingsSchema>) => {
    // console.log("Form submitted with values:", values); 

    setResponse(undefined);

    startTransition(() => {
      if (item) {
        // console.log("Updating location settings...");
        updateLocationSettings(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        // console.log("Creating location settings...");
        createLocationSettings(values).then((data) => {
          if (data) setResponse(data);
        });
      }
    });
  };

  return (
    <Card >
      <CardHeader>
        <CardTitle>Location Settings</CardTitle>
        <CardDescription>
          Set up your business location settings
        </CardDescription>
      </CardHeader>
      <CardContent>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitData, onInvalid)}>

            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="minimumSettlementAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Settlement Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter minimum settlement amount "
                        {...field}
                        required
                        disabled={isPending}
                        value={field.value ? formatNumber(field.value) : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
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
                  name="systemPasscode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Passcode</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          required
                          disabled={isPending}
                          placeholder="Enter system passcode"
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
                  name="reportPasscode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Passcode</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          required
                          disabled={isPending}
                          placeholder="Enter report passcode"
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
                  name="trackInventory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Track Inventory for this location
                        </FormLabel>
                      </div>
                      <FormMessage />

                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="enableNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Enable Notifications
                      </FormLabel>
                    </div>
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
                  name="ecommerceEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Enable Ecommerce
                        </FormLabel>
                      </div>
                      <FormMessage />

                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="useCustomPrice"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Use custom price
                      </FormLabel>
                    </div>
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
                  name="useDepartments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Use Department
                        </FormLabel>
                      </div>
                      <FormMessage />

                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="useShift"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Use Shift
                      </FormLabel>
                    </div>
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
                  name="useWarehouse"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Use Warehouse
                        </FormLabel>
                      </div>
                      <FormMessage />

                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as Main Location
                      </FormLabel>
                    </div>
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
                  name="useKds"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Use KDS
                        </FormLabel>
                      </div>
                      <FormMessage />

                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="useRecipe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Use Recipe
                      </FormLabel>
                    </div>
                    <FormMessage />

                  </FormItem>
                  )}
                />
              </div>
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
                setup settings
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LocationSettingsForm;
