import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StockIntake } from "@/types/stock-intake/type";
import { Card, CardContent, CardHeader } from "../ui/card";

interface ItemModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  data: StockIntake;
}

export default function ItemModal({
  isOpen,
  onOpenChange,
  data
}: ItemModalProps) {
  const formatQuantity = new Intl.NumberFormat().format;

  const formatValue = new Intl.NumberFormat().format;

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(dateString));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Intake Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Stock Intake Details</h3>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-300 rounded-md">
                <div className="flex items-center border-b border-gray-300 p-2">
                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                    Stock Variant
                  </span>
                  <span className="w-2/3 pl-2">{data.stockVariantName}</span>
                </div>
                <div className="flex items-center border-b border-gray-300 p-2">
                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                    Quantity
                  </span>
                  <span className="w-2/3 pl-2">{formatQuantity(data.quantity)}</span>
                </div>
                <div className="flex items-center border-b border-gray-300 p-2">
                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                    Value
                  </span>
                  <span className="w-2/3 pl-2">{formatValue(data.value)}</span>
                </div>
                <div className="flex items-center border-b border-gray-300 p-2">
                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                    Order Date
                  </span>
                  <span className="w-2/3 pl-2">{formatDate(data.orderDate)}</span>
                </div>
                <div className="flex items-center border-b border-gray-300 p-2">
                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                    Delivery Date
                  </span>
                  <span className="w-2/3 pl-2">{formatDate(data.deliveryDate)}</span>
                </div>
                <div className="flex items-center border-b border-gray-300 p-2">
                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                    Batch Expiry Date
                  </span>
                  <span className="w-2/3 pl-2">
                        {data.batchExpiryDate ? formatDate(data.batchExpiryDate) : "-"}
                  </span>
                </div>
                <div className="flex items-center border-b border-gray-300 p-2">
                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                    Supplier
                  </span>
                  <span className="w-2/3 pl-2">{data.supplierName ? data.supplierName : "None"}</span>
                </div>
                <div className="flex items-center border-b border-gray-300 p-2">
                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                    Supplier
                  </span>
                  <span className="w-2/3 pl-2">{data.staffName}</span>
                </div>
                <div className="flex items-center border-b border-gray-300 p-2">
                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                    Status
                  </span>
                  <span className="w-2/3 pl-2 text-sm">
                    {data.status === true ? (
                      <span className="bg-emerald-500 text-sm text-white rounded-sm p-1">
                        Yes
                      </span>
                    ) : (
                      <span className="text-sm">No</span>
                    )}
                  </span>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange()}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
