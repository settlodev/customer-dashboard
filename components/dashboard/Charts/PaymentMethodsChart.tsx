"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionsByPaymentMethod } from "@/types/dashboard/type";

const CHART_COLORS = ["#EB7F44", "#10B981", "#6366F1", "#F59E0B", "#EC4899", "#8B5CF6"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="text-xs font-medium mb-1">{d.acceptedPaymentMethodTypeName}</p>
      <p className="text-sm font-bold">
        {d.totalAmount?.toLocaleString()} <span className="text-xs font-normal opacity-70">TZS</span>
      </p>
      <p className="text-xs text-muted-foreground">{d.percentage}%</p>
    </div>
  );
};

export default function PaymentMethodsChart({ data }: { data: TransactionsByPaymentMethod[] }) {
  const chartData = data || [];

  if (!chartData.length) {
    return (
      <Card className="shadow-none h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ minHeight: 220 }}>
          <p className="text-sm text-muted-foreground">No payment data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <PieChart width={220} height={220}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="totalAmount"
              strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
          <div className="flex flex-col gap-2.5 flex-1 min-w-0">
            {chartData.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {item.acceptedPaymentMethodTypeName}
                  </p>
                </div>
                <p className="text-xs font-semibold tabular-nums">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
