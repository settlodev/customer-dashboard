import React from 'react';
import { Card } from '@/components/ui/card';
import {
    DollarSign,
    Percent,
    ShoppingCart,
    Clock
} from 'lucide-react';
import {OrderMetrics} from "@/types/orders/type";

interface OrderQuickStatsCardProps {
    metrics: OrderMetrics;
}

export const OrderQuickStatsCard: React.FC<OrderQuickStatsCardProps> = ({ metrics }) => {
    const stats = [
        {
            icon: <DollarSign className="text-green-500" />,
            label: "Total Revenue",
            value: Intl.NumberFormat().format(metrics.total),
            bgColor: "bg-green-50"
        },
        {
            icon: <Percent className="text-blue-500" />,
            label: "Profit Margin",
            value: `${metrics.profitMargin.toFixed(2)}%`,
            bgColor: `${metrics.profitMargin < 0 ? 'bg-red-50' : 'bg-blue-50'}`
        },
        {
            icon: <ShoppingCart className="text-purple-500" />,
            label: "Items Sold",
            value: metrics.totalItems.toString(),
            bgColor: "bg-purple-50"
        },
        {
            icon: <Clock className="text-orange-500" />,
            label: "Order Duration",
            value: `${metrics.processingMinutes} min`,
            bgColor: "bg-orange-50"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className={`p-4 ${stat.bgColor} border-none`}>
                    <div className="flex items-center gap-3">
                        {stat.icon}
                        <div>
                            <p className="text-sm text-gray-600">{stat.label}</p>
                            <p className="text-xl font-bold">{stat.value}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
