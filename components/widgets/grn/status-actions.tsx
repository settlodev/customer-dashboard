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
  pendingInspection,
  fromInspection,
}: {
  grnId: string;
  pendingInspection: boolean;
  fromInspection: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(() => {
      receiveGrn(grnId).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't receive GRN",
            description: res.message,
          });
          return;
        }
        toast({ title: "GRN received", description: res.message });
        setOpen(false);
        router.refresh();
      });
    });
  };

  return (
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
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't place on inspection hold",
            description: res.message,
          });
          return;
        }
        toast({ title: "Placed on inspection hold", description: res.message });
        setOpen(false);
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
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't cancel GRN",
            description: res.message,
          });
          return;
        }
        toast({ title: "GRN cancelled", description: res.message });
        setOpen(false);
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
