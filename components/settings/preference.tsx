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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">General</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure your location and general application settings
        </p>
      </div>

      <LocationSettingsForm item={locationSettings} />
    </div>
  );
};

export default PreferenceSettings;
