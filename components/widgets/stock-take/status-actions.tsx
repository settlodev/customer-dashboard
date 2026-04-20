"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, CheckCircle2, ThumbsUp, XCircle, Loader2 } from "lucide-react";
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
import type { StockTake } from "@/types/stock-take/type";
import {
  canStartStockTake,
  canCompleteStockTake,
  canApproveStockTake,
  canCancelStockTake,
} from "@/types/stock-take/type";
import {
  approveStockTake,
  cancelStockTake,
  completeStockTake,
  startStockTake,
} from "@/lib/actions/stock-take-actions";

interface Props {
  stockTake: StockTake;
}

export function StockTakeStatusActions({ stockTake }: Props) {
  const uncounted = (stockTake.totalItems ?? 0) - (stockTake.itemsCounted ?? 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canStartStockTake(stockTake.status) && (
        <Action
          id={stockTake.id}
          verb="start"
          label="Start"
          Icon={Play}
          title="Start the stock take?"
          body="We&apos;ll snapshot the current on-hand quantities as 'expected'. Counters can then record actuals."
          fn={startStockTake}
        />
      )}
      {canCompleteStockTake(stockTake.status) && (
        <Action
          id={stockTake.id}
          verb="complete"
          label="Complete counting"
          Icon={CheckCircle2}
          title={`Complete counting${uncounted > 0 ? ` with ${uncounted} uncounted item${uncounted === 1 ? "" : "s"}?` : "?"}`}
          body="The take moves to Completed and is queued for approval. Approving records variance adjustments."
          fn={completeStockTake}
        />
      )}
      {canApproveStockTake(stockTake.status) && (
        <Action
          id={stockTake.id}
          verb="approve"
          label="Approve"
          Icon={ThumbsUp}
          title="Approve this stock take?"
          body="Approval generates RECOUNT stock modifications for every variance. This is the point where on-hand balances actually change."
          fn={approveStockTake}
        />
      )}
      {canCancelStockTake(stockTake.status) && (
        <Action
          id={stockTake.id}
          verb="cancel"
          label="Cancel"
          Icon={XCircle}
          variant="ghost"
          title="Cancel this stock take?"
          body="Counts already recorded will be kept for audit but no adjustments are made."
          fn={cancelStockTake}
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
  Icon: typeof Play;
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
