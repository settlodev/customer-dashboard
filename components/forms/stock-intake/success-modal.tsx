"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardList, FileText } from "lucide-react";

interface StockIntakeSuccessModalProps {
  open: boolean;
  count: number;
  receiptId: string | undefined;
  onViewGRN: () => void;
  onViewAll: () => void;
}

export function StockIntakeSuccessModal({
  open,
  count,
  receiptId,
  onViewGRN,
  onViewAll,
}: StockIntakeSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <DialogTitle className="text-lg">Stock Intake Recorded</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {count === 1
              ? "You have successfully recorded a stock intake."
              : `You have successfully recorded ${count} stock intakes.`}{" "}
            Would you like to view the Goods Received Note?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button variant="outline" className="flex-1" onClick={onViewAll}>
            <ClipboardList className="w-4 h-4 mr-2" />
            View All Stock Intakes
          </Button>
          {receiptId && (
            <Button className="flex-1" onClick={onViewGRN}>
              <FileText className="w-4 h-4 mr-2" />
              View GRN
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
