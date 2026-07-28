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
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyCashflow } from "@/types/dashboard/type";

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

export default function MonthlyCashflowChart({ data }: { data: MonthlyCashflow[] }) {
  const chartData = (data || []).map((d) => {
    const [year, month] = d.month.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return {
      ...d,
      label: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    };
  });

  if (!chartData.length) {
    return (
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Monthly Cashflow
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ minHeight: 280 }}>
          <p className="text-sm text-muted-foreground">No cashflow data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Monthly Cashflow
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={0}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
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
            <Bar
              dataKey="transactionsTotal"
              name="Income"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
            <Bar
              dataKey="expensesTotal"
              name="Expenses"
              fill="#EB7F44"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
