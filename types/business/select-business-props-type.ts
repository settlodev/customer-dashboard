import {Business} from "@/types/business/type";

export declare interface SelectBusinessPropsType {
    businesses: Business[],
    selectLocation(location: Location): any
}
