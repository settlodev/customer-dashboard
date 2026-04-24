"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import {
  confirmStockIntakeRecord,
  cancelStockIntakeRecord,
} from "@/lib/actions/stock-intake-record-actions";
import { useToast } from "@/hooks/use-toast";

export default function StockIntakeRecordActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await confirmStockIntakeRecord(id);
      if (res?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Could not confirm",
          description: res.message,
        });
      } else if (res?.responseType === "success") {
        toast({
          variant: "success",
          title: "Confirmed",
          description: res.message,
        });
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const res = await cancelStockIntakeRecord(id);
      if (res?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Could not cancel",
          description: res.message,
        });
      } else if (res?.responseType === "success") {
        toast({
          variant: "success",
          title: "Cancelled",
          description: res.message,
        });
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
