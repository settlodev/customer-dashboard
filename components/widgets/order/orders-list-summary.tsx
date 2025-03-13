import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, DollarSign, Package, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Order {
  amount: number;
  orderPaymentStatus: string;
  orderStatus: string;
}

interface Data {
  totalElements: number;
  content: Order[];
}

const OrdersSummary = ({ data }: { data: Data }) => {
    const totalOrders = data.totalElements;
    const totalRevenue = data.content.reduce((sum: number, order: Order) => sum + order.amount, 0);
    const pendingPayments = data.content.filter((order: Order) => order.orderPaymentStatus !== "PAID").length;
    const openOrders = data.content.filter((order: Order) => order.orderStatus === "OPEN").length;

    const stats = [
        {
            title: "Total Orders",
            value: totalOrders,
            icon: Package,
            trend: totalOrders > 0 ? "up" : "neutral",
            color: "bg-blue-500"
        },
        {
            title: "Total Revenue",
            value: new Intl.NumberFormat('en-Tz', { style: 'currency', currency: 'Tzs' }).format(totalRevenue),
            icon: DollarSign,
            trend: totalRevenue > 0 ? "up" : "neutral",
            color: "bg-green-500"
        },
        {
            title: "Pending Payments",
            value: pendingPayments,
            icon: AlertCircle,
            trend: pendingPayments > 0 ? "up" : "neutral",
            color: "bg-yellow-500"
        },
        {
            title: "Open Orders",
            value: openOrders,
            icon: Clock,
            trend: "neutral",
            color: "bg-purple-500"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-2 min-w-0"> {/* Using items-start and min-w-0 */}
                  <div className={`${stat.color} p-2 rounded-lg text-white flex-shrink-0`}>
                    <stat.icon size={20} />
                  </div>
                  <div className="min-w-0"> {/* Added min-w-0 to allow text truncation */}
                    <p className="text-sm font-medium text-gray-500 truncate">{stat.title}</p>
                    <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <h3 className="text-xl font-bold truncate md:text-2xl cursor-pointer">
        {stat.value}
      </h3>
    </TooltipTrigger>
    <TooltipContent>
      <p>{stat.value}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {stat.trend === "up" && <TrendingUp className="text-green-500" size={20} />}
                  {stat.trend === "down" && <TrendingDown className="text-red-500" size={20} />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
};

export default OrdersSummary;
