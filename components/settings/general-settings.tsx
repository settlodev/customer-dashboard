import LocationSettingsForm from "../forms/location_settings_form";
import { LocationSettings } from "@/types/settings/type";

const GeneralSettings = ({
  locationSettings,
}: {
  locationSettings: LocationSettings | null | undefined;
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          General
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Passcodes, settlement amounts, and system configuration
        </p>
      </div>

      <LocationSettingsForm
        item={locationSettings}
        categories={["basic", "system"]}
      />
    </div>
  );
};

export default GeneralSettings;
