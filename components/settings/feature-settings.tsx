import LocationSettingsForm from "../forms/location_settings_form";
import { LocationSettings } from "@/types/settings/type";

const FeatureSettings = ({
  locationSettings,
}: {
  locationSettings: LocationSettings | null | undefined;
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Features
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Enable or disable features like ecommerce, recipes, departments, and
          POS options
        </p>
      </div>

      <LocationSettingsForm
        item={locationSettings}
        categories={["feature"]}
      />
    </div>
  );
};

export default FeatureSettings;
