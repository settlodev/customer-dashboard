
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Package2, Clock, User, Receipt, CreditCard, ShoppingCart, ClockAlert } from 'lucide-react';
import { getOrder } from "@/lib/actions/order-actions";
import { Orders } from "@/types/orders/type";
import { UUID } from "crypto";
import Image from "next/image";

const OrderDetailsPage = async ({ params }: { params: { id: string } }) => {
    const order = await getOrder(params.id as UUID);
    const orderData: Orders | null = order?.content[0];

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
                            <span>{Intl.DateTimeFormat("en-US", { 
                                dateStyle: "full", 
                                timeStyle: "short", 
                                hour12: true 
                            }).format(new Date(orderData.openedDate))}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className='flex items-center gap-2 bg-emerald-50 rounded-md p-2'>
                            <Clock size={16} />
                            <p className='text-sm'>Closed Date</p>
                            </div>
                            <span>{
                                orderData.closedDate !== null ? Intl.DateTimeFormat("en-US", { 
                                    dateStyle: "full", 
                                    timeStyle: "short", 
                                    hour12: true 
                                }).format(new Date(orderData.closedDate)) : "Not Closed"
                                }</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
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
                                            <h3 className="font-medium text-lg">{item.name}</h3>
                                            <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                                                <div>Quantity: {item.quantity}</div>
                                                <div className="text-right font-medium">
                                                    Price: {Intl.NumberFormat("en-US").format(item.price)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
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
                                        <span className="font-medium">{Intl.NumberFormat("en-US").format(orderData.amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Discount</span>
                                        <span className="font-medium">-{Intl.NumberFormat("en-US").format(orderData.discountAmount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-3 border-t">
                                        <span>Total</span>
                                        <span>{Intl.NumberFormat("en-US").format(orderData.total || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg text-red-600 font-bold">
                                        <span>Amount Due</span>
                                        <span>{Intl.NumberFormat("en-US").format(orderData.amountDue || 0)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transaction Details */}
                        {orderData.transactions && (
                            <Card>
                                <CardHeader className="border-b">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <CreditCard className="text-gray-600" />
                                        Transaction Details
                                    </h2>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {orderData.transactions.map(transaction => (
                                        <div key={transaction.id} className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Type</span>
                                                <span className="font-medium">{orderData.paymentType?.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Method</span>
                                                <span className="font-medium">{transaction.paymentMethodName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Status</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(orderData.orderPaymentStatus)}`}>
                                                    {orderData.orderPaymentStatus}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Sold By</span>
                                                <span className="font-medium">{orderData.finishedByName}</span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;