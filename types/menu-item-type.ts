import {ReactNode} from "react";

export declare interface MenuItemArgType {
    isCurrentItem: boolean | false
}
export declare interface menuItemType {
    label: string,
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
