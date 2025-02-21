"use client"

import React, {useState} from "react";
import {Session} from "next-auth";
import Header from "@/components/navigation/header";

interface Props {
    children: React.ReactNode;
    session: Session | null;
}

export const NavbarWrapper = ({children, session}: Props) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="fixed top-0 z-[55] w-full lg:w-[85%] ">

            <Header
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                session={session}
            />
            </div>
            {children}
        </div>
    );
};
