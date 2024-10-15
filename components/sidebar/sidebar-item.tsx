import NextLink from "next/link";
import React from "react";
import { useSidebarContext } from "../layouts/layout-context";
import clsx from "clsx";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string;
}

export const SidebarItem = ({ icon, title, isActive, href = "" }: Props) => {
  const {setCollapsed } = useSidebarContext();

  const handleClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed();
    }
  };
  return (
    <NextLink
      href={href}
      className="text-default-900 active:bg-none max-w-full max-h-5">
      <div
        className={clsx(
          isActive
            ? "rounded-md px-0 [&_svg_path]:fill-emerald-400 font-bold"
            : "hover:text-emerald-400",
          "flex gap-2 w-full min-h-[44px] h-full items-center px-1.0 cursor-pointer transition-all duration-150 active:scale-[0.98]"
        )}
        onClick={handleClick}>
        {icon}
        <span className={clsx(isActive?"text-emerald-500 font-medium": "hover:text-emerald-500 text-default-900 text-sm")}>{title}</span>
      </div>
    </NextLink>
  );
};
