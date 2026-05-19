"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyRevenue } from "@/types/dashboard/type";

const COLORS = { revenue: "#10B981", expenses: "#EB7F44" };

const formatAmount = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          <span className="font-semibold">{entry.name}:</span>{" "}
          {entry.value?.toLocaleString()} TZS
        </p>
      ))}
      <p className="text-xs text-muted-foreground mt-1">
        {payload[0]?.payload.ordersCount} orders
      </p>
    </div>
  );
};

const CustomLegend = ({ payload }: any) => (
  <div className="flex justify-center gap-5 mt-2">
    {payload?.map((entry: any, i: number) => (
      <div key={i} className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
        <span className="text-xs text-muted-foreground">{entry.value}</span>
      </div>
    ))}
  </div>
);

export default function DailyRevenueChart({ data }: { data: DailyRevenue[] }) {
  const chartData = (data || []).map((d) => ({
    ...d,
    expenses: d.expenses || 0,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  if (!chartData.length) {
    return (
      <Card className="shadow-none h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Daily Revenue & Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center flex-1">
          <p className="text-sm text-muted-foreground">No revenue data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Daily Revenue & Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={220} minWidth={0}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.revenue} stopOpacity={0.2} />
                <stop offset="100%" stopColor={COLORS.revenue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.expenses} stopOpacity={0.2} />
                <stop offset="100%" stopColor={COLORS.expenses} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={formatAmount}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={COLORS.revenue}
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke={COLORS.expenses}
              strokeWidth={2}
              fill="url(#expensesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
