import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Package2, Clock, User, Receipt, CreditCard, ShoppingCart, ClockAlert, RefreshCw } from 'lucide-react';
import { getOrder } from "@/lib/actions/order-actions";
import { Orders } from "@/types/orders/type";
import { UUID } from "crypto";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const OrderDetailsPage = async ({ params }: { params: { id: string } }) => {
    const order = await getOrder(params.id as UUID);
    const orderData: Orders | null = order?.content[0];

    console.log("orderData:", orderData);

    const isValidImageUrl = (image: string) => {
        return image && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/'));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'bg-blue-500';
            case 'PAID':
                return 'bg-green-500';
            case 'NOT_PAID':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const total = orderData.grossAmount - (orderData.discountAmount || 0);

    const hasRefundedItems = orderData.orderItemRefunds && orderData.orderItemRefunds.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <BreadcrumbsNav items={[{ title: "Order Details", link: `/orders/${params.id}` }]} />
                </div>

                {/* Order Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className='flex flex-col gap-2'>
                        <div className="flex items-center gap-3 mb-2">
                            <Package2 className="text-emerald-500" size={24} />
                            <h1 className="text-2xl font-bold">Order #{orderData.orderNumber}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(orderData.orderStatus)}`}>
                                {orderData.orderStatus}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className='flex items-center gap-2 bg-blue-50 rounded-md p-2'>
                            <ClockAlert size={16} />
                            <p className='text-sm'>Opened Date</p>
                            </div>
                            <span>{new Date(orderData.openedDate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className='flex items-center gap-2 bg-emerald-50 rounded-md p-2'>
                            <Clock size={16} />
                            <p className='text-sm'>Closed Date</p>
                            </div>
                            <span>{orderData.closedDate ? new Date(orderData.closedDate).toLocaleString() : "Not Closed"}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="border-b">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <ShoppingCart className="text-emerald-600" />
                                    Order Items
                                </h2>
                            </CardHeader>
                            <CardContent className="divide-y">
                                {orderData.items.map(item => (
                                    <div key={item.id} className="py-4 flex items-center gap-4">
                                        {isValidImageUrl(item.image) ? (
                                            <Image
                                                width={80}
                                                height={80}
                                                src={item.image}
                                                alt={item.name}
                                                className="rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                <ShoppingCart className="text-black-500" size={24} />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-lg">{item.name}</h3>
                                                {item.hasBeenRefunded && (
                                                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                                        Refunded
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                                                <div>Quantity: {item.quantity}</div>
                                                <div className=" flex flex-col gap-2 text-right font-medium">
                                                    <p>Price: {Intl.NumberFormat().format(item.price)}</p>
                                                    <p>Cost: {Intl.NumberFormat("en-US").format(item.cost)}</p>
                                                    <p>Gross Profit: {Intl.NumberFormat("en-US").format(item.grossProfit)}</p>
                                                </div>
                                               
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Refunded Items Section */}
                        {hasRefundedItems && (
                            <Card>
                                <CardHeader className="border-b">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <RefreshCw className="text-orange-600" />
                                        Refunded Items
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item Name</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Processed By</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orderData.orderItemRefunds.map((refund) => (
                                                <TableRow key={refund.id}>
                                                    <TableCell>{refund.orderItemName}</TableCell>
                                                    <TableCell>{refund.reason}</TableCell>
                                                    <TableCell>
                                                        {new Date(refund.dateOfReturn).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>{refund.staffName}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right side panels */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <Card>
                            <CardHeader className="border-b">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <User className="text-gray-600" />
                                    Customer Details
                                </h2>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Customer Name</span>
                                        <span className="font-medium">{orderData.customerName || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Order Type</span>
                                        <span className="font-medium">{orderData.orderType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Started By</span>
                                        <span className="font-medium">{orderData.startedByName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Finished By</span>
                                        <span className="font-medium">{orderData.finishedByName}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Summary */}
                        <Card>
                            <CardHeader className="border-b">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Receipt className="text-gray-600" />
                                    Payment Summary
                                </h2>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">{Intl.NumberFormat("en-US").format(orderData.grossAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Discount</span>
                                        <span className="font-medium">-{Intl.NumberFormat("en-US").format(orderData.discountAmount || 0)}</span>
                                    </div>

                                    {orderData.orderPaymentStatus === "PARTIAL" && (
                                     <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Paid Amount</span>
                                            <span className="font-medium">{Intl.NumberFormat("en-US").format(orderData.paidAmount || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">UnPaid Amount</span>
                                            <span className="font-medium">{Intl.NumberFormat("en-US").format(orderData.unpaidAmount || 0)}</span>
                                        </div>
                                     </>
                                   )}

                                    <div className="flex justify-between text-lg font-bold pt-3 border-t">
                                        <span>Total</span>
                                        <span>{Intl.NumberFormat("en-US").format(total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Transaction Details */}
                <Card className="w-full">
                    <CardHeader className="border-b">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <CreditCard className="text-gray-600" />
                            Transaction Details
                        </h2>
                    </CardHeader>
                    <CardContent>
                        {orderData.transactions && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead>Payment Status</TableHead>
                                        <TableHead>Sold By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderData.transactions.map((transaction, index) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-medium">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>{Intl.NumberFormat("en-US").format(transaction.amount)}</TableCell>
                                            <TableCell>{transaction.paymentMethodName}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(orderData.orderPaymentStatus)}`}>
                                                    {orderData.orderPaymentStatus}
                                                </span>
                                            </TableCell>
                                            <TableCell>{orderData.finishedByName}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OrderDetailsPage;