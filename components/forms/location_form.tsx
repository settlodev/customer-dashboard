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

import { Separator } from "../ui/separator";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";

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
  const [, setResponse] = useState<FormResponse | undefined>();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTimeForSelect = (timeString: string | null | undefined) => {
    if (!timeString) return undefined;

    const hourAndMinutes = timeString.substring(0, 5);

    return hourAndMinutes;
  };

  const form = useForm<z.infer<typeof LocationSchema>>({
    resolver: zodResolver(LocationSchema),
    defaultValues: {
      ...item,
      openingTime: item?.openingTime
        ? formatTimeForSelect(item.openingTime)
        : undefined,
      closingTime: item?.closingTime
        ? formatTimeForSelect(item.closingTime)
        : undefined,
      status: item ? item.status : true,
    },
  });

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.log("The errors are:", errors);
    toast({
      variant: "destructive",
      title: "Uh oh! something went wrong",
      description:
        typeof errors.message === "string"
          ? errors.message
          : "There was an issue submitting your form, please try later",
    });
  }, []);

  const submitData = (values: z.infer<typeof LocationSchema>) => {
    setResponse(undefined);

    const locationData = {
      ...values,
      image: imageUrl || null,
    };

    // Delegate to parent for both multipleStep AND standalone new location
    if (multipleStep || !item) {
      setIsSubmitting(true);
      Promise.resolve(_onSubmit(locationData)).finally(() => {
        setIsSubmitting(false);
      });
      return;
    }

    // Only runs for UPDATE (item exists) — handles its own API call
    startTransition(async () => {
      try {
        const response = await updateLocation(item.id, locationData);
        if (response) {
          setResponse(response);
          window.location.href = "/select-location";
        }
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
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="mx-auto space-y-8"
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                {/* Left col — fixed 200px width, same pattern as product form */}
                <div className="col-span-1">
                  <div className="flex flex-col items-center">
                    <UploadImageWidget
                      imagePath="location"
                      displayStyle="default"
                      displayImage={true}
                      showLabel={true}
                      label="Upload location image"
                      setImage={setImageUrl}
                      image={imageUrl}
                    />
                  </div>
                </div>

                {/* Right col — fills remaining space */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            <Input
                              className="pl-10"
                              {...field}
                              disabled={isPending}
                              placeholder="Enter location name"
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
                            placeholder="Enter phone number"
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
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            <Input
                              className="pl-10"
                              {...field}
                              value={field.value || ""}
                              disabled={isPending}
                              type="email"
                              placeholder="Enter email"
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
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Location Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            <Input
                              className="pl-10"
                              {...field}
                              disabled={isPending}
                              placeholder="Enter address"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          value={field.value}
                        >
                          <SelectTrigger className="pl-10">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <SelectValue placeholder="Select opening time" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessTimes.map(
                              (item: BusinessTimeType, index: number) => (
                                <SelectItem key={index} value={item.name}>
                                  {item.label}
                                </SelectItem>
                              ),
                            )}
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
                          value={field.value}
                        >
                          <SelectTrigger className="pl-10">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <SelectValue placeholder="Select closing time" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessTimes.map(
                              (item: BusinessTimeType, index: number) => (
                                <SelectItem key={index} value={item.name}>
                                  {item.label}
                                </SelectItem>
                              ),
                            )}
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
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
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
              </div>
            </div>

            <div className="flex justify-end pt-6">
              {isSubmitting || isPending ? (
                <Button disabled className="w-full md:w-auto">
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  {item ? "Updating..." : "Processing..."}
                </Button>
              ) : (
                <Button type="submit" className="w-full md:w-auto">
                  {item
                    ? "Update Location"
                    : multipleStep
                      ? "Complete Setup"
                      : "Add Location"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

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
                        <FormDescription>
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
                        </FormDescription>
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
