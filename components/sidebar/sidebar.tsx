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
    Warehouse,
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

    const myMenuItems = menuItems({
        menuType,
        isCurrentItem: false,
        hasMultipleDestinations: data.hasMultipleDestinations,
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


            <div className="flex-1 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                                    {section.items.map((item: MenuItem) => {
                                        const isItemActive = pathname === item.link || pathname.startsWith(item.link + "/");
                                        return (
                                        <Link
                                            key={item.title}
                                            href={item.link}
                                            onClick={isMobile ? onClose : undefined}
                                            className={cn(
                                                "flex w-full items-center rounded-lg px-2 py-1.5 pl-10",
                                                "text-sm transition-colors duration-200",
                                                isItemActive
                                                    ? "bg-primary/10 text-primary font-medium dark:bg-primary/20"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                                            )}
                                        >
                                            <span>{item.title}</span>
                                        </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        );
                    })}
                </nav>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {menuTypeLabel === 'Location' && (
    <>
        <Link
            href="/billing"
            onClick={isMobile ? onClose : undefined}
            className={cn(
                "flex items-center rounded-lg px-2 py-1.5",
                "text-sm transition-colors duration-200",
                pathname === "/billing"
                    ? "bg-primary/10 text-primary font-medium dark:bg-primary/20"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200"
            )}
        >
            <CreditCard className="mr-2 h-4 w-4"/>
            <span>Billing</span>
        </Link>

    </>
)}
      {menuTypeLabel === 'Location' && (
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
