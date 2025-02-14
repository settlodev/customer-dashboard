import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package, User, Truck, Hash, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";


export default function StockIntakeDetails({ item}: { item: any }) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">
                {item.stockAndStockVariantName}
              </CardTitle>
              <CardDescription className="mt-2">
                Batch #{item.batchNumber}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={item.status ? "default" : "secondary"}>
                {item.status ? "Active" : "Inactive"}
              </Badge>
              {item.isArchived && (
                <Badge variant="destructive">
                  Archived
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quantity and Value Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quantity & Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Package className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Current Quantity</p>
                  <p className="text-lg font-semibold">{item.quantity.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Package className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Initial Intake Quantity</p>
                  <p className="text-lg font-semibold">{item.initialIntakeQuantity.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Hash className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Value</p>
                  <p className="text-lg font-semibold">KES {item.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Important Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(item.orderDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Truck className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Delivery Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(item.deliveryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Batch Expiry Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(item.batchExpiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personnel Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Personnel & Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Staff Member</p>
                  <p className="text-lg font-semibold">{item.staffName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Truck className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="text-lg font-semibold">{item.supplierName}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}