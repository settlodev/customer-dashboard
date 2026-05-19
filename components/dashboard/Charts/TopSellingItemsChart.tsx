"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopSellingItem } from "@/types/dashboard/type";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="text-xs font-medium mb-1">{d.itemName}</p>
      <p className="text-xs text-muted-foreground">{d.departmentName}</p>
      <p className="text-sm font-bold mt-1">{d.quantitySold} sold</p>
      <p className="text-xs text-muted-foreground">
        Revenue: {d.netSales?.toLocaleString()} TZS
      </p>
    </div>
  );
};

export default function TopSellingItemsChart({ data }: { data: TopSellingItem[] }) {
  const chartData = (data || []).slice(0, 5);

  if (!chartData.length) {
    return (
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Top Selling Items
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ minHeight: 280 }}>
          <p className="text-sm text-muted-foreground">No sales data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Top Selling Items
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={0}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
            />
            <YAxis
              type="category"
              dataKey="itemName"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="quantitySold"
              fill="#EB7F44"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
