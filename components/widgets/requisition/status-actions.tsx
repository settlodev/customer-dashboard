"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  CheckCircle2,
  ThumbsDown,
  FileOutput,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import type { PurchaseRequisition } from "@/types/requisition/type";
import {
  canApproveRequisition,
  canCancelRequisition,
  canConvertRequisition,
  canSubmitRequisition,
} from "@/types/requisition/type";
import {
  approveRequisition,
  cancelRequisition,
  convertRequisitionToLpo,
  rejectRequisition,
  submitRequisition,
} from "@/lib/actions/requisition-actions";

interface Props {
  requisition: PurchaseRequisition;
}

export function RequisitionStatusActions({ requisition }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canSubmitRequisition(requisition.status) && (
        <SubmitAction id={requisition.id} />
      )}
      {canApproveRequisition(requisition.status) && (
        <>
          <ApproveAction id={requisition.id} />
          <RejectAction id={requisition.id} />
        </>
      )}
      {canConvertRequisition(requisition.status) && (
        <ConvertAction id={requisition.id} items={requisition.items} />
      )}
      {canCancelRequisition(requisition.status) && (
        <CancelAction id={requisition.id} />
      )}
    </div>
  );
}

function SimpleAction({
  id,
  verb,
  label,
  Icon,
  variant = "default",
  title,
  body,
  fn,
}: {
  id: string;
  verb: string;
  label: string;
  Icon: typeof Send;
  variant?: "default" | "outline" | "ghost" | "destructive";
  title: string;
  body: string;
  fn: (id: string) => Promise<import("@/types/types").FormResponse>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(() => {
      fn(id).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: `Couldn't ${verb}`,
            description: res.message,
          });
          return;
        }
        toast({ title: label, description: res.message });
        setOpen(false);
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          <Icon className="h-4 w-4 mr-1.5" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmitAction({ id }: { id: string }) {
  return (
    <SimpleAction
      id={id}
      verb="submit"
      label="Submit"
      Icon={Send}
      title="Submit for approval?"
      body="The requisition will move to Submitted and appear in the approver's queue. You can still cancel before approval."
      fn={submitRequisition}
    />
  );
}

function ApproveAction({ id }: { id: string }) {
  return (
    <SimpleAction
      id={id}
      verb="approve"
      label="Approve"
      Icon={CheckCircle2}
      title="Approve this requisition?"
      body="Approval unlocks the convert-to-PO step."
      fn={approveRequisition}
    />
  );
}

function RejectAction({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    if (!reason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Explain why this requisition is being rejected.",
      });
      return;
    }
    startTransition(() => {
      rejectRequisition(id, { reason: reason.trim() }).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't reject",
            description: res.message,
          });
          return;
        }
        toast({ title: "Requisition rejected" });
        setOpen(false);
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
          <ThumbsDown className="h-4 w-4 mr-1.5" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject requisition</DialogTitle>
          <DialogDescription>
            The requester will see your reason. Rejection is permanent.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Why is this requisition being rejected?"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isPending}
        />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Keep
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConvertAction({
  id,
  items,
}: {
  id: string;
  items: PurchaseRequisition["items"];
}) {
  const allAssigned =
    items.length > 0 && items.every((i) => !!i.preferredSupplierId);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    if (allAssigned) {
      startTransition(() => {
        convertRequisitionToLpo(id).then((res) => {
          if (res.responseType === "error") {
            toast({
              variant: "destructive",
              title: "Couldn't convert",
              description: res.message,
            });
            return;
          }
          toast({ title: "Converted to PO", description: res.message });
          setOpen(false);
          router.refresh();
        });
      });
      return;
    }
    setOpen(false);
    router.push(`/purchase-orders/new?fromRequisition=${id}`);
  };

  const body = allAssigned
    ? "One Purchase Order per preferred supplier will be drafted."
    : "Some items don't have a preferred supplier yet. We'll open the Purchase Order form pre-populated with this requisition so you can finish manually.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FileOutput className="h-4 w-4 mr-1.5" /> Convert to PO
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert this requisition?</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {allAssigned ? "Confirm" : "Continue to PO form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelAction({ id }: { id: string }) {
  return (
    <SimpleAction
      id={id}
      verb="cancel"
      label="Cancel"
      Icon={XCircle}
      variant="ghost"
      title="Cancel this requisition?"
      body="The record will be marked cancelled. Cannot be reversed."
      fn={cancelRequisition}
    />
  );
}
