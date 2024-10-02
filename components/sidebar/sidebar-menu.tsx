import React from "react";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div className="flex gap-2 flex-col mt-2">
      <span className="text-xs font-bold border-b-1 border-b-gray-100 pb-2 pl-1">{title}</span>
      {children}
    </div>
  );
};
