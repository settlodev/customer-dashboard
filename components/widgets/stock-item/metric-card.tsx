'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorTheme: 'blue' | 'green' | 'emerald' | 'purple' | 'orange' | 'red' | 'gray';
  subtitle?: string;
  formatter?: (value: number) => string;
}

// Icon colors mapping
const ICON_COLORS = {
  blue: 'text-blue-500 bg-blue-100 p-2 rounded-full',
  green: 'text-green-500 bg-green-100 p-2 rounded-full',
  emerald: 'text-emerald-500 bg-emerald-100 p-2 rounded-full',
  purple: 'text-purple-500 bg-purple-100 p-2 rounded-full',
  orange: 'text-orange-500 bg-orange-100 p-2 rounded-full',
  red: 'text-red-500 bg-red-100 p-2 rounded-full',
  gray: 'text-gray-500 bg-gray-100 p-2 rounded-full'
};

// Card background colors mapping
const CARD_COLORS = {
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 border-l-4 border-l-blue-400',
  green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 border-l-4 border-l-green-400',
  emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 border-l-4 border-l-emerald-400',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 border-l-4 border-l-purple-400',
  orange: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 border-l-4 border-l-orange-400',
  red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 border-l-4 border-l-red-400',
  gray: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 border-l-4 border-l-gray-400'
};

// Text color mapping
const TEXT_COLORS = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  emerald: 'text-emerald-700',
  purple: 'text-purple-700',
  orange: 'text-orange-700',
  red: 'text-red-700',
  gray: 'text-gray-700'
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  colorTheme,
  subtitle,
  formatter
}) => {
  // Format value if formatter is provided and value is a number
  const displayValue = typeof value === 'number' && formatter 
    ? formatter(value) 
    : value;

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS[colorTheme]}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <h3 className={`text-2xl font-bold ${TEXT_COLORS[colorTheme]}`}>{displayValue}</h3>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className={ICON_COLORS[colorTheme]}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;