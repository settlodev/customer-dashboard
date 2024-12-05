import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrder } from "@/lib/actions/order-actions";
import { Orders } from "@/types/orders/type";
import { UUID } from "crypto";
import { ChevronDown } from "lucide-react"
import Image from "next/image"

const breadCrumbItems = [{title:"Order Details",link:"/orders/${id}"}];

const OrderDetailsPage = async ({ params }: { params: { id: string } }) => {
    const order = await getOrder(params.id as UUID);
    const orderData: Orders | null = order?.content[0];
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 md:max-w-md`}>
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
              
            </div>
            <Card>
                <CardHeader>
                    <CardTitle></CardTitle>
                    <CardDescription>
                        {/* View order details */}
                    </CardDescription>
                    <CardContent className="flex flex-col">
                        <div className="flex items-center gap-3 ">
                            <p className="text-[22px] font-bold">Order Number : {orderData.orderNumber}</p>
                            <p className={`p-1 rounded-md border border-gray-500 text-[10px] ${orderData.orderStatus === 'OPEN' ? 'bg-blue-400 text-white' : 'bg-emerald-400 text-white'}`}>
                                {orderData.orderStatus}
                            </p>                        
                            </div>
                        <div className="flex mb-2">
                            <p>{Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "long", hour12: false }).format(new Date(orderData.openedDate))}</p>
                        </div>

                        <div className="flex flex-col ">
                            <div className="flex justify-between gap-3 border-b">
                                <p className="text-[18px] font-bold uppercase border-b-2">Items</p>
                                <ChevronDown size={20} />
                            </div>
                            <div className="flex mt-4 flex-col">
                                {orderData.items.map(item => (
                                    <div key={item.id} className="flex gap-3 mb-2">
                                        <Image src={item.image} alt={item.name} width={60} height={60} className="border border-gray-900 rounded-sm" />
                                        <div className="flex flex-col">
                                            <p className="text-[14px] font-bold">{item.name}</p>
                                            <p className="text-[14px]">Quantity: {item.quantity}</p>
                                            <p className="text-[14px]">Price: {Intl.NumberFormat("en-US").format(item.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>

                        <div className="flex flex-col mt-4">
                            <p className="text-[18px] font-semibold uppercase border-b-1">Order details</p>

                            <div className="flex flex-col gap-3 my-3">

                                <div className="flex justify-between items-center border-b">
                                    {
                                        orderData.orderType === "IMMEDIATE" && (
                                            <>
                                                <p className="text-[16px] font-medium capitalize">order type</p>
                                                <p className="text-sm font-bold">Immediate</p>
                                            </>
                                        )
                                    }

                                    {
                                        orderData.orderType === "RESERVATION" && (
                                            <>
                                                <p className="text-[16px] font-medium capitalize">order type</p>
                                                <p className="text-sm font-bold">Reservation</p>
                                            </>
                                        )
                                    }
                                </div>

                                <div className="flex justify-between items-center border-b">
                                    <p className="text-[16px] capitalize font-medium">order status</p>
                                    <p className="p-2 rounded-md border bg-green-500 text-white border-gray-900 text-[12px]">{orderData.orderStatus}</p>
                                </div>
                                <div className="flex justify-between items-center border-b">
                                    <p className="text-[16px] font-medium capitalize">started by</p>
                                    <p className="text-sm font-bold">{orderData.startedByName}</p>
                                </div>

                                {
                                    orderData.customer && (
                                        <div className="flex justify-between items-center border-b">
                                            <p className="text-[16px] font-medium capitalize">customer</p>
                                            <p className="text-sm font-bold">{orderData.customerName}</p>
                                        </div>
                                    )
                                }


                            </div>

                        </div>

                        <div className="flex flex-col mt-4">
                            <p className="text-[18px] font-semibold uppercase border-b-1">bill</p>

                            <div className="flex flex-col gap-3 my-3">

                                <div className="flex justify-between items-center border-b">
                                    <p className="text-[16px] font-medium capitalize">subtotal</p>
                                    <p className="text-[14px] font-bold">{Intl.NumberFormat("en-US").format(orderData.amount)}/=</p>
                                </div>
                                <div className="flex justify-between items-center border-b">
                                    <p className="text-[16px] capitalize font-medium">discount</p>
                                    <p className="text-sm font-bold uppercase">{orderData.discount ? Intl.NumberFormat("en-US").format(orderData.discountAmount) : "0.00"}/= </p>
                                </div>
                                <div className="flex justify-between items-center border-b">
                                    <p className="text-[16px] font-medium capitalize">total</p>
                                    <p className="text-sm font-bold">{orderData.total ? Intl.NumberFormat("en-US").format(orderData.total) : "0.00"}/= </p>
                                </div>

                                <div className="flex justify-between items-center border-b">
                                    <p className="text-[16px] font-medium capitalize">amount due</p>
                                    <p className="text-sm font-bold">{orderData.amountDue ? Intl.NumberFormat("en-US").format(orderData.amountDue) : "0.00"}/= </p>
                                </div>


                            </div>

                        </div>


                        {
                            orderData.transactions && (
                                <div className="flex flex-col mt-4">
                            <p className="text-[18px] font-bold uppercase border-b-1">Transactions</p>
                            {orderData.transactions.map(item => (
                                <div key={item.id} className="flex flex-col gap-3 my-3">

                                    <div className="flex justify-between items-center border-b">
                                        <p className="text-[16px] font-medium capitalize">Amount</p>
                                        <p className="text-[14px] font-bold">{Intl.NumberFormat("en-US").format(item.amount)}/=</p>
                                    </div>
                                    <div className="flex justify-between items-center border-b">
                                        {
                                            orderData.paymentType === "DIRECT_SALE" && (
                                                <>
                                                <p className="text-[16px] font-medium capitalize">Payment Type</p>
                                                <p className="text-sm font-bold">Direct Sale</p>
                                                </>
                                            )
                                        }
                                        {
                                            orderData.paymentType === "CREDIT_SALE" && (
                                                <>
                                                <p className="text-[16px] font-medium capitalize">Payment Type</p>
                                                <p className="text-sm font-bold">Credit Sale</p>
                                                </>
                                            )
                                        }
                                    </div>
                                    <div className="flex justify-between items-center border-b">
                                        <p className="text-[16px]capitalize font-medium">Payment Method</p>
                                        <p className="text-sm font-bold uppercase">{orderData.transactions[0]?.paymentMethodName}</p>
                                    </div>

                                    <div className="flex justify-between items-center border-b">
                                        {
                                            orderData.orderPaymentStatus === "PAID" && (
                                                <>
                                                <p className="text-[16px] font-medium capitalize">Payment Status</p>
                                                <p className="text-sm font-bold">PAID</p>
                                                </>
                                            )
                                        }
                                        {
                                            orderData.orderPaymentStatus === "not_PAID" && (
                                                <>
                                                <p className="text-[16px] font-medium capitalize">Payment Status</p>
                                                <p className="text-sm font-bold">NOT PAID</p>
                                                </>
                                            )
                                        }
                                    </div>

                                    <div className="flex justify-between items-center border-b">
                                        <p className="text-[16px] font-medium capitalize">closed at</p>
                                        <p className="text-sm font-bold">{Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short", hour12: false }).format(new Date(orderData.openedDate))}</p>
                                    </div>

                                    <div className="flex justify-between items-center border-b">
                                        <p className="text-[16px] font-medium capitalize">Sold By</p>
                                        <p className="text-sm font-bold">{orderData.finishedByName}</p>
                                    </div>

                                </div>
                            ))}
                        </div>
                            )
                        }

                    </CardContent>
                </CardHeader>
            </Card>

        </div>
    )
}

export default OrderDetailsPage