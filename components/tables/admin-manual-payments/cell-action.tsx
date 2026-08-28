"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { approveManualPayment } from "@/lib/actions/admin/billing";
import { ProofPreviewDialog } from "@/components/tables/admin-manual-payments/proof-preview-dialog";
import { ManualPaymentResponse } from "@/types/admin/billing";

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function ManualPaymentRowActions({ payment }: { payment: ManualPaymentResponse }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);

  const hasProof = Boolean(payment.proofStoragePath);
  const viewProofButton = hasProof && (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => setPreviewOpen(true)}
      title="View proof"
    >
      <Eye className="h-3.5 w-3.5" />
    </Button>
  );

  const handleApprove = () => {
    // Approving marks the invoice paid and activates the subscription
    // immediately — no undo, so confirm before firing.
    if (
      !confirm(
        `Approve payment of ${formatMoney(payment.amount)} for invoice ${payment.invoiceNumber ?? payment.invoiceId}? This marks the invoice paid and activates the subscription.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      // approveManualPayment takes a businessId for revalidatePath; pass a
      // placeholder when it couldn't be resolved — the queue is what we refresh.
      const businessId = payment.businessId ?? "_";
      const result = await approveManualPayment(businessId, payment.id);
      if (result.responseType === "error") {
        toast({
          title: "Approval failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {viewProofButton}
        {payment.status === "PENDING" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={handleApprove}
            className="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            )}
            Approve
          </Button>
        ) : (
          payment.businessId && (
            <Button
              asChild
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-ink"
            >
              <Link href={`/businesses/${payment.businessId}/billing`}>
                View business billing
              </Link>
            </Button>
          )
        )}
      </div>
      {previewOpen && (
        <ProofPreviewDialog payment={payment} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  );
}
