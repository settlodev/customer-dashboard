import {Business} from "@/types/business/type";
import {Location} from "@/types/location/type";

export declare interface BusinessPropsType {
    business: Business,
    businessList: Business[],
    locationList: Location[],
    currentLocation: Location,
}
