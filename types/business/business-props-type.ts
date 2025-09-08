import {Business} from "@/types/business/type";
import {Location} from "@/types/location/type";
import { Warehouses } from "../warehouse/warehouse/type";

export declare interface BusinessPropsType {
    business: Business |undefined;
    businessList?: Business[];
    locationList?: Location[] | null;
    currentLocation?: Location |undefined;
    warehouse?: any |undefined;
}
