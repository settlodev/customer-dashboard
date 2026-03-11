"use client";

import { Location } from "@/types/location/type";
import { LocationForm } from "@/components/forms/location_form";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/ui/loading";

const LocationDetailsSettings = ({
  location,
  isLoading,
}: {
  location: Location | null;
  isLoading: boolean;
}) => {
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
          Manage your location information, address, and business hours
        </p>
      </div>

      <LocationForm item={location} onSubmit={() => {}} />
    </div>
  );
};

export default LocationDetailsSettings;
