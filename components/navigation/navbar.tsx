"use client"

import React, {useState} from "react";
import {Session} from "next-auth";
import Header from "@/components/navigation/index";
interface Props {
  children: React.ReactNode;
  data: Session|null
}

export const NavbarWrapper = ({children}: Props) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            {children}
        </div>
    );
};
