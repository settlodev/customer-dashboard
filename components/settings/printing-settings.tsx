import LocationSettingsForm from "../forms/location_settings_form";
import { LocationSettings } from "@/types/settings/type";

const PrintingSettings = ({
  locationSettings,
}: {
  locationSettings: LocationSettings | null | undefined;
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Printing & Receipts
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure ticket printing, receipt images, and payment details on
          receipts
        </p>
      </div>

      <LocationSettingsForm
        item={locationSettings}
        categories={["printing", "receipt"]}
      />
    </div>
  );
};

export default PrintingSettings;
