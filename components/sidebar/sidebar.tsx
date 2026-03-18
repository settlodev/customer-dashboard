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
    Warehouse
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";

import VersionDisplay from "../widgets/versioning";
import { ActiveSubscription } from "@/types/subscription/type";
import { getActiveSubscription } from "@/lib/actions/subscriptions";
import { UrlObject } from "url";
import { MenuType } from "@/types/menu-item-type";
import { getActiveSubscriptionForWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";

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

const SidebarContent = ({ data, isMobile, onClose, menuType = 'normal' }: SidebarProps) => {
    const pathname = usePathname();
    const [visibleIndex, setVisibleIndex] = useState<number>(-1);
    const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);

    // Fetch subscription based on menu type
    useEffect(() => {
        let isMounted = true;
        const fetchSubscription = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                let activeSubscription: ActiveSubscription | null = null;
                
                if (menuType === 'warehouse') {
                    activeSubscription = await getActiveSubscriptionForWarehouse();
                } else {
                    // Default to normal/location subscription
                    activeSubscription = await getActiveSubscription();
                }
                
                if (isMounted) {
                    setSubscription(activeSubscription);
                }
            } catch (_err) {
               
                if (isMounted) {
                    setError('Failed to load subscription data');
                    setSubscription(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchSubscription();
        return () => {
            isMounted = false;
        };
    }, [menuType]); 

    //Check if subscription is expired, null, or empty
    const isSubscriptionInactive = !subscription || 
                                   subscription.subscriptionStatus === 'EXPIRED' || 
                                   
                                   subscription.subscriptionStatus === null || 
                                   subscription.subscriptionStatus === '';
    
    // Get filtered menu items based on subscription
    const myMenuItems = menuItems({
        subscription,
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

    // Added menu type indicator for UX clarity
    const menuTypeLabel = menuType === 'warehouse' ? 'Warehouse' : 'Location';

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

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) 
                : isSubscriptionInactive ? (
                    // Show only subscription warning and billing link when subscription is inactive
                    <div className="p-4">
                        <div className="text-center mb-6">
                            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Subscription Required
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Your {menuTypeLabel.toLowerCase()} subscription has expired or is inactive. Please renew to access all features.
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
                    // Show full navigation when subscription is active
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
                                                const isActive = pathname === item.link || pathname.startsWith(item.link + "/");
                                                return (
                                                <Link
                                                    key={item.title}
                                                    href={item.link}
                                                    onClick={isMobile ? onClose : undefined}
                                                    className={cn(
                                                        "block w-full rounded-lg px-2 py-1.5 pl-10",
                                                        "text-sm transition-colors duration-200",
                                                        isActive
                                                            ? "bg-primary/10 text-primary font-medium dark:bg-primary/20"
                                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                                                    )}
                                                >
                                                    {item.title}
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
      {!isSubscriptionInactive  && menuTypeLabel === 'Location' &&(
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