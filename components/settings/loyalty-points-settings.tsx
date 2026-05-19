"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LocationSettings } from "@/types/settings/type";
import { LocationSettingsSchema } from "@/types/settings/schema";
import { updateLocationSettings } from "@/lib/actions/settings-actions";
import { FormResponse } from "@/types/types";

const LoyaltyPointsSettings = ({
  locationSettings,
}: {
  locationSettings: LocationSettings | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();

  const form = useForm<z.infer<typeof LocationSettingsSchema>>({
    resolver: zodResolver(LocationSettingsSchema),
    defaultValues: { ...locationSettings, status: true },
  });

  useEffect(() => {
    if (locationSettings) {
      form.reset(locationSettings);
    }
  }, [locationSettings, form]);

  const customerEnabled = form.watch("enableCustomerLoyaltyPoints");
  const customerAwardType = form.watch("customerLoyaltyAwardType");
  const staffEnabled = form.watch("enableStaffPoints");
  const staffAwardType = form.watch("staffPointsAwardType");

  const onInvalid = useCallback((errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description: "There was an issue submitting your form, please try later",
    });
  }, []);

  const submitData = (values: z.infer<typeof LocationSettingsSchema>) => {
    setResponse(undefined);
    startTransition(() => {
      if (locationSettings) {
        updateLocationSettings(locationSettings.id, values as any).then(
          (data) => {
            if (data) {
              setResponse(data);
              toast({
                title: "Settings Updated",
                description:
                  "Loyalty points settings have been updated successfully.",
              });
            }
          },
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Loyalty Points
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure loyalty points programs for customers and staff members
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitData, onInvalid)}
          className="space-y-6"
        >
          {/* Customer Loyalty Points */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium">Customer Loyalty Points</h3>

              <FormField
                control={form.control}
                name="enableCustomerLoyaltyPoints"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Enable Customer Loyalty Points
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Enable loyalty points program for customers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                        className="bg-green-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {customerEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerLoyaltyAwardType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Award Type</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select award type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PER_ORDER">
                                Per Order (flat points per order)
                              </SelectItem>
                              <SelectItem value="PER_ORDER_VALUE">
                                Per Order Value (based on amount)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          How customers earn loyalty points
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {customerAwardType === "PER_ORDER" && (
                    <FormField
                      control={form.control}
                      name="customerLoyaltyPointsPerOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Per Order</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="e.g. 10"
                              disabled={isPending}
                              value={field.value ?? 0}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? 0
                                    : parseInt(e.target.value) || 0,
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Flat points awarded per closed order
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {customerAwardType === "PER_ORDER_VALUE" && (
                    <>
                      <FormField
                        control={form.control}
                        name="customerLoyaltyPointsPerValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points Per Value Threshold</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                placeholder="e.g. 1"
                                disabled={isPending}
                                value={field.value ?? 0}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? 0
                                      : parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Points earned each time the value threshold is
                              reached
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerLoyaltyValueThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value Threshold</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="e.g. 1000"
                                disabled={isPending}
                                value={field.value ?? 0}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? 0
                                      : parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Order amount needed to earn points (e.g. 1000 = 1
                              point per 1000 spent)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="customerLoyaltyMinimumRedeemablePoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Redeemable Points</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="e.g. 50"
                            disabled={isPending}
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum points a customer must accumulate before
                          redeeming
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Staff Points */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium">Staff Points</h3>

              <FormField
                control={form.control}
                name="enableStaffPoints"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Enable Staff Points
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Enable points program for staff members
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                        className="bg-green-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {staffEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="staffPointsAwardType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Award Type</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select award type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PER_ORDER">
                                Per Order (flat points per order)
                              </SelectItem>
                              <SelectItem value="PER_ORDER_VALUE">
                                Per Order Value (based on amount)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          How staff members earn points
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {staffAwardType === "PER_ORDER" && (
                    <FormField
                      control={form.control}
                      name="staffPointsPerOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Per Order</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="e.g. 5"
                              disabled={isPending}
                              value={field.value ?? 0}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? 0
                                    : parseInt(e.target.value) || 0,
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Flat points awarded per closed order
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {staffAwardType === "PER_ORDER_VALUE" && (
                    <>
                      <FormField
                        control={form.control}
                        name="staffPointsPerValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points Per Value Threshold</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                placeholder="e.g. 1"
                                disabled={isPending}
                                value={field.value ?? 0}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? 0
                                      : parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Points earned each time the value threshold is
                              reached
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="staffPointsValueThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value Threshold</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="e.g. 5000"
                                disabled={isPending}
                                value={field.value ?? 0}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? 0
                                      : parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Order amount needed to earn points
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="staffMinimumRedeemablePoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Redeemable Points</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="e.g. 100"
                            disabled={isPending}
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum points staff must accumulate before redeeming
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="staffPointsRecipient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Recipient</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select recipient" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FINISHED_BY">
                                Finished By (staff who closed the order)
                              </SelectItem>
                              <SelectItem value="ASSIGNED_TO">
                                Assigned To (staff assigned to the order)
                              </SelectItem>
                              <SelectItem value="SPLIT">
                                Split (divide between both)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Which staff member receives the points for an order
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            {isPending ? (
              <Button disabled className="w-full md:w-auto">
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Updating Settings...
              </Button>
            ) : (
              <Button type="submit" className="w-full md:w-auto">
                Update Settings
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoyaltyPointsSettings;
