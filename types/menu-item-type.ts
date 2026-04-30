import {ReactNode} from "react";

export declare interface MenuItemArgType {
    isCurrentItem: boolean | false,
    menuType?: MenuType;
    hasMultipleDestinations?: boolean;
    /**
     * Whether the current package surfaces the Departments module
     * (DEPARTMENTS_MODULE feature). When false, the Departments inventory
     * link and Department report sidebar entries are filtered out — users
     * still hit the upgrade gate if they navigate directly.
     */
    hasDepartmentsModule?: boolean;
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
