import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { MapPin } from "lucide-react";
import LocationSettingsForm from "../forms/location_settings_form";
import { LocationSettings } from "@/types/settings/type";

const PreferenceSettings = ({
  locationSettings,
}: {
  locationSettings: LocationSettings | null | undefined;
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">General</h2>
        <p className="text-muted-foreground mt-1">
          Configure your location and general application settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            <CardTitle>Location Settings</CardTitle>
          </div>
          <CardDescription>
            Manage your location preferences and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationSettingsForm item={locationSettings} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PreferenceSettings;
