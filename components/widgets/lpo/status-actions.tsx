"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  CheckCircle2,
  PackageCheck,
  Package,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
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
import type { Lpo, LpoStatus } from "@/types/lpo/type";
import {
  canCancelLpo,
  canDeleteLpo,
  LPO_NEXT_STATUSES,
  LPO_STATUS_LABELS,
} from "@/types/lpo/type";
import {
  deleteLpo,
  updateLpoStatus,
} from "@/lib/actions/lpo-actions";

interface Props {
  lpo: Lpo;
}

interface TransitionDef {
  status: LpoStatus;
  label: string;
  Icon: typeof Send;
  variant?: "default" | "outline";
  confirmTitle: string;
  confirmBody: string;
}

const TRANSITIONS: Partial<Record<LpoStatus, TransitionDef>> = {
  SUBMITTED: {
    status: "SUBMITTED",
    label: "Submit",
    Icon: Send,
    variant: "default",
    confirmTitle: "Submit this LPO?",
    confirmBody:
      "The LPO moves from Draft to Submitted and is ready for approval. This is reversible by cancelling.",
  },
  APPROVED: {
    status: "APPROVED",
    label: "Approve",
    Icon: CheckCircle2,
    variant: "default",
    confirmTitle: "Approve this LPO?",
    confirmBody:
      "Approval unlocks GRN receiving against this LPO. It can still be cancelled before anything is received.",
  },
  PARTIALLY_RECEIVED: {
    status: "PARTIALLY_RECEIVED",
    label: "Mark Partial",
    Icon: Package,
    variant: "outline",
    confirmTitle: "Mark as Partially Received?",
    confirmBody:
      "Use this only if you need to manually flag a partial receipt — GRNs normally auto-advance this status.",
  },
  RECEIVED: {
    status: "RECEIVED",
    label: "Mark Received",
    Icon: PackageCheck,
    variant: "default",
    confirmTitle: "Mark as Received?",
    confirmBody:
      "Flags the order fully received. GRNs usually auto-advance this. Cannot be reversed or cancelled.",
  },
};

export function LpoStatusActions({ lpo }: Props) {
  const nextStatuses = LPO_NEXT_STATUSES[lpo.status];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStatuses.map((next) => {
        const def = TRANSITIONS[next];
        if (!def) return null;
        return (
          <TransitionButton key={next} lpoId={lpo.id} def={def} />
        );
      })}
      {canCancelLpo(lpo.status) && (
        <CancelButton lpoId={lpo.id} lpoNumber={lpo.lpoNumber} />
      )}
      {canDeleteLpo(lpo.status) && (
        <DeleteButton lpoId={lpo.id} lpoNumber={lpo.lpoNumber} />
      )}
    </div>
  );
}

function TransitionButton({
  lpoId,
  def,
}: {
  lpoId: string;
  def: TransitionDef;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(() => {
      updateLpoStatus(lpoId, { status: def.status }).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't update status",
            description: res.message,
          });
          return;
        }
        toast({
          title: `LPO ${LPO_STATUS_LABELS[def.status]}`,
          description: res.message,
        });
        setOpen(false);
        router.refresh();
      });
    });
  };

  const Icon = def.Icon;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={def.variant ?? "default"}>
          <Icon className="h-4 w-4 mr-1.5" /> {def.label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{def.confirmTitle}</DialogTitle>
          <DialogDescription>{def.confirmBody}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelButton({ lpoId, lpoNumber }: { lpoId: string; lpoNumber: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(() => {
      updateLpoStatus(lpoId, { status: "CANCELLED" }).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't cancel LPO",
            description: res.message,
          });
          return;
        }
        toast({ title: "LPO cancelled", description: res.message });
        setOpen(false);
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-red-600 hover:bg-red-50">
          <XCircle className="h-4 w-4 mr-1.5" /> Cancel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel {lpoNumber}?</DialogTitle>
          <DialogDescription>
            The LPO will be marked cancelled. Any GRNs already received against
            it remain unaffected.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Keep
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancel LPO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteButton({ lpoId, lpoNumber }: { lpoId: string; lpoNumber: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(() => {
      deleteLpo(lpoId).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't delete LPO",
            description: res.message,
          });
          return;
        }
        toast({ title: "LPO deleted", description: res.message });
        setOpen(false);
        router.push("/stock-purchases");
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-red-600 hover:bg-red-50">
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete Draft
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {lpoNumber}?</DialogTitle>
          <DialogDescription>
            Only DRAFT LPOs can be deleted. The record is soft-deleted and won&apos;t
            appear in listings. Cannot be undone from the dashboard.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Keep
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
