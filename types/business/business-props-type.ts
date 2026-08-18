import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";
import { Store } from "@/types/store/type";
import { Warehouses } from "../warehouse/warehouse/type";

export declare interface BusinessPropsType {
  business: Business | undefined;
  businessList?: Business[];
  locationList?: Location[] | null;
  currentLocation?: Location | undefined;
  storeList?: Store[];
  currentStore?: Store | undefined;
  warehouseList?: Warehouses[];
  warehouse?: Warehouses | undefined;
  hasMultipleDestinations?: boolean;
}
