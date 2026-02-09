"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Package, Loader2 } from "lucide-react";

interface StockIntakeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockIntakeSelectionDialog({
  open,
  onOpenChange,
}: StockIntakeSelectionDialogProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<"normal" | "lpo" | null>(
    null,
  );

  const handleNormalIntake = () => {
    setIsNavigating("normal");
    router.push("/stock-intakes/new");
  };

  const handleLPOIntake = () => {
    setIsNavigating("lpo");
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
            disabled={isNavigating !== null}
          >
            {isNavigating === "normal" ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Package className="h-8 w-8" />
            )}
            <div className="text-center">
              <div className="font-semibold">Normal Entry</div>
              <div className="text-xs text-muted-foreground">
                {isNavigating === "normal"
                  ? "Loading..."
                  : "Manually record stock intake"}
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={handleLPOIntake}
            disabled={isNavigating !== null}
          >
            {isNavigating === "lpo" ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <FileText className="h-8 w-8" />
            )}
            <div className="text-center">
              <div className="font-semibold">From Purchase Order</div>
              <div className="text-xs text-muted-foreground">
                {isNavigating === "lpo"
                  ? "Loading..."
                  : "Select from existing LPOs"}
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
