"use client";

import React, { useState, useEffect } from "react";
import { CompaniesDropdown } from "./companies-dropdown";
import { BusinessPropsType } from "@/types/business/business-props-type";
import { menuItems} from "@/types/menu_items";
import Link from "next/link";
import {
    UsersIcon,
    Contact as ContactIcon,
    BarChart3 as ChartNoAxesColumn,
    Package2,
    Info,
    ReceiptText,
    Settings,
    ChevronDown,
    X,
    CreditCard,
    MenuIcon,
    AlertTriangle,
    Warehouse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger
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

const SidebarContent = ({ data, isMobile, onClose, menuType = 'normal' }: SidebarProps) => {
    const [visibleIndex, setVisibleIndex] = useState<number>(0);
    const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);

    // Fetch subscription based on menu type
    useEffect(() => {
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
                
                setSubscription(activeSubscription);
            } catch (err) {
                console.error(`Failed to fetch ${menuType} subscription:`, err);
                setError('Failed to load subscription data');
                setSubscription(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscription();
    }, [menuType]); // Re-run when menuType changes

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

    const getIcon = (iconName: string) => {
        const size = 20;
        const color = '#A3FFD6';
        const icons = {
            dashboard: <ChartNoAxesColumn size={size} color={color} />,
            inventory: <Package2 size={size} color={color} />,
            stock: <Warehouse size={size} color={color} />,
            sales: <ReceiptText size={size} color={color} />,
            customers: <ContactIcon size={size} color={color} />,
            users: <UsersIcon size={size} color={color} />,
            general: <Info size={size} color={color} />,
        };

        return icons[iconName as keyof typeof icons] || <Info size={size} color={color} />;
    };

    const { business } = data;

    if (!business) return null;

    // Added menu type indicator for UX clarity
    const menuTypeLabel = menuType === 'warehouse' ? 'Warehouse' : 'Location';

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-gray-700 p-4">
                <div className="flex items-center">
                    <CompaniesDropdown data={data}/>
                    <span className="ml-2 text-xs px-2 py-1 bg-gray-700 rounded-md text-gray-200">
                        {menuTypeLabel}
                    </span>
                </div>
                {isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="lg:hidden text-gray-400 hover:text-gray-100"
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
                            <h3 className="text-lg font-semibold text-white mb-2">
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
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {myMenuItems.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="py-2">
                                <button
                                    onClick={() => setVisibleIndex(visibleIndex === sectionIndex ? -1 : sectionIndex)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg p-2",
                                        "text-gray-100 hover:bg-gray-700",
                                        "transition-colors duration-200"
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
                                            "h-4 w-4 transition-transform duration-200",
                                            visibleIndex === sectionIndex && "rotate-180"
                                        )}
                                    />
                                </button>

                                {visibleIndex === sectionIndex && (
                                    <div className="mt-2 space-y-1">
                                        {section.items.length === 0 ? (
                                            <div className="px-2 py-1.5 pl-10">
                                                <p className="text-xs text-gray-500">
                                                    No features available in your plan
                                                </p>
                                                <Link
                                                    href="/renew-subscription"
                                                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                                                >
                                                    Upgrade to unlock
                                                </Link>
                                            </div>
                                        ) : (
                                            section.items.map((item: { link: string | UrlObject; title: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; }, index: React.Key | null | undefined) => (
                                                <Link
                                                    key={index}
                                                    href={item.link}
                                                    onClick={isMobile ? onClose : undefined}
                                                    className={cn(
                                                        "block w-full rounded-lg px-2 py-1.5 pl-10",
                                                        "text-sm text-gray-200 hover:bg-gray-700",
                                                        "transition-colors duration-200"
                                                    )}
                                                >
                                                    {item.title}
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                )}
            </div>

            <div className="border-t border-gray-700 p-4">
                
                <Link
                    href="/renew-subscription"
                    onClick={isMobile ? onClose : undefined}
                    className={cn(
                        "flex items-center rounded-lg px-2 py-1.5",
                        "text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200",
                        "transition-colors duration-200"
                    )}
                >
                    <CreditCard className="mr-2 h-4 w-4"/>
                    <span>Billing</span>
                </Link>
                
                {/* Only show settings if subscription is active */}
                {!isSubscriptionInactive && (
                    <Link
                        href="/settings"
                        onClick={isMobile ? onClose : undefined}
                        className={cn(
                            "flex items-center rounded-lg px-2 py-1.5",
                            "text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200",
                            "transition-colors duration-200"
                        )}
                    >
                        <Settings className="mr-2 h-4 w-4"/>
                        <span>Settings</span>
                    </Link>
                )}

                <VersionDisplay />

                <p className="mt-2 text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Settlo Technologies Ltd
                </p>
            </div>
        </div>
    );
};

export const SidebarWrapper = ({ data, menuType = 'normal' }: { data: BusinessPropsType, menuType?: MenuType }) => {

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block left-0 top-0 h-screen w-80 bg-gray-800">
                <SidebarContent data={data} menuType={menuType} />
            </aside>

            {/* Mobile Sidebar */}
           <div className="fixed top-0 z-[60] p-4 lg:hidden">
           <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="fixed top-4 left-4 z-40 lg:hidden"
                    >
                        <MenuIcon className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 bg-gray-800">
                    <SidebarContent
                        data={data}
                        isMobile={true}
                        onClose={() => setIsSidebarOpen(false)}
                        menuType={menuType}
                    />
                </SheetContent>
            </Sheet>
           </div>
        </>
    );
};