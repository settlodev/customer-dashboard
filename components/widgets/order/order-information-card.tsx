import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Calendar,
    ShoppingCart,
} from 'lucide-react';
import {OrderMetrics, Orders} from "@/types/orders/type";

interface OrderInformationCardProps {
    orderData: Orders;
    metrics: OrderMetrics;
}

export const OrderInformationCard: React.FC<OrderInformationCardProps> = ({ orderData, metrics }) => {
    return (
        <Card>
            <CardHeader className="border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <User className="text-blue-600" />
                    Order Information
                </h2>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    {/* Timing Information */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="text-blue-600" size={16} />
                            <span className="font-medium">Timing</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Opened</span>
                                <span className="font-medium">
                                    {new Date(orderData.openedDate).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Closed</span>
                                <span className="font-medium">
                                    {orderData.closedDate
                                        ? new Date(orderData.closedDate).toLocaleString()
                                        : 'In Progress'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Processing Time</span>
                                <span className="font-medium">{metrics.processingMinutes} minutes</span>
                            </div>
                        </div>
                    </div>

                    {/* Staff Information */}
                    <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="text-green-600" size={16} />
                            <span className="font-medium">Staff</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Started By</span>
                                <span className="font-medium">{orderData.startedByName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Finished By</span>
                                <span className="font-medium">{orderData.finishedByName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <ShoppingCart className="text-purple-600" size={16} />
                            <span className="font-medium">Order Details</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Order Type</span>
                                <Badge variant="outline">{orderData.orderType}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Platform</span>
                                <Badge variant="outline">{orderData.platformType}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Customer</span>
                                <span className="font-medium">{orderData.customerName || "Walk-in"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Order Number</span>
                                <span className="font-medium">{orderData.orderNumber}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
