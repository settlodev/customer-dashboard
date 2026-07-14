"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  Star,
  Wallet,
  CalendarDays,
  ClipboardList,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Customer } from "@/types/customer/type";

function CustomerSummary({ customer }: { customer: Customer }) {
  const stats = [
    {
      label: "Total Orders",
      value: customer.totalOrders ?? 0,
      icon: ShoppingCart,
    },
    {
      label: "Order Requests",
      value: customer.orderRequests ?? 0,
      icon: ClipboardList,
    },
    {
      label: "Pending Orders",
      value: customer.pendingOrders ?? 0,
      icon: Clock,
    },
    {
      label: "Closed Orders",
      value: customer.closedOrders ?? 0,
      icon: CheckCircle,
    },
    {
      label: "Loyalty Points",
      value: customer.loyaltyPoints ?? 0,
      icon: Star,
    },
    {
      label: "Total Spend",
      value: customer.totalSpend?.toLocaleString() ?? "0",
      icon: Wallet,
    },
    {
      label: "Last Visit",
      value: customer.lastVisit
        ? new Date(customer.lastVisit).toLocaleDateString()
        : "—",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
