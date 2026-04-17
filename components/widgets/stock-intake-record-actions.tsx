"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { confirmStockIntakeRecord, cancelStockIntakeRecord } from "@/lib/actions/stock-intake-record-actions";
import { useToast } from "@/hooks/use-toast";

export default function StockIntakeRecordActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await confirmStockIntakeRecord(id);
        toast({ variant: "success", title: "Confirmed", description: "Stock intake has been confirmed and inventory updated." });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to confirm stock intake." });
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelStockIntakeRecord(id);
        toast({ variant: "success", title: "Cancelled", description: "Stock intake has been cancelled." });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to cancel stock intake." });
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleConfirm} disabled={isPending}>
        <Check className="w-4 h-4 mr-1" /> Confirm
      </Button>
      <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending}>
        <X className="w-4 h-4 mr-1" /> Cancel
      </Button>
    </div>
  );
}
