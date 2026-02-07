"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Package } from "lucide-react";

interface StockIntakeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockIntakeSelectionDialog({
  open,
  onOpenChange,
}: StockIntakeSelectionDialogProps) {
  const router = useRouter();

  const handleNormalIntake = () => {
    onOpenChange(false);
    router.push("/stock-intakes/new");
  };

  const handleLPOIntake = () => {
    onOpenChange(false);
    router.push("/stock-intakes/accepted-purchase-orders");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Stock Intake</DialogTitle>
          <DialogDescription>
            Choose how you want to record your stock intake
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={handleNormalIntake}
          >
            <Package className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Normal Entry</div>
              <div className="text-xs text-muted-foreground">
                Manually record stock intake
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={handleLPOIntake}
          >
            <FileText className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">From Purchase Order</div>
              <div className="text-xs text-muted-foreground">
                Select from existing LPOs
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
