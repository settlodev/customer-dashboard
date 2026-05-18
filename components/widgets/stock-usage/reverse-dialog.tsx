"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { reverseStockUsage } from "@/lib/actions/stock-usage-actions";

interface Props {
  usageId: string;
  usageNumber: string;
}

/**
 * Reversal entry point on the usage detail page. Captures the required
 * reason in an AlertDialog and calls {@code reverseStockUsage}. On success
 * Next.js revalidates the page so the new REVERSED status renders without
 * a full reload.
 */
export default function ReverseStockUsageDialog({ usageId, usageNumber }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = () => {
    setError(null);
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Reason is required");
      return;
    }
    startTransition(() => {
      reverseStockUsage(usageId, { reason: trimmed }).then((data) => {
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't reverse usage",
            description: data.message,
          });
          setError(data.message ?? "Reversal failed");
          return;
        }
        toast({
          title: "Stock usage reversed",
          description: `${usageNumber} has been voided and stock restored.`,
        });
        setOpen(false);
        setReason("");
        router.refresh();
      });
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reverse
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent tone="danger">
        <AlertDialogIcon>
          <RotateCcw className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>Reverse {usageNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            Stock is returned to inventory, batches restored, and any consumed
            serial-tracked units flipped back to AVAILABLE. This action is
            permanent — a reversed record cannot be re-activated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reverse-reason" className="text-xs">
            Reason <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="reverse-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this usage being reversed?"
            rows={3}
            disabled={isPending}
          />
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          {/* Plain Button (not AlertDialogAction) so the dialog stays open
              while the server action runs and only closes on success. */}
          <Button variant="destructive" onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Reversing…
              </>
            ) : (
              <>Confirm reversal</>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
