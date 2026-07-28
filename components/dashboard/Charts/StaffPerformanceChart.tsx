"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffPerformance } from "@/types/dashboard/type";

const formatAmount = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="text-xs font-medium mb-1">{d.staffName}</p>
      <p className="text-sm font-bold">
        {d.ordersValue?.toLocaleString()} <span className="text-xs font-normal opacity-70">TZS</span>
      </p>
      <p className="text-xs text-muted-foreground">{d.ordersCount} orders</p>
    </div>
  );
};

export default function StaffPerformanceChart({ data }: { data: StaffPerformance[] }) {
  const chartData = (data || []).map((d) => ({
    ...d,
    name: d.staffName.split(" ")[0],
  }));

  if (!chartData.length) {
    return (
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Staff Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ minHeight: 280 }}>
          <p className="text-sm text-muted-foreground">No staff data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Staff Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={0}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={formatAmount}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="ordersValue"
              fill="#1f2937"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
