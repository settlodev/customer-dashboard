"use client";

import React from "react";
import {
  Package,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import MetricCard from "./order-summary-card";

interface Order {
  amount: number;
  paidAmount?: number;
  orderPaymentStatus: string;
  orderStatus: string;
  efdPrinted?: boolean;
}

interface Data {
  content: Order[];
  totalElements: number;
}

const OrdersSummary = ({ data }: { data: Data }) => {
  const totalOrders = data.totalElements;

  // Page-level aggregates — these are computed only from the current page.
  // For true totals across all orders, the API should return aggregates.
  const pageRevenue = data.content.reduce(
    (sum, order) => sum + (order.amount || 0),
    0,
  );
  const pageCollected = data.content.reduce(
    (sum, order) => sum + (order.paidAmount || 0),
    0,
  );
  const pendingPayments = data.content.filter(
    (order) => order.orderPaymentStatus !== "PAID",
  ).length;
  const openOrders = data.content.filter(
    (order) => order.orderStatus === "OPEN",
  ).length;
  const efdCount = data.content.filter((order) => order.efdPrinted).length;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      maximumFractionDigits: 0,
    }).format(value);

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      subtitle: "All time",
      icon: <Package className="w-5 h-5" />,
    },
    {
      title: "Revenue (this page)",
      value: pageRevenue,
      subtitle: `${formatCurrency(pageCollected)} collected`,
      icon: <Wallet className="w-5 h-5" />,
      formatter: formatCurrency,
    },
    {
      title: "Pending Payments",
      value: pendingPayments,
      subtitle:
        pendingPayments > 0
          ? `${pendingPayments} need attention`
          : "All caught up",
      icon:
        pendingPayments > 0 ? (
          <AlertTriangle className="w-5 h-5" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        ),
      colorTheme:
        pendingPayments > 0 ? ("yellow" as const) : ("green" as const),
    },
    {
      title: "Open Orders",
      value: openOrders,
      subtitle: efdCount > 0 ? `${efdCount} EFD printed` : "On the page",
      icon: <Clock className="w-5 h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <MetricCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          formatter={stat.formatter}
        />
      ))}
    </div>
  );
};

export default OrdersSummary;
