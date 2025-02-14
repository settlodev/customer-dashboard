import React from 'react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
    TrendingUp,
    TrendingDown,
    Package,
    Tags,
    Percent,
    CircleDollarSign,
    ShoppingBag,
    User
} from 'lucide-react';
import { OrderItems } from "@/types/orders/type";

interface OrderItemCardProps {
    item: OrderItems;
    isValidImageUrl: (url: string) => boolean;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({
                                                         item,
                                                         isValidImageUrl
                                                     }) => {
    const itemProfitMargin = (item.grossProfit / (item.price * item.quantity)) * 100;
    const isLoss = item.grossProfit < 0;
    const totalRevenue = item.price;
    const hasDiscount = item.discountAmount > 0;

    // Calculate additional metrics
    const hasModifiers = item.modifier && item.modifier !== "";
    const hasAddons = item.addons && item.addons !== "";

    return (
        <div className="py-6 first:pt-2 last:pb-2">
            <div className="flex flex-col space-y-4">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                        {isValidImageUrl(item.image) ? (
                            <Image
                                width={64}
                                height={64}
                                src={item.image}
                                alt={item.name}
                                className="rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="text-gray-400" size={24} />
                            </div>
                        )}
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-medium text-base">
                                        {item.name}
                                    </h3>
                                    <div className="flex gap-1.5">
                                        {hasModifiers && (
                                            <Badge variant="secondary" className="text-xs">
                                                Modified
                                            </Badge>
                                        )}
                                        {hasAddons && (
                                            <Badge variant="secondary" className="text-xs">
                                                Add-ons
                                            </Badge>
                                        )}
                                        {item.hasBeenRefunded && (
                                            <Badge variant="destructive" className="text-xs">
                                                Refunded
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{item.departmentName}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>SKU: {item.sku || 'N/A'}</span>
                                </div>
                            </div>
                            {(hasModifiers || hasAddons) && (
                                <div className="text-sm text-gray-600 space-y-0.5">
                                    {hasModifiers && (
                                        <div>Modifiers: {item.modifier}</div>
                                    )}
                                    {hasAddons && (
                                        <div>Add-ons: {item.addons}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                            {isLoss ? (
                                <TrendingDown className="text-red-500" size={16} />
                            ) : (
                                <TrendingUp className="text-emerald-500" size={16} />
                            )}
                            <span className={`font-medium ${isLoss ? 'text-red-600' : 'text-emerald-600'}`}>
                                {itemProfitMargin.toFixed(1)}% margin
                            </span>
                        </div>
                        <span className="text-sm text-gray-600">
                            {isLoss ? 'Loss' : 'Profit'}: {Intl.NumberFormat().format(Math.abs(item.grossProfit))}
                        </span>
                        {item.staffName && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <User size={12} />
                                {item.staffName}
                            </div>
                        )}
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                        <ShoppingBag className="text-blue-500" size={16} />
                        <div>
                            <p className="text-sm text-gray-600">Quantity</p>
                            <p className="font-medium">{item.quantity}</p>
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                        <Tags className="text-purple-500" size={16} />
                        <div>
                            <p className="text-sm text-gray-600">Unit Price</p>
                            <div className="flex items-center gap-1">
                                <p className="font-medium">{Intl.NumberFormat().format(item.price)}</p>
                                {item.price !== item.itemPrice && (
                                    <span className="text-xs text-gray-500 line-through">
                                        {Intl.NumberFormat().format(item.itemPrice)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {hasDiscount ? (
                        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                            <Percent className="text-orange-500" size={16} />
                            <div>
                                <p className="text-sm text-gray-600">Discount Applied</p>
                                <div className="flex items-center gap-1">
                                    <p className="font-medium text-orange-600">
                                        -{Intl.NumberFormat().format(item.discountAmount)}
                                    </p>
                                    <span className="text-xs text-gray-500">
                                        ({((item.discountAmount / totalRevenue) * 100).toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                            <CircleDollarSign className="text-emerald-500" size={16} />
                            <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="font-medium">
                                    {Intl.NumberFormat().format(totalRevenue)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {item.comment && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        Note: {item.comment}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderItemCard;
