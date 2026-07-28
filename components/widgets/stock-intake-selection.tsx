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
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base sm:text-lg">
            Record Stock Intake
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Choose how you want to record your stock intake
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-2 sm:gap-4 sm:py-4">
          <Button
            variant="outline"
            className="h-auto flex flex-col items-center justify-center gap-2 py-4 px-3 sm:h-24 sm:py-0"
            onClick={handleNormalIntake}
            disabled={isNavigating !== null}
          >
            {isNavigating === "normal" ? (
              <Loader2 className="h-6 w-6 animate-spin sm:h-8 sm:w-8" />
            ) : (
              <Package className="h-6 w-6 sm:h-8 sm:w-8" />
            )}
            <div className="text-center">
              <div className="font-semibold text-xs sm:text-sm">
                Normal Entry
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                {isNavigating === "normal"
                  ? "Loading..."
                  : "Manually record stock intake"}
              </div>
              {isNavigating === "normal" && (
                <div className="text-xs text-muted-foreground sm:hidden">
                  Loading...
                </div>
              )}
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex flex-col items-center justify-center gap-2 py-4 px-3 sm:h-24 sm:py-0"
            onClick={handleLPOIntake}
            disabled={isNavigating !== null}
          >
            {isNavigating === "lpo" ? (
              <Loader2 className="h-6 w-6 animate-spin sm:h-8 sm:w-8" />
            ) : (
              <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
            )}
            <div className="text-center">
              <div className="font-semibold text-xs sm:text-sm">
                Purchase Order
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                {isNavigating === "lpo"
                  ? "Loading..."
                  : "Select from existing LPOs"}
              </div>
              {isNavigating === "lpo" && (
                <div className="text-xs text-muted-foreground sm:hidden">
                  Loading...
                </div>
              )}
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
