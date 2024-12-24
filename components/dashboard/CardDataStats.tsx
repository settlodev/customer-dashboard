import React, { ReactNode } from "react";

interface CardDataStatsProps {
  title: string;
  total: string;
  children: ReactNode;
}

const CardDataStats: React.FC<CardDataStatsProps> = ({
  title,
  total,
  children,
}) => {
  return (
    <div className="border border-stroke rounded-lg bg-[#F7F7FD] p-3 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
        {children}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h4 className="text-[18px] font-bold text-black dark:text-white">
            {total}
          </h4>
          <span className="text-sm font-medium">{title}</span>
        </div>
      </div>
    </div>

  );
};

export default CardDataStats;
