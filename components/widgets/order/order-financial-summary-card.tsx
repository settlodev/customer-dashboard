import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { Orders } from "@/types/orders/type";

interface OrderFinancialSummaryCardProps {
    orderData: Orders;
}

export const OrderFinancialSummaryCard: React.FC<OrderFinancialSummaryCardProps> = ({ orderData }) => {
    const isLoss = orderData.grossProfit < 0;
    const finalTotal = orderData.grossAmount - (orderData.discountAmount || 0);

    const formatAmount = (amount: number, showNegative = true) => {
        const absAmount = Math.abs(amount);
        const formattedAmount = Intl.NumberFormat().format(absAmount);
        return showNegative && amount < 0 ? `-${formattedAmount}` : formattedAmount;
    };

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Receipt className="text-emerald-600" />
                        Financial Summary
                    </h2>
                    <div className="flex items-center gap-2">
                        {isLoss ? (
                            <TrendingDown className="text-red-600" />
                        ) : (
                            <TrendingUp className="text-emerald-600" />
                        )}
                        <Badge variant={isLoss ? "destructive" : "default"}>
                            {isLoss ? 'Loss' : 'Profit'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    {/* Revenue Breakdown */}
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Gross Amount</span>
                            <span className="font-medium">
                                {formatAmount(orderData.grossAmount, false)}
                            </span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Total Cost</span>
                            <span className="font-medium text-red-600">
                                -{formatAmount(orderData.totalCost, false)}
                            </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                            <span className="font-medium">Net {isLoss ? 'Loss' : 'Profit'}</span>
                            <span className={`font-bold ${isLoss ? 'text-red-600' : 'text-emerald-600'}`}>
                                {formatAmount(orderData.grossProfit)}
                            </span>
                        </div>
                    </div>

                    {/* Profit Margin */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Profit Margin</span>
                            <span className={`font-medium ${isLoss ? 'text-red-600' : 'text-emerald-600'}`}>
                                {((orderData.grossProfit / orderData.grossAmount) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Discounts and Payments */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                        {orderData.discountAmount > 0 && (
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Discount Applied</span>
                                <span className="font-medium text-orange-600">
                                    -{formatAmount(orderData.discountAmount, false)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Payment Status</span>
                            <Badge
                                variant={orderData.orderPaymentStatus === 'PAID' ? 'default' : 'destructive'}
                                className={orderData.orderPaymentStatus === 'PAID' ? 'bg-emerald-300' : ''}
                            >
                                {orderData.orderPaymentStatus}
                            </Badge>
                        </div>
                        {orderData.orderPaymentStatus === "PARTIAL" && (
                            <>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-600">Paid Amount</span>
                                    <span className="font-medium text-emerald-600">
                                        {formatAmount(orderData.paidAmount, false)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Unpaid Amount</span>
                                    <span className="font-medium text-red-600">
                                        {formatAmount(orderData.unpaidAmount)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Final Total */}
                    <div className="flex justify-between text-lg font-bold pt-3 border-t">
                        <span>Final Total</span>
                        <span className={isLoss ? 'text-red-600' : 'text-emerald-600'}>
                            {formatAmount(finalTotal)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default OrderFinancialSummaryCard;
