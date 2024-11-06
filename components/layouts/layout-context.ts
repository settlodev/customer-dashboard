"use client";

import { createContext } from "react";

/*
interface SidebarContext {
  collapsed: boolean;
  setCollapsed: () => void;
}

export const SidebarContext = createContext<SidebarContext>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebarContext = () => {
  //return useContext(SidebarContext);
  return SidebarContext;
};
*/

interface SidebarContext {
  collapsed: boolean;
  setCollapsed: () => void;
}

export const SidebarContext = ({
  collapsed: false,
  setCollapsed: () => {},
})

export const useSidebarContext = () => {
  return SidebarContext;
};
