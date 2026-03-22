"use client"

import React, {useState} from "react";
import {Session} from "next-auth";
import Header from "@/components/navigation/header";
import {MobileSidebar} from "@/components/sidebar/sidebar";
import {BusinessPropsType} from "@/types/business/business-props-type";
import {MenuType} from "@/types/menu-item-type";

interface Props {
    children: React.ReactNode;
    session: Session | null;
    businessData?: BusinessPropsType;
    menuType?: MenuType;
}

export const NavbarWrapper = ({children, session, businessData, menuType}: Props) => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="relative flex flex-col flex-1 min-w-0">
            <div className="max-w-screen-2xl mx-auto w-full flex flex-col flex-1">
                <div className="sticky top-0 z-40 px-4 pt-2 md:px-8">
                    <Header
                        session={session}
                        onMenuClick={() => setMobileSidebarOpen(true)}
                        businessData={businessData}
                    />
                </div>
                <div className="flex-1 pt-2">
                    {children}
                </div>
            </div>

            {businessData && (
                <MobileSidebar
                    data={businessData}
                    menuType={menuType}
                    isOpen={mobileSidebarOpen}
                    onOpenChange={setMobileSidebarOpen}
                />
            )}
        </div>
    );
};
