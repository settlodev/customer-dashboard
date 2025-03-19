import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    RefreshCw,
    AlertTriangle,
    CircleDollarSign,
    Users,
    MapPin,
    CheckCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrderItemRefunds, OrderItems } from "@/types/orders/type";

interface OrderRefundSectionProps {
    orderItemRefunds: OrderItemRefunds[];
    items: OrderItems[];
}

const OrderRefundSection: React.FC<OrderRefundSectionProps> = ({ orderItemRefunds, items }) => {
    if (!orderItemRefunds || orderItemRefunds.length === 0) return null;

    // Calculate refund metrics
    const refundMetrics = orderItemRefunds.reduce((metrics, refund) => {
        const item = items.find(i => i.id === refund.orderItemId);
        const refundAmount = item ? item.price : 0;

        metrics.totalAmount += refundAmount;

        // Track unique staff and locations
        if (!metrics.uniqueStaff.includes(refund.staffName)) {
            metrics.uniqueStaff.push(refund.staffName);
        }
        if (!metrics.uniqueLocations.includes(refund.location)) {
            metrics.uniqueLocations.push(refund.location);
        }

        return metrics;
    }, {
        totalAmount: 0,
        uniqueStaff: [] as string[],
        uniqueLocations: [] as string[]
    });

    const totalOrderValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const refundPercentage = (refundMetrics.totalAmount / totalOrderValue) * 100;
    const isHighRefundRate = refundPercentage > 20;

    return (
        <Card className="mt-6">
            <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="text-orange-600" />
                        <div>
                            <h2 className="text-xl font-semibold">Refund Analysis</h2>
                            <p className="text-sm text-gray-600">
                                {orderItemRefunds.length} items refunded
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant={isHighRefundRate ? "destructive" : "default"}
                        className={!isHighRefundRate ? "bg-orange-50" : ""}
                    >
                        {refundPercentage.toFixed(1)}% of order
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {isHighRefundRate && (
                    <Alert className="mb-6 bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            High refund rate detected - {refundPercentage.toFixed(1)}% of order value has been refunded
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <CircleDollarSign className="text-orange-600" size={16} />
                            <span className="text-sm text-gray-600">Refund Total</span>
                        </div>
                        <p className="text-lg font-bold">
                            {Intl.NumberFormat().format(refundMetrics.totalAmount)}
                        </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="text-blue-600" size={16} />
                            <span className="text-sm text-gray-600">Staff Involved</span>
                        </div>
                        <p className="text-lg font-bold">
                            {refundMetrics.uniqueStaff.length}
                        </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="text-purple-600" size={16} />
                            <span className="text-sm text-gray-600">Locations</span>
                        </div>
                        <p className="text-lg font-bold">
                            {refundMetrics.uniqueLocations.length}
                        </p>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="text-emerald-600" size={16} />
                            <span className="text-sm text-gray-600">Stock Returns</span>
                        </div>
                        <p className="text-lg font-bold">
                            {orderItemRefunds.filter(r => r.stockReturned).length}
                        </p>
                    </div>
                </div>

                {/* Refunds Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Details</TableHead>
                                <TableHead>Reason & Notes</TableHead>
                                <TableHead>Processing Details</TableHead>
                                
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderItemRefunds.map((refund) => {
                                return (
                                    <TableRow key={refund.id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div>{refund.orderItemName}</div>
                                                <div className="text-sm text-gray-500">
                                                    {/* Location: {refund.locationName} */}
                                                   
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Badge variant="outline" className="bg-gray-50">
                                                    {refund.reason}
                                                </Badge>
                                                {refund.comment && (
                                                    <div className="text-sm text-gray-500">
                                                        {refund.comment}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="text-sm">
                                                    {new Date(refund.dateOfReturn).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs md:text-sm lg:text-sm text-gray-500">
                                                    Processed by: {refund.staffName}
                                                </div>
                                                <div className="text-xs md:text-sm lg:text-sm text-gray-500">
                                                    Approved by: {refund.approvedByName}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                {refund.stockReturned && (
                                                    <Badge variant="outline" className="bg-emerald-50 block w-fit">
                                                        Stock Returned
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default OrderRefundSection;
