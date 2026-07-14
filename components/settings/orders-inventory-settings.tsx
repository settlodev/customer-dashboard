import LocationSettingsForm from "../forms/location_settings_form";
import { LocationSettings } from "@/types/settings/type";

const OrdersInventorySettings = ({
  locationSettings,
}: {
  locationSettings: LocationSettings | null | undefined;
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Orders & Inventory
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Order automation, tipping, and stock deduction rules
        </p>
      </div>

      <LocationSettingsForm
        item={locationSettings}
        categories={["order", "inventory"]}
      />
    </div>
  );
};

export default OrdersInventorySettings;
