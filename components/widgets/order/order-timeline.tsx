import React from 'react';
import { format } from 'date-fns';
import { Clock, Tag, CreditCard, PackagePlus, Receipt, Plus, RefreshCcw, Minus, CircleX } from 'lucide-react';
import { Card, CardContent, CardHeader} from '@/components/ui/card';
import { OrderLogs } from '@/types/orders/type';

const OrderTimeline = ({ data }: { data: OrderLogs }) => {
    // Extract and sort timeline items by date
    const compareDates = (a: { dateCreated: string }, b: { dateCreated: string }): number => {
        try {
            const dateA = new Date(a.dateCreated).getTime();
            const dateB = new Date(b.dateCreated).getTime();
            return dateA - dateB;
        } catch (error) {
            console.error('Error comparing dates:', error);
            return 0;
        }
    };

    const timelineItems = data.content.sort(compareDates);

    // Function to get icon based on event type
    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'ORDER_OPEN':
                return <Receipt className="h-4 w-4" />;
            case 'ORDER_DISCOUNT_AMOUNT_ADD':
                return <Tag className="h-4 w-4" />;
            case 'ORDER_ITEM_ADD':
                return <PackagePlus className="h-4 w-4" />;
            case 'ORDER_TRANSACTION_ADD':
                return <CreditCard className="h-4 w-4" />;
            case 'ORDER_CLOSE':
                return <Clock className="h-4 w-4" />;
            case 'ORDER_ITEM_REFUND':
                return <RefreshCcw className="h-4 w-4" />;
            case 'ADDON_ADD':
                return <Plus className="h-4 w-4" />;
            case 'ADDON_REMOVE':
                return <Minus className="h-4 w-4" />;
            case 'MODIFIER_ADD':
                return <Plus className="h-4 w-4" />;
            case 'MODIFIER_REMOVE':
                return <Minus className="h-4 w-4" />;
            case 'ORDER_DISCOUNT_ID_ADD':
                return <Tag className="h-4 w-4" />;
            case 'ORDER_DISCOUNT_ID_REMOVE':
                return <Tag className="h-4 w-4" />;
            case 'ORDER_DISCOUNT_AMOUNT_ADD':
                return <Tag className="h-4 w-4" />;
            case 'ORDER_DISCOUNT_AMOUNT_REMOVE':
                return <Tag className="h-4 w-4" />;
            case 'ORDER_ITEM_DISCOUNT_AMOUNT_ADD,':
                return <Tag className="h-4 w-4" />;
            case 'ORDER_ITEM_DISCOUNT_AMOUNT_REMOVE':
                return <Tag className="h-4 w-4" />;
            case 'ORDER_CANCEL':
                return <CircleX className="h-4 w-4" />;
            default:
                return <Plus className="h-4 w-4" />;
        }
    };

    // Function to get background color based on event type
    const getEventColor = (eventType: string) => {
        switch (eventType) {
            case 'ORDER_OPEN':
                return 'bg-emerald-50 border-l-4 border-emerald-500';
            case 'ORDER_CLOSE':
                return 'bg-blue-50 border-l-4 border-blue-500';
            case 'ORDER_CANCEL':
                return 'bg-red-50 border-l-4 border-red-500';
            case 'ORDER_ITEM_ADD':
                return 'bg-indigo-50 border-l-4 border-indigo-500';
            case 'ORDER_TRANSACTION_ADD':
                return 'bg-purple-50 border-l-4 border-purple-500';
            case 'ORDER_ITEM_REFUND':
                return 'bg-orange-50 border-l-4 border-orange-500';
            // Discount related events
            case 'ORDER_DISCOUNT_AMOUNT_ADD':
            case 'ORDER_DISCOUNT_ID_ADD':
            case 'ORDER_ITEM_DISCOUNT_AMOUNT_ADD':
                return 'bg-green-50 border-l-4 border-green-500';
            case 'ORDER_DISCOUNT_AMOUNT_REMOVE':
            case 'ORDER_DISCOUNT_ID_REMOVE':
            case 'ORDER_ITEM_DISCOUNT_AMOUNT_REMOVE':
                return 'bg-yellow-50 border-l-4 border-yellow-500';
            // Add/remove related events
            case 'ADDON_ADD':
            case 'MODIFIER_ADD':
                return 'bg-sky-50 border-l-4 border-sky-500';
            case 'ADDON_REMOVE':
            case 'MODIFIER_REMOVE':
                return 'bg-amber-50 border-l-4 border-amber-500';
            default:
                return 'bg-gray-50 border-l-4 border-gray-500';
        }
    };

    // Function to get icon background color based on event type
    const getIconBgColor = (eventType: string) => {
        switch (eventType) {
            case 'ORDER_OPEN':
                return 'bg-emerald-100 text-emerald-600';
            case 'ORDER_CLOSE':
                return 'bg-blue-100 text-blue-600';
            case 'ORDER_CANCEL':
                return 'bg-red-100 text-red-600';
            case 'ORDER_ITEM_ADD':
                return 'bg-indigo-100 text-indigo-600';
            case 'ORDER_TRANSACTION_ADD':
                return 'bg-purple-100 text-purple-600';
            case 'ORDER_ITEM_REFUND':
                return 'bg-orange-100 text-orange-600';
            case 'ORDER_DISCOUNT_AMOUNT_ADD':
            case 'ORDER_DISCOUNT_ID_ADD':
            case 'ORDER_ITEM_DISCOUNT_AMOUNT_ADD':
                return 'bg-green-100 text-green-600';
            case 'ORDER_DISCOUNT_AMOUNT_REMOVE':
            case 'ORDER_DISCOUNT_ID_REMOVE':
            case 'ORDER_ITEM_DISCOUNT_AMOUNT_REMOVE':
                return 'bg-yellow-100 text-yellow-600';
            case 'ADDON_ADD':
            case 'MODIFIER_ADD':
                return 'bg-sky-100 text-sky-600';
            case 'ADDON_REMOVE':
            case 'MODIFIER_REMOVE':
                return 'bg-amber-100 text-amber-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getEventDescription = (item: { orderLogEvent: string; discountAmountValue: any; orderItemName: any; orderTransactionPaymentMethodName: any; addonName: any; modifierName: any; discountIdName: any; }) => {
        switch (item.orderLogEvent) {
            case 'ORDER_OPEN':
                return 'Order created';
            case 'ORDER_DISCOUNT_AMOUNT_ADD':
                return `Discount added${item.discountAmountValue ? `: $${item.discountAmountValue}` : ''}`;
            case 'ORDER_ITEM_ADD':
                return `Item added: ${item.orderItemName}`;
            case 'ORDER_TRANSACTION_ADD':
                return `Payment made via ${item.orderTransactionPaymentMethodName}`;
            case 'ORDER_CLOSE':
                return 'Order closed';
            case 'ORDER_ITEM_REFUND':
                return `Item refunded: ${item.orderItemName}`;
            case 'ADDON_ADD':
                return `Addon added: ${item.addonName}`;
            case 'ADDON_REMOVE':
                return `Addon removed: ${item.addonName}`;
            case 'MODIFIER_ADD':
                return `Modifier added: ${item.modifierName}`;
            case 'MODIFIER_REMOVE':
                return `Modifier removed: ${item.modifierName}`;
            case 'ORDER_DISCOUNT_ID_ADD':
                return `Discount ID added: ${item.discountIdName}`;
            case 'ORDER_DISCOUNT_ID_REMOVE':
                return `Discount ID removed: ${item.discountIdName}`;
            case 'ORDER_DISCOUNT_AMOUNT_ADD':
                return `Discount amount added: ${item.discountAmountValue}`;
            case 'ORDER_DISCOUNT_AMOUNT_REMOVE':
                return `Discount amount removed: ${item.discountAmountValue}`;
            case 'ORDER_ITEM_DISCOUNT_AMOUNT_ADD':
                return `Item discount amount added: ${item.discountAmountValue}`;
            case 'ORDER_ITEM_DISCOUNT_AMOUNT_REMOVE':
                return `Item discount amount removed: ${item.discountAmountValue}`;
            case 'ORDER_CANCEL':
                return 'Order canceled';
            default:
                return item.orderLogEvent.replace(/_/g, ' ').toLowerCase();
        }
    };

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2 pl-4">
                        <Clock className="text-emerald-600" />
                        Order Timeline
                    </h2>
                    <div className="text-sm text-gray-500">
                        {timelineItems.length} events
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="w-full h-80 overflow-y-auto">
                    <div className="space-y-0">
                        {timelineItems.map((item: any, index: number) => (
                            <div key={item.id} className={`flex p-4 ${getEventColor(item.orderLogEvent)}`}>
                                {/* Timeline connector */}
                                <div className="mr-4 flex flex-col items-center">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getIconBgColor(item.orderLogEvent)}`}>
                                        {getEventIcon(item.orderLogEvent)}
                                    </div>
                                    {index < timelineItems.length - 1 && (
                                        <div className="h-full w-0.5 bg-gray-200 mt-1"></div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="pb-4">
                                    <div className="flex items-baseline mb-1">
                                        <h3 className="text-lg font-semibold">{getEventDescription(item)}</h3>
                                    </div>
                                    <time className="text-sm text-gray-500 mb-2 flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {format(new Date(item.dateCreated), 'MMM d, yyyy h:mm a')}
                                    </time>

                                    {/* Additional details if available */}
                                    {(item.modifierName || item.addonName || item.discountIdName) && (
                                        <div className="text-sm mt-1 text-gray-600">
                                            <ul className="list-disc list-inside">
                                                {item.modifierName && <li>Modifier: {item.modifierName}</li>}
                                                {item.addonName && <li>Addon: {item.addonName}</li>}
                                                {item.discountIdName && <li>Discount: {item.discountIdName}</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default OrderTimeline;