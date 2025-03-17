'use client';

import React from 'react';
import { Package, DollarSign, AlertCircle, Clock } from 'lucide-react';
import MetricCard from './order-summary-card';


interface Order {
  amount: number;
  orderPaymentStatus: string;
  orderStatus: string;
}

interface Data {
  content: Order[];
  totalElements: number;
}

const OrdersSummary = ({ data }: { data: Data }) => {
  const totalOrders = data.totalElements;
  const totalRevenue = data.content.reduce((sum: number, order: Order) => sum + order.amount, 0);
  const pendingPayments = data.content.filter((order: Order) => order.orderPaymentStatus !== "PAID").length;
  const openOrders = data.content.filter((order: Order) => order.orderStatus === "OPEN").length;

  // Format currency values
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(value);

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: <Package size={20} />,
      trend: totalOrders > 0 ? "up" : "neutral" as const,
      colorTheme: "blue" as const
    },
    {
      title: "Total Revenue",
      value: totalRevenue,
      icon: <DollarSign size={20} />,
      trend: totalRevenue > 0 ? "up" : "neutral" as const,
      colorTheme: "green" as const,
      formatter: formatCurrency
    },
    {
      title: "Pending Payments",
      value: pendingPayments,
      icon: <AlertCircle size={20} />,
      trend: pendingPayments > 0 ? "up" : "neutral" as const,
      colorTheme: "yellow" as const
    },
    {
      title: "Open Orders",
      value: openOrders,
      icon: <Clock size={20} />,
      trend: "neutral" as const,
      colorTheme: "purple" as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 mb-6">
      {stats.map((stat, index) => (
        <MetricCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          colorTheme={stat.colorTheme}
          formatter={stat.formatter}
          showTooltip={true}
        />
      ))}
    </div>
  );
};

export default OrdersSummary;