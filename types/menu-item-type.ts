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
    /** When false, location-wide report nav items are filtered out (read_own users). Default true. */
    reportsReadAll?: boolean;
    /**
     * Whether the account has at least one PACKAGING-material stock variant.
     * Surfaces the "Packaging report" nav link when true. Unlike the other
     * gates here, this defaults to FALSE (hidden) when unset — most accounts
     * don't stock packaging materials, and `hasPackagingStock()` already
     * fails closed (returns false) on error, so there's no loading state to
     * protect by defaulting open.
     */
    hasPackaging?: boolean;
    /**
     * Active store id when operating in store mode. Used to deep-link the
     * "Store profile" entry to the active store's detail page. Ignored in
     * the normal / warehouse menus.
     */
    currentStoreId?: string;
}

export type MenuType = 'normal' | 'warehouse' | 'store';
export declare interface menuItemType {
    label: string,
    icon: ReactNode,
    current: boolean | false,
    showSeparator: boolean | false,
    items: menuItem[],
    /**
     * Optional permission key(s) gating this whole section. When set, the
     * section is hidden unless the current user holds (any of) the key(s).
     * Fail-open: while permissions are still loading the section is shown
     * (the backend @PreAuthorize is the real gate — this is UX only).
     */
    permission?: string;
    permissions?: string[];
}
export declare interface menuItem {
    title: string,
    link: string,
    icon: ReactNode,
    current: boolean | false,
    /**
     * Optional permission key(s) gating this nav item. When set, the item is
     * hidden unless the current user holds (any of) the key(s). Fail-open
     * while permissions load — the backend @PreAuthorize remains the real
     * security gate; this only declutters the nav for limited members.
     */
    permission?: string;
    permissions?: string[];
}
