"use client";

import React, { useCallback, useState, useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";
import { Location } from "@/types/location/type";
import { LocationSettings, OperatingHour } from "@/types/settings/type";
import { LocationSchema } from "@/types/location/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import Loading from "@/components/ui/loading";
import {
  Copy,
  Check,
  Building2,
  Mail,
  MapPin,
  Loader2Icon,
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { businessTimes } from "@/types/constants";
import { BusinessTimeType } from "@/types/types";
import { updateLocation } from "@/lib/actions/location-actions";
import { updateLocationSettings } from "@/lib/actions/settings-actions";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const DEFAULT_HOURS: OperatingHour[] = DAYS_OF_WEEK.map((day) => ({
  dayOfWeek: day,
  openTime: "08:00",
  closeTime: "22:00",
  closed: false,
}));

// Default center: Dar es Salaam
const DEFAULT_CENTER = { lat: -6.7924, lng: 39.2083 };

// --- Map Picker Component ---
const LocationMapPicker = ({
  latitude,
  longitude,
  onLocationChange,
  disabled,
}: {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  disabled: boolean;
}) => {
  const position =
    latitude != null && longitude != null
      ? { lat: latitude, lng: longitude }
      : DEFAULT_CENTER;

  const handleMapClick = useCallback(
    (e: { detail: { latLng: { lat: number; lng: number } | null } }) => {
      if (disabled || !e.detail.latLng) return;
      onLocationChange(e.detail.latLng.lat, e.detail.latLng.lng);
    },
    [disabled, onLocationChange],
  );

  return (
    <div className="rounded-lg overflow-hidden border h-[300px]">
      <Map
        defaultZoom={latitude != null ? 15 : 12}
        defaultCenter={position}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="location-picker"
        onClick={handleMapClick}
        className="w-full h-full"
      >
        {latitude != null && longitude != null && (
          <AdvancedMarker position={{ lat: latitude, lng: longitude }} />
        )}
      </Map>
    </div>
  );
};

// --- Parsed location data from Google ---
interface ParsedLocation {
  lat: number;
  lng: number;
  address?: string;
  street?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

function extractAddressComponents(
  components: google.maps.GeocoderAddressComponent[],
): { address: string; street: string; city: string; region: string } {
  let streetNumber = "";
  let route = "";
  let city = "";
  let region = "";
  let sublocality = "";

  for (const c of components) {
    const types = c.types;
    if (types.includes("street_number")) streetNumber = c.long_name;
    else if (types.includes("route")) route = c.long_name;
    else if (types.includes("locality")) city = c.long_name;
    else if (types.includes("sublocality") || types.includes("sublocality_level_1"))
      sublocality = c.long_name;
    else if (types.includes("administrative_area_level_1"))
      region = c.long_name;
  }

  const street = [streetNumber, route].filter(Boolean).join(" ");
  const address = street || sublocality || city;

  return { address, street, city: city || sublocality, region };
}

// --- Reverse geocode a map click to get address fields ---
function useReverseGeocode() {
  const geocoding = useMapsLibrary("geocoding");

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<Partial<ParsedLocation>> => {
      if (!geocoding) return { lat, lng };
      const geocoder = new geocoding.Geocoder();
      try {
        const resp = await geocoder.geocode({ location: { lat, lng } });
        if (resp.results?.[0]) {
          const result = resp.results[0];
          const parts = extractAddressComponents(result.address_components);
          return {
            lat,
            lng,
            address: result.formatted_address ?? parts.address,
            street: parts.street,
            city: parts.city,
            region: parts.region,
          };
        }
      } catch {
        // geocode failed, return just coordinates
      }
      return { lat, lng };
    },
    [geocoding],
  );

  return reverseGeocode;
}

// --- Search Box Component ---
const PlaceSearch = ({
  onPlaceSelect,
  disabled,
}: {
  onPlaceSelect: (data: ParsedLocation) => void;
  disabled: boolean;
}) => {
  const map = useMap();
  const places = useMapsLibrary("places");
  const [inputValue, setInputValue] = useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const ac = new places.Autocomplete(inputRef.current, {
      fields: ["geometry", "formatted_address", "address_components", "utc_offset_minutes"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const parts = place.address_components
          ? extractAddressComponents(place.address_components)
          : { address: "", street: "", city: "", region: "" };

        // Try to derive IANA timezone from utc_offset if available
        let timezone: string | undefined;
        if (place.utc_offset_minutes != null) {
          const hours = place.utc_offset_minutes / 60;
          // Common East Africa offset
          if (hours === 3) timezone = "Africa/Dar_es_Salaam";
          else if (hours === 2) timezone = "Africa/Johannesburg";
          else if (hours === 1) timezone = "Africa/Lagos";
          else if (hours === 0) timezone = "Africa/Accra";
        }

        onPlaceSelect({
          lat,
          lng,
          address: place.formatted_address ?? parts.address,
          street: parts.street,
          city: parts.city,
          region: parts.region,
          timezone,
        });
        map?.panTo({ lat, lng });
        map?.setZoom(15);
      }
    });
    return () => {
      google.maps.event.clearInstanceListeners(ac);
    };
  }, [places, map, onPlaceSelect]);

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="Search for a place..."
      disabled={disabled}
    />
  );
};

