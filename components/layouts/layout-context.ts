"use client";

export const SidebarContext = ({
  collapsed: false,
  setCollapsed: () => {},
})

export const useSidebarContext = () => {
  return SidebarContext;
};
