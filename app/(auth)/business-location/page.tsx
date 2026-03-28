"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessTimeType } from "@/types/types";
import { FormError } from "@/components/widgets/form-error";
import { FormSuccess } from "@/components/widgets/form-success";
import {
  createStandaloneLocation,
} from "@/lib/actions/auth/location";
import { OperatingHoursEntry } from "@/lib/actions/auth/business";
import { fetchAllBusinesses } from "@/lib/actions/business-actions";
import {
  CheckIcon,
  Loader2Icon,
  MapPin,
  Clock,
  Shield,
} from "lucide-react";
import { businessTimes } from "@/types/constants";
import CountrySelector from "@/components/widgets/country-selector";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

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

function getDefaultOperatingHours(): OperatingHoursEntry[] {
  return DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day,
    openTime: "08:00",
    closeTime: "21:00",
    closed: day === "SUNDAY",
  }));
}

export default function BusinessLocationPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);

  const [locationName, setLocationName] = useState("");
  const [countryId, setCountryId] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [operatingHours, setOperatingHours] = useState<OperatingHoursEntry[]>(
    getDefaultOperatingHours,
  );

  const router = useRouter();

  // Fetch user's business on mount
  useEffect(() => {
    (async () => {
      try {
        const businesses = await fetchAllBusinesses();
        if (businesses && businesses.length > 0) {
          setBusinessId(businesses[0].id as string);
        } else {
          setError(
            "No business found. Please create a business first.",
          );
        }
      } catch {
        setError("Failed to load business data.");
      } finally {
        setLoadingBusiness(false);
      }
    })();
  }, []);

  const updateHoursForDay = useCallback(
    (dayOfWeek: string, field: keyof OperatingHoursEntry, value: string | boolean) => {
      setOperatingHours((prev) =>
        prev.map((h) =>
          h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h,
        ),
      );
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!businessId) {
        setError("No business found. Please go back and create a business.");
        return;
      }
      if (!locationName.trim()) {
        setError("Location name is required.");
        return;
      }

      setError("");
      setSuccess("");

      startTransition(async () => {
        try {
          const response = await createStandaloneLocation({
            businessId,
            name: locationName,
            countryId: countryId || undefined,
            region: city || undefined,
            address: address || undefined,
            operatingHours,
          });

          if (!response) {
            setError("Something went wrong. Please try again.");
            return;
          }
          if (response.responseType === "error") {
            setError(response.message);
          } else if (response.responseType === "success") {
            setSuccess(response.message);
            router.push("/dashboard");
          }
        } catch (err: any) {
          setError(err.message || "An unexpected error occurred.");
        }
      });
    },
    [businessId, locationName, countryId, city, address, operatingHours, router],
  );

  if (loadingBusiness) {
    return (
      <div className="flex items-center justify-center">
        <Loader2Icon className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Add your first location
            </CardTitle>
            <CardDescription className="text-gray-500">
              Your business is set up. Now add a location to complete
              registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {error && <FormError message={error} />}
            {success && <FormSuccess message={success} />}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location fields */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Location Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Location name *
                    </label>
                    <Input
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Main Branch"
                      disabled={isPending}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Country
                    </label>
                    <CountrySelector
                      value={countryId}
                      onChange={setCountryId}
                      isDisabled={isPending}
                      placeholder="Select country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      City / Region
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Dar es Salaam"
                      disabled={isPending}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Street address
                    </label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 123 Uhuru Street"
                      disabled={isPending}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pb-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Operating Hours
                    </h3>
                  </div>

                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span className="w-24 shrink-0">Day</span>
                      <span className="w-10 shrink-0">Open</span>
                      <span className="flex-1">From</span>
                      <span className="flex-1">To</span>
                    </div>

                    {operatingHours.map((entry) => (
                      <div
                        key={entry.dayOfWeek}
                        className={`flex items-center gap-3 px-4 py-2 border-t border-gray-100 ${
                          entry.closed ? "bg-gray-50/50" : ""
                        }`}
                      >
                        <span className="w-24 shrink-0 text-sm font-medium text-gray-700">
                          {DAY_LABELS[entry.dayOfWeek]}
                        </span>

                        <div className="w-10 shrink-0">
                          <Switch
                            checked={!entry.closed}
                            onCheckedChange={(checked) =>
                              updateHoursForDay(entry.dayOfWeek, "closed", !checked)
                            }
                            disabled={isPending}
                          />
                        </div>

                        <div className="flex-1">
                          <Select
                            disabled={isPending || entry.closed}
                            value={entry.openTime}
                            onValueChange={(val) =>
                              updateHoursForDay(entry.dayOfWeek, "openTime", val)
                            }
                          >
                            <SelectTrigger
                              className={`h-9 text-sm ${entry.closed ? "opacity-40" : ""}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {businessTimes.map((t: BusinessTimeType, i: number) => (
                                <SelectItem key={i} value={t.name}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1">
                          <Select
                            disabled={isPending || entry.closed}
                            value={entry.closeTime}
                            onValueChange={(val) =>
                              updateHoursForDay(entry.dayOfWeek, "closeTime", val)
                            }
                          >
                            <SelectTrigger
                              className={`h-9 text-sm ${entry.closed ? "opacity-40" : ""}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {businessTimes.map((t: BusinessTimeType, i: number) => (
                                <SelectItem key={i} value={t.name}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending || !businessId}
                className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md shadow-primary/20"
              >
                {isPending ? (
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Complete Setup
                    <CheckIcon className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3" />
          Secured with end-to-end encryption
        </p>
      </motion.div>
    </div>
  );
}
