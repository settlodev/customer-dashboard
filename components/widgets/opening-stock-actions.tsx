"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { confirmOpeningStock, cancelOpeningStock } from "@/lib/actions/opening-stock-actions";
import { useToast } from "@/hooks/use-toast";

export default function OpeningStockActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await confirmOpeningStock(id);
        toast({ variant: "success", title: "Confirmed", description: "Opening stock has been confirmed and inventory updated." });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to confirm opening stock." });
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelOpeningStock(id);
        toast({ variant: "success", title: "Cancelled", description: "Opening stock has been cancelled." });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to cancel opening stock." });
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
