"use client";

import React, { useState } from "react";
import { CompaniesDropdown } from "./companies-dropdown";
import { BusinessPropsType } from "@/types/business/business-props-type";
import { menuItems } from "@/types/menu_items";
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
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger
} from "@/components/ui/sheet";

interface SidebarProps {
    data: BusinessPropsType;
    isMobile?: boolean;
    onClose?: () => void;
}

const SidebarContent = ({ data, isMobile, onClose }: SidebarProps) => {
    const [visibleIndex, setVisibleIndex] = useState<number>(0);
    const myMenuItems = menuItems();

    const getIcon = (iconName: string) => {
        const size = 20;
        const color = '#A3FFD6';
        const icons = {
            dashboard: <ChartNoAxesColumn size={size} color={color} />,
            inventory: <Package2 size={size} color={color} />,
            sales: <ReceiptText size={size} color={color} />,
            customers: <ContactIcon size={size} color={color} />,
            users: <UsersIcon size={size} color={color} />,
            general: <Info size={size} color={color} />,
        };

        return icons[iconName as keyof typeof icons] || <Info size={size} color={color} />;
    };

    const { business } = data;

    if (!business) return null;

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-gray-700 p-4">
                <CompaniesDropdown data={data}/>
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
                                    {section.items.map((item, index) => (
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
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="border-t border-gray-700 p-4">
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center rounded-lg px-2 py-1.5",
                        "text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200",
                        "transition-colors duration-200"
                    )}
                >
                    <Settings className="mr-2 h-4 w-4"/>
                    <span>Settings</span>
                </Link>

                <p className="mt-4 text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Settlo Technologies Ltd
                </p>
            </div>
        </div>
    );
};

export const SidebarWrapper = ({ data }: { data: BusinessPropsType }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block left-0 top-0 h-screen w-75 bg-gray-800">
                <SidebarContent data={data} />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="fixed top-4 left-4 z-40 lg:hidden"
                    >
                        <ChartNoAxesColumn className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 bg-gray-800">
                    <SidebarContent
                        data={data}
                        isMobile={true}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </SheetContent>
            </Sheet>
        </>
    );
};
