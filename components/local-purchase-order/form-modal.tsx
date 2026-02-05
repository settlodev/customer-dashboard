"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StockPurchaseForm from "@/components/forms/stock_purchase_form";

interface StockPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockPurchase?: any;
}

export function StockPurchaseModal({
  open,
  onOpenChange,
  stockPurchase,
}: StockPurchaseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {stockPurchase ? "Edit Stock Purchase" : "New Stock Purchase"}
          </DialogTitle>
          <DialogDescription>
            Create a new purchase order for your stock
          </DialogDescription>
        </DialogHeader>
        <StockPurchaseForm item={stockPurchase} />
      </DialogContent>
    </Dialog>
  );
}
