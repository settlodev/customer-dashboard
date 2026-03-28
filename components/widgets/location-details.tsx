"use client";

import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Building2,
  Edit,
  Store,
  Building,
  Users,
  Globe,
  Sparkles,
  Plus,
} from "lucide-react";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { LocationCodeDisplay } from "@/components/widgets/location-code-display";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Location } from "@/types/location/type";
import { LocationSchema } from "@/types/location/schema";
import { LocationForm } from "@/components/forms/location_form";

interface LocationDetailClientProps {
  location: Location;
}

export function LocationDetailClient({ location }: LocationDetailClientProps) {
  const formatTime = (time: string) => {
    if (!time) return "N/A";
    return time.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case "OK":
        return { text: "ACTIVE", variant: "default" as const };
      case "DUE":
        return { text: "PAYMENT DUE", variant: "destructive" as const };
      case "ALMOST_DUE":
        return { text: "RENEWAL SOON", variant: "secondary" as const };
      case "SUSPENDED":
        return { text: "SUSPENDED", variant: "outline" as const };
      default:
        return { text: status, variant: "secondary" as const };
    }
  };

  const statusBadge = getSubscriptionStatusBadge(location.active ? "OK" : "SUSPENDED");

  const subscriptionProgress = 0;

  const breadcrumbItems = [
    { title: "Locations", link: "/locations" },
    { title: location.name, link: "#" },
  ];

  const handleAddLocation = (values: z.infer<typeof LocationSchema>) => {
    // The form's internal submitData handles createLocation + redirect.
    // This prop satisfies the required onSubmit signature.
    console.log("New location submitted:", values);
  };

  return (
    <div className="flex-1 space-y-6 px-4 sm:px-6 lg:px-8 pt-6 mt-16">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <BreadcrumbsNav items={breadcrumbItems} />
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-2xl border">
              <Store className="w-8 h-8 text-gray-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {location.name}
              </h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4" />
                {location.businessName}
                <span className="text-gray-400">•</span>
                <span className="capitalize">
                  {location.businessName?.toLowerCase()}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Add Location — opens LocationForm in create mode */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-gray-100 rounded-lg border">
                    <Store className="w-5 h-5 text-gray-700" />
                  </div>
                  Add New Location
                </DialogTitle>
              </DialogHeader>

              {/* item={null} → form renders in create mode */}
              <LocationForm
                item={null}
                onSubmit={handleAddLocation}
                businessId={location.businessId ?? null}
              />
            </DialogContent>
          </Dialog>

          {/* Edit current location */}
          <Button
            asChild
            variant="default"
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Link href={`/locations/${location.id}`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Location
            </Link>
          </Button>
        </div>
      </div>

      {/* Subscription Status Banner */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg border">
                <Sparkles className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h3 className="font-semibold">Subscription Status</h3>
                <p className="text-sm text-muted-foreground">
                  {statusBadge.text === "ACTIVE"
                    ? "Your subscription is active and in good standing"
                    : statusBadge.text === "PAYMENT DUE"
                      ? "Action required: Payment is due for your subscription"
                      : statusBadge.text === "RENEWAL SOON"
                        ? "Your subscription will renew soon"
                        : "Your subscription has been suspended"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={statusBadge.variant}
                className="text-sm px-3 py-1"
              >
                {statusBadge.text}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {location.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Column 1 */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Information */}
          <Card className="group hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-gray-100 rounded-lg border">
                  <Building className="w-4 h-4 text-gray-700" />
                </div>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <Phone className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span
                  className={
                    location.phoneNumber ? "font-medium" : "text-muted-foreground"
                  }
                >
                  {location.phoneNumber || "Not provided"}
                </span>
              </div>

              {location.email && location.email !== "null" && (
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <Mail className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <span className="font-medium">{location.email}</span>
                </div>
              )}

              {(location.address ||
                location.region) && (
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
                  <div className="space-y-1 capitalize">
                    {location.address && (
                      <div className="font-medium">{location.address}</div>
                    )}
                    {location.region && (
                      <div className="text-sm text-muted-foreground">
                        {location.region}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="font-medium">
                  {location.timezone || "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card className="group hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-gray-100 rounded-lg border">
                  <Users className="w-4 h-4 text-gray-700" />
                </div>
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <div className="flex items-center gap-2 p-2 rounded-lg border">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {formatDate(location.createdAt)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Business Type
                </label>
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50">
                  <Globe className="w-4 h-4 text-gray-600" />
                  <span className="font-medium capitalize">
                    {location.businessName?.toLowerCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Subscription & Location Code */}
        <div className="space-y-6 lg:col-span-1 xl:col-span-2">
          {/* Subscription Overview */}
          <Card className="group hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-gray-100 rounded-lg border">
                  <Calendar className="w-4 h-4 text-gray-700" />
                </div>
                Subscription Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg border bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-2xl font-bold text-gray-700 mb-2">
                    {statusBadge.text === "ACTIVE"
                      ? "✅"
                      : statusBadge.text === "PAYMENT DUE"
                        ? "⚠️"
                        : statusBadge.text === "RENEWAL SOON"
                          ? "🔔"
                          : "❌"}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Current Status
                  </div>
                  <div className="text-lg font-bold mt-1">
                    {statusBadge.text}
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg border bg-gray-50 dark:bg-gray-800/50">
                  <Calendar className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <div className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </div>
                  <div className="text-lg font-bold mt-1">
                    {formatDate(location.createdAt)}
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg border bg-gray-50 dark:bg-gray-800/50">
                  <Clock className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <div className="text-sm font-medium text-muted-foreground">
                    End Date
                  </div>
                  <div className="text-lg font-bold mt-1">
                    N/A
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subscription Progress
                  </span>
                  <span className="font-medium">{subscriptionProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-gray-700 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, subscriptionProgress))}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Authentication */}
          <Card className="group hover:shadow-md transition-all duration-300">
            <CardContent className="pt-2">
              <LocationCodeDisplay />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
