import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StockVariantSummary {
  id: string;
  stockVariantName: string;
  stockName: string;
  totalEstimatedProfit: number;
  currentCostPerItem: number;
  currentTotalQuantity: number;
  currentTotalValue: number;
  currentAverageValue: number;
}

interface StockSummaryProps {
  summary: StockVariantSummary;
}

export default function StockSummary({ summary }: StockSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const summaryItems = [
    {
      label: "Total Quantity",
      value: formatNumber(summary.currentTotalQuantity),
      description: "Current stock level",
    },
    {
      label: "Cost Per Item",
      value: formatCurrency(summary.currentCostPerItem),
      description: "Average unit cost",
    },
    {
      label: "Total Value",
      value: formatCurrency(summary.currentTotalValue),
      description: "Total inventory value",
    },
    {
      label: "Average Value",
      value: formatCurrency(summary.currentAverageValue),
      description: "Mean item value",
    },
    {
      label: "Estimated Profit",
      value: formatCurrency(summary.totalEstimatedProfit),
      description: "Projected profit",
      highlight: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl capitalize">
          {summary.stockVariantName} Stock Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {summaryItems.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                item.highlight
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="space-y-1">
                <p className="text-sm text-gray-600 font-medium">
                  {item.label}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    item.highlight ? "text-green-700" : "text-gray-900"
                  }`}
                >
                  {item.value}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
