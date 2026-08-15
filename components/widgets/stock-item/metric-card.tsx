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
  blue: 'text-blue-500 bg-blue-100 dark:bg-blue-950/40 p-2 rounded-full',
  green: 'text-green-500 bg-green-100 dark:bg-green-950/40 p-2 rounded-full',
  emerald: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-full',
  purple: 'text-purple-500 bg-purple-100 dark:bg-purple-950/40 p-2 rounded-full',
  orange: 'text-orange-500 bg-orange-100 dark:bg-orange-950/40 p-2 rounded-full',
  red: 'text-red-500 bg-red-100 dark:bg-red-950/40 p-2 rounded-full',
  gray: 'text-muted-foreground bg-muted p-2 rounded-full'
};

// Card background colors mapping
const CARD_COLORS = {
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-900 border-l-4 border-l-blue-400',
  green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-900 border-l-4 border-l-green-400',
  emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-900 border-l-4 border-l-emerald-400',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-900 border-l-4 border-l-purple-400',
  orange: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-900 border-l-4 border-l-orange-400',
  red: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/10 border-red-200 dark:border-red-900 border-l-4 border-l-red-400',
  gray: 'bg-gradient-to-br from-muted to-muted border-line border-l-4 border-l-gray-400'
};

// Text color mapping
const TEXT_COLORS = {
  blue: 'text-blue-700 dark:text-blue-400',
  green: 'text-green-700 dark:text-green-400',
  emerald: 'text-emerald-700 dark:text-emerald-400',
  purple: 'text-purple-700 dark:text-purple-400',
  orange: 'text-orange-700 dark:text-orange-400',
  red: 'text-red-700 dark:text-red-400',
  gray: 'text-ink-2'
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
            <p className="text-sm text-ink-2 font-medium">{title}</p>
            <h3 className={`text-2xl font-bold ${TEXT_COLORS[colorTheme]}`}>{displayValue}</h3>
            {subtitle && <p className="text-xs text-ink-3">{subtitle}</p>}
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