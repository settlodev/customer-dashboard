"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";
import { Location } from "@/types/location/type";
import {
  LocationSettings,
  SETTINGS_CONFIG,
  SettingField,
} from "@/types/settings/type";
import { LocationSchema } from "@/types/location/schema";
import { LocationSettingsSchema } from "@/types/settings/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Loading from "@/components/ui/loading";
import {
  Copy,
  Check,
  Building2,
  Clock,
  Mail,
  MapPin,
  Loader2Icon,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { businessTimes } from "@/types/constants";
import { BusinessTimeType, FormResponse } from "@/types/types";
import { createLocation, updateLocation } from "@/lib/actions/location-actions";
import { updateLocationSettings } from "@/lib/actions/settings-actions";
import { toast } from "@/hooks/use-toast";
import CountrySelector from "@/components/widgets/country-selector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationForm } from "@/components/forms/location_form";

const GENERAL_SETTINGS_CATEGORIES = ["basic"];

const CombinedLocationSchema = LocationSchema.extend(
  LocationSettingsSchema.pick({
    currencyCode: true,
    minimumSettlementAmount: true,
    systemPasscode: true,
    reportsPasscode: true,
    usePasscode: true,
    isDefault: true,
  }).shape,
);

type CombinedFormValues = z.infer<typeof CombinedLocationSchema>;

const LocationDetailsSettings = ({
  location,
  isLoading,
  locationSettings,
}: {
  location: Location | null;
  isLoading: boolean;
  locationSettings?: LocationSettings | null;
}) => {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showNewLocationForm, setShowNewLocationForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdLocationName, setCreatedLocationName] = useState<string | null>(
    null,
  );

  const handleCopy = () => {
    if (!location?.locationAccountNumber) return;
    navigator.clipboard.writeText(location.locationAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimeForSelect = (timeString: string | null | undefined) => {
    if (!timeString) return undefined;
    return timeString.substring(0, 5);
  };

  const form = useForm<CombinedFormValues>({
    resolver: zodResolver(CombinedLocationSchema),
    defaultValues: {
      ...location,
      openingTime: location?.openingTime
        ? formatTimeForSelect(location.openingTime)
        : undefined,
      closingTime: location?.closingTime
        ? formatTimeForSelect(location.closingTime)
        : undefined,
      status: location ? location.status : true,
      currencyCode: locationSettings?.currencyCode ?? "TZS",
      minimumSettlementAmount: locationSettings?.minimumSettlementAmount ?? 0,
      systemPasscode: locationSettings?.systemPasscode ?? "0000",
      reportsPasscode: locationSettings?.reportsPasscode ?? "0000",
      usePasscode: locationSettings?.usePasscode ?? false,
      isDefault: locationSettings?.isDefault ?? false,
    },
  });

  useEffect(() => {
    if (location && locationSettings) {
      form.reset({
        ...location,
        openingTime: location?.openingTime
          ? formatTimeForSelect(location.openingTime)
          : undefined,
        closingTime: location?.closingTime
          ? formatTimeForSelect(location.closingTime)
          : undefined,
        status: location.status,
        currencyCode: locationSettings.currencyCode ?? "TZS",
        minimumSettlementAmount: locationSettings.minimumSettlementAmount ?? 0,
        systemPasscode: locationSettings.systemPasscode ?? "0000",
        reportsPasscode: locationSettings.reportsPasscode ?? "0000",
        usePasscode: locationSettings.usePasscode ?? false,
        isDefault: locationSettings.isDefault ?? false,
      });
    }
  }, [location, locationSettings, form]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description:
        typeof errors.message === "string"
          ? errors.message
          : "There was an issue submitting your form, please try later",
    });
  }, []);

  const submitData = (values: CombinedFormValues) => {
    startTransition(async () => {
      try {
        const locationData = {
          name: values.name,
          phone: values.phone,
          email: values.email,
          description: values.description,
          address: values.address,
          city: values.city,
          region: values.region,
          street: values.street,
          openingTime: values.openingTime,
          closingTime: values.closingTime,
          status: values.status,
          subscription: values.subscription,
        };

        const settingsData = {
          currencyCode: values.currencyCode,
          minimumSettlementAmount: values.minimumSettlementAmount,
          systemPasscode: values.systemPasscode,
          reportsPasscode: values.reportsPasscode,
          usePasscode: values.usePasscode,
          isDefault: values.isDefault,
        };

        const results = await Promise.all([
          location
            ? updateLocation(location.id, locationData as any)
            : Promise.resolve(null),
          locationSettings
            ? updateLocationSettings(locationSettings.id, settingsData as any)
            : Promise.resolve(null),
        ]);

        const locationResult = results[0] as FormResponse | null;
        if (locationResult?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Error",
            description: locationResult.message,
          });
          return;
        }

        toast({
          title: "Settings Updated",
          description:
            "Location details and settings have been updated successfully.",
        });
      } catch (error) {
        console.error("Update failed:", error);
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

  // Handler for the new location form submission
  const handleNewLocationSubmit = async (
    values: z.infer<typeof LocationSchema>,
  ) => {
    try {
      const saved = await createLocation(values);

      if (saved?.responseType === "success" && saved.data) {
        setCreatedLocationName((saved.data as Location).name);
        setShowNewLocationForm(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(saved?.message || "Failed to create location");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem creating the location. Please try again.",
      });
    }
  };

  const generalSettings = SETTINGS_CONFIG.filter((s) =>
    GENERAL_SETTINGS_CATEGORIES.includes(s.category),
  );

  const renderSettingField = (field: SettingField) => {
    const { key, type, placeholder, helperText, inputType, min, max, step } =
      field;

    const currentValues = form.watch();
    if (field.dependencies?.length) {
      const allMet = field.dependencies.every(
        (dep) => currentValues[dep as keyof typeof currentValues],
      );
      if (!allMet) return null;
    }

    switch (type) {
      case "switch":
        return (
          <FormField
            key={key as any}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    {field.label}
                  </FormLabel>
                  {helperText && (
                    <FormDescription className="text-xs">
                      {helperText}
                    </FormDescription>
                  )}
                </div>
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                    disabled={isPending || field.disabled}
                    className="bg-green-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );

      case "country-select":
        return (
          <FormField
            key={key as any}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <CountrySelector
                    value={formField.value ?? ""}
                    onChange={formField.onChange}
                    isDisabled={isPending || field.disabled}
                    placeholder={placeholder}
                    valueKey="currencyCode"
                  />
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "input":
      case "text":
      case "password":
      case "number":
        return (
          <FormField
            key={key as any}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={
                      inputType ||
                      (type === "password"
                        ? "password"
                        : type === "number"
                          ? "number"
                          : "text")
                    }
                    placeholder={placeholder}
                    disabled={isPending || field.disabled}
                    value={formField.value ?? ""}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => {
                      if (type === "number") {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        formField.onChange(isNaN(value) ? 0 : value);
                      } else {
                        formField.onChange(e.target.value);
                      }
                    }}
                  />
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  const settingsByCategory = generalSettings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) acc[setting.category] = [];
      acc[setting.category].push(setting);
      return acc;
    },
    {} as Record<string, SettingField[]>,
  );

  const CATEGORY_TITLES: Record<string, string> = {
    basic: "General Settings",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Location Details
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Loading location details...
          </p>
        </div>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6 flex items-center justify-center">
            <Loading />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Location Details
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your location information, address, and general settings
          </p>
          {location?.locationAccountNumber && !showNewLocationForm && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Account No:</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">
                {location.locationAccountNumber}
              </code>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Toggle button */}
        {showNewLocationForm ? (
          <Button
            variant="outline"
            onClick={() => setShowNewLocationForm(false)}
            className="shrink-0"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        ) : (
          <Button
            onClick={() => setShowNewLocationForm(true)}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Location
          </Button>
        )}
      </div>

      {/* New location form OR existing location edit form */}
      {showNewLocationForm ? (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <LocationForm item={null} onSubmit={handleNewLocationSubmit} />
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitData, onInvalid)}
            className="space-y-6"
          >
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
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
                        <FormItem>
                          <FormLabel>Location Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
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

                <Separator />

                {/* Business Hours */}
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

                {/* Address Details */}
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
                                placeholder="Enter street"
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

                <Separator />

                {/* General Settings */}
                {Object.entries(settingsByCategory).map(
                  ([category, settings]) => (
                    <React.Fragment key={category}>
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {CATEGORY_TITLES[category] || category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {settings.map((field) => renderSettingField(field))}
                        </div>
                      </div>
                    </React.Fragment>
                  ),
                )}

                {/* Submit */}
                <div className="flex justify-end pt-6">
                  {isPending ? (
                    <Button disabled className="w-full md:w-auto">
                      <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </Button>
                  ) : (
                    <Button type="submit" className="w-full md:w-auto">
                      Update Location
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Status Card */}
            {location && (
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
                                variant={
                                  field.value ? "destructive" : "default"
                                }
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
      )}

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <DialogTitle className="text-center text-xl">
              Location Added!
            </DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-semibold text-foreground">
                {createdLocationName}
              </span>{" "}
              has been successfully created.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setShowSuccessModal(false)}
            >
              Stay on Page
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                window.location.href = "/select-location";
              }}
            >
              Go to Select Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationDetailsSettings;
