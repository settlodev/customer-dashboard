"use client";

import React, { useState, useEffect } from "react";
import { BusinessSwitcher } from "./business-switcher";
import { BusinessPropsType } from "@/types/business/business-props-type";
import { menuItems} from "@/types/menu_items";
import Link from "next/link";
import {
    UserCog,
    Users,
    LayoutDashboard,
    Boxes,
    ShoppingBag,
    Sliders,
    Settings,
    ChevronDown,
    X,
    CreditCard,
    AlertTriangle,
    Warehouse,
    Clock,
    ShieldAlert,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";

import VersionDisplay from "../widgets/versioning";
import { UrlObject } from "url";
import { MenuType } from "@/types/menu-item-type";
import { useSubscription } from "@/context/subscriptionContext";
import { useEntitlements } from "@/context/entitlementContext";
import { MENU_FEATURE_MAP } from "@/config/menu-feature-map";

interface SidebarProps {
    data: BusinessPropsType;
    isMobile?: boolean;
    onClose?: () => void;
    menuType?: MenuType;
}

interface MenuItem {
    link: string | UrlObject;
    title: string;
    id?: string;
}

const SubscriptionBanner = () => {
    const { status, isTrial, isPastDue, isExpired, isSuspended } = useSubscription();

    if (!status || status === "ACTIVE") return null;

    if (isSuspended) {
        return (
            <div className="mx-3 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">Suspended</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">
                    Your subscription has been suspended. Contact support to reactivate.
                </p>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="mx-3 mt-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Expired</span>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                    Your subscription has expired. Renew to make changes.
                </p>
                <Link href="/renew-subscription" className="text-xs text-primary hover:underline mt-1 inline-block">
                    Renew now
                </Link>
            </div>
        );
    }

    if (isPastDue) {
        return (
            <div className="mx-3 mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Payment Overdue</span>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Your payment is overdue. Please update billing to avoid interruption.
                </p>
                <Link href="/renew-subscription" className="text-xs text-primary hover:underline mt-1 inline-block">
                    Update billing
                </Link>
            </div>
        );
    }

    if (isTrial) {
        return (
            <div className="mx-3 mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Free Trial</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                    You are on a free trial. Subscribe to keep access.
                </p>
                <Link href="/renew-subscription" className="text-xs text-primary hover:underline mt-1 inline-block">
                    View plans
                </Link>
            </div>
        );
    }

    return null;
};

const SidebarContent = ({ data, isMobile, onClose, menuType = 'normal' }: SidebarProps) => {
    const pathname = usePathname();
    const [visibleIndex, setVisibleIndex] = useState<number>(-1);
    const { isActive, isSuspended } = useSubscription();
    const { hasFeature, entitlements } = useEntitlements();

    // Subscription is considered inactive when EXPIRED (read-only) or SUSPENDED (locked)
    const isSubscriptionInactive = isSuspended;

    // Get menu items — pass null for subscription since we no longer use
    // the old ActiveSubscription object for menu filtering
    const myMenuItems = menuItems({
        subscription: null,
        menuType,
        isCurrentItem: false
    });

    // Auto-expand the section that contains the current page (only on navigation)
    const prevPathRef = React.useRef(pathname);
    useEffect(() => {
        if (prevPathRef.current === pathname) return;
        prevPathRef.current = pathname;
        const activeIndex = myMenuItems.findIndex((section) =>
            section.items.some(
                (item: MenuItem) => pathname === item.link || pathname.startsWith(item.link + "/")
            )
        );
        if (activeIndex !== -1) {
            setVisibleIndex(activeIndex);
        }
    }, [pathname, myMenuItems]);

    // Set initial open section on first load
    useEffect(() => {
        const activeIndex = myMenuItems.findIndex((section) =>
            section.items.some(
                (item: MenuItem) => pathname === item.link || pathname.startsWith(item.link + "/")
            )
        );
        if (activeIndex !== -1) {
            setVisibleIndex(activeIndex);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getIcon = (iconName: string) => {
        const size = 20;
        const color = '#EB7F44';
        const icons = {
            dashboard: <LayoutDashboard size={size} color={color} />,
            inventory: <Boxes size={size} color={color} />,
            stock: <Warehouse size={size} color={color} />,
            sales: <ShoppingBag size={size} color={color} />,
            customers: <Users size={size} color={color} />,
            users: <UserCog size={size} color={color} />,
            general: <Sliders size={size} color={color} />,
        };

        return icons[iconName as keyof typeof icons] || <Sliders size={size} color={color} />;
    };

    const { business } = data;

    if (!business) return null;

    const menuTypeLabel = menuType === 'warehouse' ? 'Warehouse' : 'Location';

    // Current entity ID for feature checks
    const currentEntityId = menuType === 'warehouse'
        ? data.warehouse?.id
        : data.currentLocation?.id;

    // Check if a menu item link requires a feature the current entity doesn't have
    const isItemLocked = (link: string): boolean => {
        if (!currentEntityId || !entitlements) return false;
        const featureKey = MENU_FEATURE_MAP[link];
        if (!featureKey) return false;
        return !hasFeature(currentEntityId, featureKey);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-2 py-2">
                <div className="flex items-center flex-1 min-w-0">
                    <BusinessSwitcher
                        currentBusiness={business}
                        businessList={data.businessList || []}
                    />
                </div>
                {isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="lg:hidden text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Subscription status banner (from JWT, no API call) */}
            <SubscriptionBanner />

            <div className="flex-1 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {isSubscriptionInactive ? (
                    <div className="p-4">
                        <div className="text-center mb-6">
                            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Account Suspended
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Your subscription has been suspended. Please contact billing support to reactivate your account.
                            </p>
                        </div>
                    </div>
                )
                : myMenuItems.length === 0 ? (
                    <div className="p-4 text-center">
                        <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                            No menu items available for your {menuTypeLabel.toLowerCase()} subscription
                        </p>
                        <Link
                            href="/renew-subscription"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                        >
                            Upgrade your plan
                        </Link>
                    </div>
                ) : (
                    <nav className="flex-1 space-y-1 px-3 py-4">
                        {myMenuItems.map((section, sectionIndex) => {
                            const sectionHasActive = section.items.some(
                                (item: MenuItem) => pathname === item.link || pathname.startsWith(item.link + "/")
                            );
                            return (
                            <div key={sectionIndex} className="py-1">
                                <button
                                    onClick={() => setVisibleIndex(visibleIndex === sectionIndex ? -1 : sectionIndex)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg p-2",
                                        "text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800",
                                        "transition-colors duration-200",
                                        sectionHasActive && "border-l-2 border-primary rounded-l-none text-gray-900 dark:text-white font-semibold"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <span className="text-xs">{getIcon(section.icon)}</span>
                                        <span className="ml-2 text-sm font-medium">{section.label}</span>
                                        {section.items.length === 0 && (
                                            <span className="ml-2 text-xs text-yellow-400">(Limited)</span>
                                        )}
                                    </div>
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 text-gray-400 transition-transform duration-200",
                                            visibleIndex === sectionIndex && "rotate-180"
                                        )}
                                    />
                                </button>

                                {visibleIndex === sectionIndex && (
                                    <div className="mt-1 space-y-0.5">
                                        {section.items.length === 0 ? (
                                            <div className="px-2 py-1.5 pl-10">
                                                <p className="text-xs text-gray-500">
                                                    No features available in your plan
                                                </p>
                                                <Link
                                                    href="/renew-subscription"
                                                    className="text-primary hover:text-primary/80 text-xs underline"
                                                >
                                                    Upgrade to unlock
                                                </Link>
                                            </div>
                                        ) : (
                                            section.items.map((item: MenuItem, _index: React.Key | null | undefined) => {
                                                const isItemActive = pathname === item.link || pathname.startsWith(item.link + "/");
                                                const locked = isItemLocked(String(item.link));
                                                return (
                                                <Link
                                                    key={item.title}
                                                    href={item.link}
                                                    onClick={isMobile ? onClose : undefined}
                                                    className={cn(
                                                        "flex w-full items-center justify-between rounded-lg px-2 py-1.5 pl-10",
                                                        "text-sm transition-colors duration-200",
                                                        isItemActive
                                                            ? "bg-primary/10 text-primary font-medium dark:bg-primary/20"
                                                            : locked
                                                                ? "text-gray-400 dark:text-gray-500 hover:bg-gray-200/60 dark:hover:bg-gray-800"
                                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                                                    )}
                                                >
                                                    <span>{item.title}</span>
                                                    {locked && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-400">
                                                            PRO
                                                        </span>
                                                    )}
                                                </Link>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </nav>
                )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {menuTypeLabel === 'Location' && (
    <>
        <Link
            href="/renew-subscription"
            onClick={isMobile ? onClose : undefined}
            className={cn(
                "flex items-center rounded-lg px-2 py-1.5",
                "text-sm transition-colors duration-200",
                pathname === "/renew-subscription"
                    ? "bg-primary/10 text-primary font-medium dark:bg-primary/20"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200"
            )}
        >
            <CreditCard className="mr-2 h-4 w-4"/>
            <span>Billing</span>
        </Link>

    </>
)}
      {!isSubscriptionInactive && menuTypeLabel === 'Location' && (
        <Link
            href="/settings"
            onClick={isMobile ? onClose : undefined}
            className={cn(
                "flex items-center rounded-lg px-2 py-1.5",
                "text-sm transition-colors duration-200",
                pathname === "/settings" || pathname.startsWith("/settings/")
                    ? "bg-primary/10 text-primary font-medium dark:bg-primary/20"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200"
            )}
        >
            <Settings className="mr-2 h-4 w-4"/>
            <span>Settings</span>
        </Link>)
}

                <VersionDisplay />

                <p className="mt-2 text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Settlo Technologies Ltd
                </p>
            </div>
        </div>
    );
};

export const MobileSidebar = ({ data, menuType = 'normal', isOpen, onOpenChange }: {
    data: BusinessPropsType;
    menuType?: MenuType;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-64 p-0 bg-gray-50 dark:bg-gray-900">
                <SidebarContent
                    data={data}
                    isMobile={true}
                    onClose={() => onOpenChange(false)}
                    menuType={menuType}
                />
            </SheetContent>
        </Sheet>
    );
};

export const SidebarWrapper = ({ data, menuType = 'normal' }: { data: BusinessPropsType, menuType?: MenuType }) => {
    return (
        <aside className="hidden lg:flex lg:flex-col mt-2 mb-3 ml-3 mr-3 h-[calc(100vh-20px)] w-[18rem] flex-shrink-0 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <SidebarContent data={data} menuType={menuType} />
        </aside>
    );
};
