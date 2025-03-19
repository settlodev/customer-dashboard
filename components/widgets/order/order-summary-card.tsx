'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define trend types
type TrendType = 'up' | 'down' | 'neutral';

// Define props for the metric card
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorTheme: 'blue' | 'green' | 'emerald' | 'purple' | 'orange' | 'red' | 'yellow' | 'gray';
  subtitle?: string;
  formatter?: (value: number) => string;
  trend?: TrendType;
  showTooltip?: boolean;
}

// Icon colors mapping
const ICON_COLORS = {
  blue: 'text-white bg-blue-500',
  green: 'text-white bg-green-500',
  emerald: 'text-white bg-emerald-500',
  purple: 'text-white bg-purple-500',
  orange: 'text-white bg-orange-500',
  red: 'text-white bg-red-500',
  yellow: 'text-white bg-yellow-500',
  gray: 'text-white bg-gray-500'
};


const CARD_COLORS = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 border-l-4 border-l-blue-400',
    green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 border-l-4 border-l-green-400',
    emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 border-l-4 border-l-emerald-400',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 border-l-4 border-l-purple-400',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 border-l-4 border-l-orange-400',
    red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 border-l-4 border-l-red-400',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 border-l-4 border-l-yellow-400',
    gray: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 border-l-4 border-l-gray-400'
  };
  

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  colorTheme,
  subtitle,
  formatter,
  trend = 'neutral',
  showTooltip = false
}) => {
  // Format value if formatter is provided and value is a number
  const displayValue = typeof value === 'number' && formatter 
    ? formatter(value) 
    : value;

  const valueDisplay = (
    <h3 className={`text-xl font-bold truncate md:text-2xl ${showTooltip ? 'cursor-pointer' : ''}`}>
      {displayValue}
    </h3>
  );

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS[colorTheme]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-2 min-w-0">
            <div className={`${ICON_COLORS[colorTheme]} p-2 rounded-lg flex-shrink-0`}>
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
              
              {showTooltip ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {valueDisplay}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{displayValue}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                valueDisplay
              )}
              
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            {trend === 'up' && <TrendingUp className="text-green-500" size={20} />}
            {trend === 'down' && <TrendingDown className="text-red-500" size={20} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;