import {ReactNode} from "react";
import { ActiveSubscription } from "./subscription/type";

export declare interface MenuItemArgType {
    isCurrentItem: boolean | false,
    menuType?: MenuType;
}

export type MenuType = 'normal' | 'warehouse';
export declare interface menuItemType {
    label: string,
    icon: ReactNode,
    current: boolean | false,
    showSeparator: boolean | false,
    items: menuItem[],
}
export declare interface menuItem {
    title: string,
    link: string,
    icon: ReactNode,
    current: boolean | false,
}
