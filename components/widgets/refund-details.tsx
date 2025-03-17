import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User,  
  ClipboardList, 
  ShoppingCart,
  CheckCircle2
} from 'lucide-react';
import { OrderItemRefunds } from '@/types/refunds/type';

export default function RefundDetails({ refund }: { refund: OrderItemRefunds }) {
  // Define status badge styles based on refund status
  const getStatusColor = () => {
    if (refund.stockReturned) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 mt-12 bg-slate-50">
      {/* Header Card */}
      <Card className="border-t-4 border-t-indigo-500 shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-indigo-800">
                Refund Details
              </CardTitle>
              <CardDescription className="mt-2 text-slate-600">
                Order #{refund.orderNumber}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {refund.stockReturned && (
                <Badge variant="outline" className={`${getStatusColor()} shadow-sm`}>
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                  Stock Returned
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className='flex flex-col gap-2 lg:flex-row md:flex-row'>
     
        {/* Order Information */}
        <Card className="border border-slate-200  shadow-sm hover:shadow-md transition-shadow duration-300 w-full lg:w-[33%] md:w-[33%]">
          <CardHeader className="">
            <div className="text-lg flex items-center gap-2 text-slate-700">
              <ShoppingCart className="h-5 w-5 text-slate-500" />
              Order Details
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-2  bg-blue-50 border-b border-blue-100">
            <div>
              <p className="text-xs text-slate-500 font-medium">Order Item</p>
              <p className="text-sm font-medium text-slate-800">{refund.orderItemName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Order Number</p>
              <p className="text-sm font-medium text-slate-800">{refund.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Quantity Refunded</p>
              <p className="text-sm font-medium text-slate-800">{refund.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Amount Refunded</p>
              <p className="text-sm font-medium text-blue-600">{refund.orderItemNetAmount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Refund Information */}
        <Card className="border border-slate-200  shadow-sm hover:shadow-md transition-shadow duration-300 w-full lg:w-[33%] md:w-[33%]">
          <CardHeader className="">
            <div className="text-lg flex items-center gap-2 text-slate-700">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              Refund Information
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 bg-purple-50 border-b border-purple-100 h-[71%] ">
            <div>
              <p className="text-xs text-slate-500 font-medium">Date of Return</p>
              <p className="text-sm font-medium text-slate-800">
                {new Date(refund.dateOfReturn).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Reason for Return</p>
              <p className="text-sm font-medium text-slate-800">{refund.reason}</p>
            </div>
          </CardContent>
        </Card>
     
        {/* Staff Information */}
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300  w-full lg:w-[33%] md:w-[33%]">
          <CardHeader className="">
            <div className="text-lg flex items-center gap-2 text-slate-700">
              <User className="h-5 w-5 text-slate-500" />
              Staff Information
            </div>
          </CardHeader>
          <CardContent className="pt-4 bg-amber-50 border-b border-amber-100 h-[71%]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 font-medium">Processed By</p>
                <p className="text-sm font-medium text-slate-800">{refund.staffName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Approved By</p>
                <p className="text-sm font-medium text-slate-800">{refund.approvedByName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}