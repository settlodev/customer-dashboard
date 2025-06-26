import {Business} from "@/types/business/type";
import {Location} from "@/types/location/type";

export declare interface BusinessPropsType {
    business: Business |undefined;
    businessList?: Business[];
    locationList?: Location[] | null;
    currentLocation?: Location |undefined;
    currentWarehouse?: any |undefined;
}