// --- Combined map section (must be inside APIProvider) ---
const LocationMapSection = ({
  latitude,
  longitude,
  onLocationResolved,
  disabled,
}: {
  latitude: number | null;
  longitude: number | null;
  onLocationResolved: (data: Partial<ParsedLocation>) => void;
  disabled: boolean;
}) => {
  const reverseGeocode = useReverseGeocode();

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      const data = await reverseGeocode(lat, lng);
      onLocationResolved(data);
    },
    [reverseGeocode, onLocationResolved],
  );

  return (
    <div className="space-y-3">
      <PlaceSearch onPlaceSelect={onLocationResolved} disabled={disabled} />
      <LocationMapPicker
        latitude={latitude}
        longitude={longitude}
        onLocationChange={handleMapClick}
        disabled={disabled}
      />
      {latitude != null && longitude != null && (
        <p className="text-xs text-muted-foreground">
          Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
};

type LocationFormValues = z.infer<typeof LocationSchema>;

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
  const [operatingHours, setOperatingHours] =
    useState<OperatingHour[]>(DEFAULT_HOURS);

  useEffect(() => {
    if (locationSettings?.operatingHours?.length) {
      const merged = DAYS_OF_WEEK.map((day) => {
        const existing = locationSettings.operatingHours.find(
          (h) => h.dayOfWeek === day,
        );
        return (
          existing ?? {
            dayOfWeek: day,
            openTime: "08:00",
            closeTime: "22:00",
            closed: false,
          }
        );
      });
      setOperatingHours(merged);
    }
  }, [locationSettings]);

  const handleCopy = () => {
    if (!location?.identifier) return;
    navigator.clipboard.writeText(location.identifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(LocationSchema),
    defaultValues: {
      name: location?.name ?? "",
      phone: location?.phoneNumber ?? "",
      email: location?.email ?? "",
      description: location?.description ?? "",
      address: location?.address ?? "",
      city: location?.region ?? "",
      region: location?.region ?? "",
      street: location?.address ?? "",
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      timezone: location?.timezone ?? "Africa/Dar_es_Salaam",
      status: location ? location.active : true,
      image: undefined,
    },
  });

  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name ?? "",
        phone: location.phoneNumber ?? "",
        email: location.email ?? "",
        description: location.description ?? "",
        address: location.address ?? "",
        city: location.region ?? "",
        region: location.region ?? "",
        street: location.address ?? "",
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        timezone: location.timezone ?? "Africa/Dar_es_Salaam",
        status: location.active,
        image: undefined,
      });
    }
  }, [location, form]);

  const updateDayHour = (
    dayOfWeek: string,
    field: keyof OperatingHour,
    value: string | boolean | null,
  ) => {
    setOperatingHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h,
      ),
    );
  };

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

  const submitData = (values: LocationFormValues) => {
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
          latitude: values.latitude,
          longitude: values.longitude,
          timezone: values.timezone,
          status: values.status,
          subscription: values.subscription,
        };

        const promises: Promise<any>[] = [];

        if (location) {
          promises.push(updateLocation(location.id, locationData as any));
        }

        if (locationSettings) {
          promises.push(
            updateLocationSettings(locationSettings.id, {
              operatingHours,
            } as any),
          );
        }

        const results = await Promise.all(promises);

        const locationResult = results[0];
        if (locationResult?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Error",
            description: locationResult.message,
          });
          return;
        }

        toast({
          title: "Location Updated",
          description:
            "Location details and operating hours have been updated successfully.",
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

  const applyParsedLocation = useCallback(
    (data: Partial<ParsedLocation>) => {
      if (data.lat != null) form.setValue("latitude", data.lat, { shouldDirty: true });
      if (data.lng != null) form.setValue("longitude", data.lng, { shouldDirty: true });
      if (data.address) form.setValue("address", data.address, { shouldDirty: true });
      if (data.street) form.setValue("street", data.street, { shouldDirty: true });
      if (data.city) form.setValue("city", data.city, { shouldDirty: true });
      if (data.region) form.setValue("region", data.region, { shouldDirty: true });
      if (data.timezone) form.setValue("timezone", data.timezone, { shouldDirty: true });
    },
    [form],
  );

  const watchLat = form.watch("latitude");
  const watchLng = form.watch("longitude");

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
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Location Details
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your location information, address, and operating hours
        </p>
        {location?.identifier && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Location ID:</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">
              {location.identifier}
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

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitData, onInvalid)}
          className="space-y-6"
        >
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium">Basic Information</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Name, contact details, and timezone</p>
              </div>
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
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                          placeholder="Africa/Dar_es_Salaam"
                        />
                      </FormControl>
                      <FormDescription>IANA timezone identifier</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Address & Location */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium">Address & Location</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Physical address and map coordinates</p>
              </div>

              {/* Map Picker */}
              {GOOGLE_MAPS_API_KEY ? (
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                  <LocationMapSection
                    latitude={watchLat ?? null}
                    longitude={watchLng ?? null}
                    onLocationResolved={applyParsedLocation}
                    disabled={isPending}
                  />
                </APIProvider>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Map picker unavailable. Set <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
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

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / Region</FormLabel>
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

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                          placeholder="Enter street"
                        />
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
            </CardContent>
          </Card>

          <Separator />

          {/* Operating Hours */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium">Operating Hours</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set opening and closing times for each day of the week. Toggle
                  off days when the location is closed.
                </p>
              </div>
              <div className="space-y-3">
                {operatingHours.map((hour) => (
                  <div
                    key={hour.dayOfWeek}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between sm:w-40 flex-shrink-0">
                      <span className="text-sm font-medium">
                        {DAY_LABELS[hour.dayOfWeek]}
                      </span>
                      <Switch
                        checked={!hour.closed}
                        onCheckedChange={(open) =>
                          updateDayHour(hour.dayOfWeek, "closed", !open)
                        }
                        disabled={isPending}
                        className="bg-green-500"
                      />
                    </div>

                    {!hour.closed ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Select
                          value={hour.openTime ?? "08:00"}
                          onValueChange={(v) =>
                            updateDayHour(hour.dayOfWeek, "openTime", v)
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-full sm:w-32">
                            <SelectValue placeholder="Open" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessTimes.map(
                              (t: BusinessTimeType, i: number) => (
                                <SelectItem key={i} value={t.name}>
                                  {t.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">
                          to
                        </span>
                        <Select
                          value={hour.closeTime ?? "22:00"}
                          onValueChange={(v) =>
                            updateDayHour(hour.dayOfWeek, "closeTime", v)
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-full sm:w-32">
                            <SelectValue placeholder="Close" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessTimes.map(
                              (t: BusinessTimeType, i: number) => (
                                <SelectItem key={i} value={t.name}>
                                  {t.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Closed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
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
    </div>
  );
};

export default LocationDetailsSettings;
