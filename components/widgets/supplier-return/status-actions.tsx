"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Send,
  PackageCheck,
  XCircle,
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
import type { SupplierReturn } from "@/types/supplier-return/type";
import {
  canCancelReturn,
  canCompleteReturn,
  canConfirmReturn,
  canDispatchReturn,
} from "@/types/supplier-return/type";
import {
  cancelSupplierReturn,
  completeSupplierReturn,
  confirmSupplierReturn,
  dispatchSupplierReturn,
} from "@/lib/actions/supplier-return-actions";

interface Props {
  supplierReturn: SupplierReturn;
}

export function SupplierReturnStatusActions({ supplierReturn }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canConfirmReturn(supplierReturn.status) && (
        <Action
          id={supplierReturn.id}
          verb="confirm"
          label="Confirm"
          Icon={CheckCircle2}
          title="Confirm this return?"
          body="Stock on hand is checked against the items and the supplier is notified the goods are ready to leave."
          fn={confirmSupplierReturn}
        />
      )}
      {canDispatchReturn(supplierReturn.status) && (
        <Action
          id={supplierReturn.id}
          verb="dispatch"
          label="Dispatch"
          Icon={Send}
          title="Dispatch this return?"
          body="RETURN stock movements are recorded and inventory is reduced. This can't be undone."
          fn={dispatchSupplierReturn}
        />
      )}
      {canCompleteReturn(supplierReturn.status) && (
        <Action
          id={supplierReturn.id}
          verb="complete"
          label="Mark Completed"
          Icon={PackageCheck}
          title="Mark as completed?"
          body="The supplier has acknowledged receipt. Marks the credit note as final."
          fn={completeSupplierReturn}
        />
      )}
      {canCancelReturn(supplierReturn.status) && (
        <Action
          id={supplierReturn.id}
          verb="cancel"
          label="Cancel"
          Icon={XCircle}
          variant="ghost"
          title="Cancel this return?"
          body="The return is abandoned before it leaves your premises. No stock movements are recorded."
          fn={cancelSupplierReturn}
        />
      )}
    </div>
  );
}

function Action({
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
        if (!res || res.responseType === "error") {
          toast({
            variant: "destructive",
            title: `Couldn't ${verb}`,
            description: res?.message ?? "Something went wrong.",
          });
          return;
        }
        setOpen(false);
        toast({
          variant: "success",
          title: `${label} successful`,
          description: res.message,
        });
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
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
