"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;

  subtitle?: string;
  formatter?: (value: number) => string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  formatter,
}) => {
  const displayValue =
    typeof value === "number" && formatter ? formatter(value) : value;

  return (
    <Card
      className={`relative overflow-hidden  hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
              {title}
            </p>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="mt-1 text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                    {displayValue}
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  <p className="text-sm">{displayValue}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {subtitle && (
              <p className="mt-1 text-[11px] sm:text-xs text-gray-500 truncate">
                {subtitle}
              </p>
            )}
          </div>

          <div className={`flex-shrink-0 p-2 sm:p-2.5 rounded-lg ring-1 `}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
