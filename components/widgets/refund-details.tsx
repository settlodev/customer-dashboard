import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User,  
  ClipboardList, 
  ShoppingCart,
  CheckCircle2,
  Archive
} from 'lucide-react';
import { OrderItemRefunds } from '@/types/refunds/type';

export default function RefundDetails({ refund }: { refund: OrderItemRefunds }) {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">
                Refund Details
              </CardTitle>
              <CardDescription className="mt-2">
                Order #{refund.orderNumber}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={refund.status ? "default" : "secondary"}>
                {refund.status ? "Active" : "Inactive"}
              </Badge>
              {refund.isArchived && (
                <Badge variant="destructive">
                  <Archive className="w-4 h-4 mr-1" />
                  Archived
                </Badge>
              )}
              {refund.stockReturned && (
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Stock Returned
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Order Item</p>
              <p className="text-lg font-medium">{refund.orderItemName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-lg font-medium">{refund.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity Refunded</p>
              <p className="text-lg font-medium">{refund.quantity}</p>
            </div>
          </CardContent>
        </Card>

        {/* Refund Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Refund Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Date of Return</p>
              <p className="text-lg font-medium">
                {new Date(refund.dateOfReturn).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reason for Return</p>
              <p className="text-lg font-medium">{refund.reason}</p>
            </div>
          </CardContent>
        </Card>

        {/* Staff Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Processed By</p>
                <p className="text-lg font-medium">{refund.staffName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Approved By</p>
                <p className="text-lg font-medium">{refund.approvedByName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}