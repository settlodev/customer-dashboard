import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {ShoppingCart, AlertTriangle, Trash} from 'lucide-react';
import { getOrder, getOrderLogs } from "@/lib/actions/order-actions";
import { UUID } from "crypto";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import OrderRefundSection from "@/components/widgets/order/order-refund-section";
import OrderItemCard from "@/components/widgets/order/order-item-card";
import OrderItemRemovedCard from "@/components/widgets/order/order-item-removed-card";
import {OrderFinancialSummaryCard} from "@/components/widgets/order/order-financial-summary-card";
import {OrderInformationCard} from "@/components/widgets/order/order-information-card";
import {OrderQuickStatsCard} from "@/components/widgets/order/order-quick-stats-card";
import {OrderTransactionDetailsCard} from "@/components/widgets/order/order-transaction-details";
import OrderDepartmentPerformanceCard from "@/components/widgets/order/order-department-performance-card";
import {Orders} from "@/types/orders/type";
import OrderTimeline from '@/components/widgets/order/order-timeline';



type StatusType = 'OPEN' | 'PAID' | 'NOT_PAID';
type Params = Promise<{id: string}>

const OrderDetailsPage = async ({params}: {params: Params}) => {
    const resolvedParams = await params;
    const order = await getOrder(resolvedParams.id as UUID);
    const orderLogs = await getOrderLogs(resolvedParams.id as UUID);
    const orderData: Orders = order?.content[0];

    if (!orderData) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Order not found</AlertDescription>
                </Alert>
            </div>
        );
    }

    // Utility functions
    const isValidImageUrl = (image: string): boolean => {
        return Boolean(image && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')));
    };

    const getStatusColor = (status: StatusType | string): string => {
        const statusColors: Record<StatusType | 'default', string> = {
            'OPEN': 'bg-blue-500',
            'PAID': 'bg-green-500',
            'NOT_PAID': 'bg-red-500',
            'default': 'bg-gray-500'
        };
        return statusColors[status as keyof typeof statusColors] || statusColors.default;
    };

    // Calculate key metrics
    const calculateMetrics = () => {
        const total = orderData.grossAmount - (orderData.discountAmount || 0);
        const profitMargin = (orderData.grossProfit / orderData.grossAmount) * 100;
        const totalItems = orderData.items.reduce((acc, item) => acc + item.quantity, 0);
        const averageItemPrice = orderData.grossAmount / totalItems;
        const processingTime = orderData.closedDate
            ? new Date(orderData.closedDate).getTime() - new Date(orderData.openedDate).getTime()
            : 0;
        const processingMinutes = Math.floor(processingTime / 1000 / 60);

        return {
            total,
            profitMargin,
            totalItems,
            averageItemPrice,
            processingTime,
            processingMinutes
        };
    };

    const metrics = calculateMetrics();

    // Department analysis
    const departmentAnalysis = () => {
        const departments = orderData.items.reduce((acc, item) => {
            const dept = acc[item.departmentName] || { revenue: 0, profit: 0, count: 0 };
            dept.revenue += item.price * item.quantity;
            dept.profit += item.grossProfit;
            dept.count += item.quantity;
            acc[item.departmentName] = dept;
            return acc;
        }, {} as Record<string, { revenue: number; profit: number; count: number; }>);

        return Object.entries(departments).map(([name, data]) => ({
            name,
            value: data.revenue,
            profit: data.profit,
            count: data.count
        }));
    };

    const departmentData = departmentAnalysis();
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    // Sort items by profitability
    const sortedItems = [...orderData.items].sort((a, b) =>
        (b.price * b.quantity + b.grossProfit) - (a.price * a.quantity + a.grossProfit)
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 mt-3">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Breadcrumbs */}
                <BreadcrumbsNav items={[{ title: "Order Details", link: `/orders/${resolvedParams.id}` }]} />

                <OrderQuickStatsCard metrics={metrics} />

                {metrics.profitMargin < 0 && (
                    <Alert className="bg-red-50 text-red-800 border-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Negative Profit Margin Alert</AlertTitle>
                        <AlertDescription>
                            This order has a negative profit margin of {metrics.profitMargin.toFixed(2)}%.
                            Consider reviewing pricing strategy and cost structure.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Side */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card>
                            <CardHeader className="border-b">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <ShoppingCart className="text-emerald-600" />
                                        Order Items
                                    </h2>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="bg-blue-50 items-center sm:text-sm">
                                            <p className='text-center sm:text-xs'>Total Items: {metrics.totalItems}</p>
                                        </Badge>
                                        <Badge variant="outline" className="bg-green-50 ">
                                           <p className='text-center sm:text-xs'> Unique Products: {orderData.items.length}</p>
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="divide-y">
                                {sortedItems.map((item) => (
                                    <OrderItemCard
                                        key={item.id}
                                        item={item}
                                        isValidImageUrl={isValidImageUrl}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        {orderData.removedItems && orderData.removedItems.length > 0 && (
                            <Card>
                                <CardHeader className="border-b">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-semibold flex items-center gap-2">
                                            <Trash className="text-emerald-600" />
                                            Items Removed
                                        </h2>
                                    </div>
                                </CardHeader>
                                <CardContent className="divide-y">
                                    {orderData.removedItems.map((item) => (
                                        <OrderItemRemovedCard
                                            key={item.id}
                                            item={item}
                                            isValidImageUrl={isValidImageUrl}
                                        />
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Refund Section */}
                {orderData.orderItemRefunds?.length > 0 && (
                    <OrderRefundSection
                        orderItemRefunds={orderData.orderItemRefunds}
                        items={orderData.items}
                    />
                )}
                         <OrderTransactionDetailsCard
                    orderData={orderData}
                    getStatusColor={getStatusColor}
                />
                
                    </div>

                    {/* Sidebar - Right Side */}
                    <div className="space-y-6">
                        <OrderInformationCard
                            orderData={orderData}
                            metrics={metrics}
                        />

                        <OrderFinancialSummaryCard
                            orderData={orderData}
                        />

                        <OrderDepartmentPerformanceCard
                            departmentData={departmentData}
                            colors={COLORS}
                        />
                        <OrderTimeline data={orderLogs} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrderDetailsPage;
