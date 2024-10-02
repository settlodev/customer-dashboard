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
  const { collapsed, setCollapsed } = useSidebarContext();

  const handleClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed();
    }
  };
  return (
    <NextLink
      href={href}
      className="text-default-900 active:bg-none max-w-full max-h-10">
      <div
        className={clsx(
          isActive
            ? "bg-emerald-50 rounded-md px-1.5 [&_svg_path]:fill-emerald-500"
            : "hover:bg-default-100",
          "flex gap-2 w-full min-h-[44px] h-full items-center px-1.0 cursor-pointer border-b-1 border-b-gray-100 transition-all duration-150 active:scale-[0.98]"
        )}
        onClick={handleClick}>
        {icon}
        <span className="text-default-900 text-sm">{title}</span>
      </div>
    </NextLink>
  );
};