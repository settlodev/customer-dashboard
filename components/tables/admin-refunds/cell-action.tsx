"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { processRefund, rejectRefund } from "@/lib/actions/admin/billing";
import { RefundResponse } from "@/types/admin/billing";

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function RefundRowActions({ refund }: { refund: RefundResponse }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleAction = (kind: "approve" | "reject") => {
    // Approval moves money; reject is recoverable but PENDING is the only
    // state both buttons act on, so a misclick means re-asking the customer.
    const verb = kind === "approve" ? "Approve" : "Reject";
    if (
      !confirm(
        `${verb} refund of ${formatMoney(refund.amount)} for invoice ${refund.invoiceNumber}?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      // Both actions take a businessId for revalidatePath; pass a placeholder
      // for prospect invoices (no business) — the queue is what we refresh.
      const businessId = refund.businessId ?? "_";
      const result = await (kind === "approve"
        ? processRefund(businessId, refund.id)
        : rejectRefund(businessId, refund.id));
      if (result.responseType === "error") {
        toast({
          title: kind === "approve" ? "Approval failed" : "Reject failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  if (refund.status === "PENDING") {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => handleAction("approve")}
          className="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          )}
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => handleAction("reject")}
          className="text-destructive hover:bg-destructive/10"
        >
          <XCircle className="mr-1 h-3.5 w-3.5" />
          Reject
        </Button>
      </div>
    );
  }

  if (refund.businessId) {
    return (
      <div className="flex justify-end">
        <Button
          asChild
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-ink"
        >
          <Link href={`/businesses/${refund.businessId}/billing`}>
            View business billing
          </Link>
        </Button>
      </div>
    );
  }

  return null;
}
