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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
import { LocationSettings } from "@/types/locationSettings/type";
import { LocationSettingsSchema } from "@/types/locationSettings/schema";
import { updateLocationSettings } from "@/lib/actions/settings-actions";
import { Checkbox } from "../ui/checkbox";
import { toast } from "@/hooks/use-toast";


const LocationSettingsForm = ({ item }: { item: LocationSettings | null | undefined }) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();

  const form = useForm<z.infer<typeof LocationSettingsSchema>>({
    resolver: zodResolver(LocationSettingsSchema),
    defaultValues:item ||{ status: true },
  });

   useEffect(() => {
    if (item) {
      form.reset(item); 
    }
  }, [item, form]);


  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.error("Form validation errors:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description:typeof errors.message === 'string'
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    []
  );

  const submitData = (values: z.infer<typeof LocationSettingsSchema>) => {

    setResponse(undefined);

    startTransition(() => {
      if (item) {
        updateLocationSettings(item.id, values).then((data) => {
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
                        value={field.value}
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
                          // type="password"
                          disabled={isPending}
                          value={field.value }
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
                  name="reportsPasscode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Passcode</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          required
                          disabled={isPending}
                          value={field.value }
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
                  name="useShifts"
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
            <div className="lg:grid grid-cols-2 gap-4 mt-2">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="isActive"
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
                          Is Active
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
                update settings
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LocationSettingsForm;
