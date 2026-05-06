"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Star,
  CalendarDays,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Customer } from "@/types/customer/type";

function CustomerSummary({ customer }: { customer: Customer }) {
  const stats = [
    {
      label: "Loyalty Points",
      value: customer.loyaltyPoints.toLocaleString(),
      icon: Star,
    },
    {
      label: "Loyalty Carry-over",
      value: customer.loyaltyPointsCarryOver.toLocaleString(),
      icon: Star,
    },
    {
      label: "Credit Limit",
      value:
        customer.creditLimit != null
          ? customer.creditLimit.toLocaleString()
          : "—",
      icon: CreditCard,
    },
    {
      label: "No-Show Count",
      value: customer.noShowCount.toString(),
      icon: AlertTriangle,
    },
    {
      label: "Member Since",
      value: customer.createdAt
        ? new Date(customer.createdAt).toLocaleDateString()
        : "—",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Icon className="h-4 w-4 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default CustomerSummary;
