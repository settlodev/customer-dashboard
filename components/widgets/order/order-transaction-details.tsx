import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    CreditCard,
    Wallet,
    Activity,
    ArrowUpDown,
} from 'lucide-react';
import { Orders } from "@/types/orders/type";

interface OrderTransactionDetailsCardProps {
    orderData: Orders;
    getStatusColor: (status: string) => string;
}

export const OrderTransactionDetailsCard: React.FC<OrderTransactionDetailsCardProps> = ({
                                                                                            orderData,
                                                                                        }) => {
    // Calculate transaction metrics
    const transactionMetrics = orderData.transactions.reduce((acc, transaction) => {
        // Payment method totals
        acc.methodTotals[transaction.paymentMethodName] =
            (acc.methodTotals[transaction.paymentMethodName] || 0) + transaction.amount;

        // Track largest transaction
        if (transaction.amount > (acc.largestTransaction?.amount || 0)) {
            acc.largestTransaction = transaction;
        }

        // Calculate average transaction size
        acc.totalAmount += transaction.amount;
        acc.averageTransaction = acc.totalAmount / orderData.transactions.length;

        return acc;
    }, {
        methodTotals: {} as Record<string, number>,
        largestTransaction: null as any,
        totalAmount: 0,
        averageTransaction: 0
    });

    // Sort payment methods by amount
    const sortedPaymentMethods = Object.entries(transactionMetrics.methodTotals)
        .sort(([, a], [, b]) => b - a);

    return (
        <Card className="w-full mt-6">
            <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CreditCard className="text-blue-600" />
                        Transaction Details
                    </h2>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={orderData.orderPaymentStatus === 'PAID' ? 'default' : 'destructive'}
                            className={orderData.orderPaymentStatus === 'PAID' ? 'bg-emerald-300' : ''}
                        >
                            {orderData.orderPaymentStatus}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Transaction Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="text-blue-600" size={16} />
                            <span className="font-medium">Transaction Overview</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Transactions</span>
                                <span className="font-medium">{orderData.transactions.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Average Size</span>
                                <span className="font-medium">
                                    {Intl.NumberFormat().format(transactionMetrics.averageTransaction)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet className="text-emerald-600" size={16} />
                            <span className="font-medium">Primary Payment Method</span>
                        </div>
                        {sortedPaymentMethods[0] && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Badge variant="outline">{sortedPaymentMethods[0][0]}</Badge>
                                    <span className="font-medium">
                                        {Intl.NumberFormat().format(sortedPaymentMethods[0][1])}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Share of Total</span>
                                    <span className="font-medium">
                                        {((sortedPaymentMethods[0][1] / transactionMetrics.totalAmount) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <ArrowUpDown className="text-purple-600" size={16} />
                            <span className="font-medium">Largest Transaction</span>
                        </div>
                        {transactionMetrics.largestTransaction && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Badge variant="outline">
                                        {transactionMetrics.largestTransaction.paymentMethodName}
                                    </Badge>
                                    <span className="font-medium">
                                        {Intl.NumberFormat().format(transactionMetrics.largestTransaction.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Date</span>
                                    <span className="text-sm">
                                        {new Date(transactionMetrics.largestTransaction.dateCreated)
                                            .toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Methods Distribution */}
                {sortedPaymentMethods.length > 1 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium mb-3">Payment Method Distribution</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {sortedPaymentMethods.map(([method, amount]) => (
                                <div key={method} className="flex flex-col">
                                    <Badge variant="outline" className="mb-1 text-center">
                                        {method}
                                    </Badge>
                                    <span className="text-center font-medium">
                                        {Intl.NumberFormat().format(amount)}
                                    </span>
                                    <span className="text-center text-sm text-gray-600">
                                        {((amount / transactionMetrics.totalAmount) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transactions Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Processed By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderData.transactions.map((transaction, index) => (
                                <TableRow key={transaction.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{new Date(transaction.dateCreated).toLocaleDateString()}</span>
                                            <span className="text-sm text-gray-600">
                                                {new Date(transaction.dateCreated).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {Intl.NumberFormat().format(transaction.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {transaction.paymentMethodName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="default" className="bg-emerald-300">
                                            Completed
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{orderData.finishedByName}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default OrderTransactionDetailsCard;
