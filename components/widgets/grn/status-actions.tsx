"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardCheck, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Grn, GrnItem } from "@/types/grn/type";
import {
  cancelGrn,
  receiveGrn,
  submitGrnForInspection,
} from "@/lib/actions/grn-actions";
import { useLocationConfig } from "@/hooks/use-location-config";
import ExpensePaymentForm from "@/components/forms/expense_payment_form";
import { resolveBillForLpo } from "@/lib/actions/grn-bill-actions";
import { grnDeliveryValue, computeBillPrefill } from "@/lib/grn-utils";
import type { Expense } from "@/types/expense/type";

interface Props {
  grn: Grn;
}

export function GrnStatusActions({ grn }: Props) {
  const { config } = useLocationConfig();
  const qualityInspectionEnabled = config?.qualityInspectionEnabled ?? false;

  const canReceive = grn.status === "DRAFT" || grn.status === "INSPECTION_HOLD";
  const canSubmitForInspection =
    grn.status === "DRAFT" && qualityInspectionEnabled;
  const canCancel = grn.status === "DRAFT";
  const pendingInspection =
    grn.status === "INSPECTION_HOLD" && hasPendingInspection(grn.items);

  if (!canReceive && !canSubmitForInspection && !canCancel) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canSubmitForInspection && <InspectionHoldButton grnId={grn.id} />}
      {canReceive && (
        <ReceiveButton
          grnId={grn.id}
          lpoId={grn.lpoId}
          items={grn.items}
          pendingInspection={pendingInspection}
          fromInspection={grn.status === "INSPECTION_HOLD"}
        />
      )}
      {canCancel && <CancelButton grnId={grn.id} grnNumber={grn.grnNumber} />}
    </div>
  );
}

function hasPendingInspection(items: GrnItem[]): boolean {
  return items.some(
    (item) => !item.inspectionStatus || item.inspectionStatus === "PENDING",
  );
}

function ReceiveButton({
  grnId,
  lpoId,
  items,
  pendingInspection,
  fromInspection,
}: {
  grnId: string;
  lpoId: string | null;
  items: GrnItem[];
  pendingInspection: boolean;
  fromInspection: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  // Post-receive payment prompt state.
  const [payExpense, setPayExpense] = useState<Expense | null>(null);
  const [payPrefill, setPayPrefill] = useState(0);
  const [payOpen, setPayOpen] = useState(false);

  const onConfirm = () => {
    startTransition(() => {
      receiveGrn(grnId).then(async (res) => {
        if (!res || res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't receive GRN",
            description: res?.message ?? "Something went wrong.",
          });
          return;
        }
        setOpen(false);
        toast({
          variant: "success",
          title: "GRN received",
          description: res.message,
        });

        // Offer to settle the supplier bill at the receipt moment.
        // Best-effort: any bill-resolution failure must never disrupt the
        // already-successful receipt — fall through to a normal refresh.
        if (lpoId) {
          try {
            const resolution = await resolveBillForLpo(lpoId);
            if (
              resolution &&
              resolution.expense.status === "APPROVED" &&
              resolution.expense.paymentStatus !== "PAID"
            ) {
              setPayExpense(resolution.expense);
              setPayPrefill(
                computeBillPrefill(
                  grnDeliveryValue(items),
                  resolution.expense.balanceDue,
                  resolution.lpoFullyReceived,
                ),
              );
              setPayOpen(true);
              return; // defer refresh until the payment sheet closes
            }
          } catch {
            // ignore — receipt already succeeded; just refresh below
          }
        }
        router.refresh();
      });
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="default" disabled={pendingInspection}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Receive into Inventory
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receive this GRN?</DialogTitle>
            <DialogDescription>
              {fromInspection
                ? "Only items marked PASSED or PARTIAL will be added to inventory. Failed items stay out. This action can't be undone."
                : "Stock will be added to inventory, batches will be created, and serial numbers registered. This action can't be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Receive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {payExpense && (
        <ExpensePaymentForm
          expense={payExpense}
          prefillAmount={payPrefill}
          open={payOpen}
          onOpenChange={(o) => {
            setPayOpen(o);
            if (!o) router.refresh();
          }}
          onRecorded={() => setPayOpen(false)}
        />
      )}
    </>
  );
}

function InspectionHoldButton({ grnId }: { grnId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(() => {
      submitGrnForInspection(grnId).then((res) => {
        if (!res || res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't place on inspection hold",
            description: res?.message ?? "Something went wrong.",
          });
          return;
        }
        setOpen(false);
        toast({
          variant: "success",
          title: "Placed on inspection hold",
          description: res.message,
        });
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ClipboardCheck className="h-4 w-4 mr-1.5" /> Submit for Inspection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place this GRN on inspection hold?</DialogTitle>
          <DialogDescription>
            Stock will not enter inventory until you record an inspection outcome
            for each item and receive the GRN. Only available when quality
            inspection is enabled for this location.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelButton({
  grnId,
  grnNumber,
}: {
  grnId: string;
  grnNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(() => {
      cancelGrn(grnId).then((res) => {
        if (!res || res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't cancel GRN",
            description: res?.message ?? "Something went wrong.",
          });
          return;
        }
        setOpen(false);
        toast({
          variant: "destructive",
          title: "GRN cancelled",
          description: res.message,
        });
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-red-600 hover:bg-red-50">
          <XCircle className="h-4 w-4 mr-1.5" /> Cancel GRN
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel {grnNumber}?</DialogTitle>
          <DialogDescription>
            The GRN will be marked cancelled. No stock movements will be created.
            This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Keep
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancel GRN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
