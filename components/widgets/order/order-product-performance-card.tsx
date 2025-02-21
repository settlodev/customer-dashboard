"use client";

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {OrderItems} from "@/types/orders/type";

interface OrderProductPerformanceCardProps {
    items: OrderItems[];
}

export const OrderProductPerformanceCard: React.FC<OrderProductPerformanceCardProps> = ({ items }) => {
    const productData = items.map(item => ({
        name: item.name,
        revenue: item.price * item.quantity,
        profit: -item.grossProfit, // Negating because the original data shows negative profits
        margin: ((-item.grossProfit / (item.price * item.quantity)) * 100).toFixed(2),
        quantity: item.quantity
    }));

    // Calculate additional metrics
    const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalProfit = items.reduce((sum, item) => sum + item.grossProfit, 0);
    const averageMargin = (totalProfit / totalRevenue) * 100;

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <TrendingUp className="text-emerald-600" />
                        Product Performance Analysis
                    </h2>
                    <Badge variant="outline" className="bg-emerald-50">
                        {items.length} Products
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Top Performing Product</p>
                        <p className="text-lg font-bold mt-1">
                            {productData.sort((a, b) => b.profit - a.profit)[0]?.name}
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Average Margin</p>
                        <p className={`text-lg font-bold mt-1 ${averageMargin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {averageMargin.toFixed(2)}%
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Best Margin</p>
                        <p className="text-lg font-bold mt-1">
                            {Math.max(...productData.map(item => parseFloat(item.margin))).toFixed(2)}%
                        </p>
                    </div>
                </div>

                {/* Revenue vs Profit Chart */}
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) => Intl.NumberFormat().format(value)}
                                labelStyle={{ color: '#374151' }}
                            />
                            <Bar dataKey="revenue" fill="#4ade80" name="Revenue" />
                            <Bar dataKey="profit" fill="#2563eb" name="Profit" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Product Details Table */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Product Details</h3>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Revenue</TableHead>
                                    <TableHead>Profit</TableHead>
                                    <TableHead>Margin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productData.map((product, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.quantity}</TableCell>
                                        <TableCell>{Intl.NumberFormat().format(product.revenue)}</TableCell>
                                        <TableCell className={product.profit < 0 ? 'text-red-600' : 'text-green-600'}>
                                            {Intl.NumberFormat().format(product.profit)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={parseFloat(product.margin) < 0 ? 'destructive' : 'default'}>
                                                {product.margin}%
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
