"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  ClipboardList,
  Trophy,
  FileOutput,
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
import type { Rfq } from "@/types/rfq/type";
import {
  canCancelRfq,
  canConvertRfq,
  canEvaluateRfq,
  canSendRfq,
} from "@/types/rfq/type";
import {
  cancelRfq,
  convertRfqToLpo,
  evaluateRfq,
  sendRfq,
} from "@/lib/actions/rfq-actions";

interface Props {
  rfq: Rfq;
}

export function RfqStatusActions({ rfq }: Props) {
  const submittedQuotes = rfq.quotes.filter((q) => q.status !== "PENDING").length;
  const totalQuotes = rfq.quotes.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canSendRfq(rfq.status) && (
        <Action
          id={rfq.id}
          verb="send"
          label="Send"
          Icon={Send}
          title="Send this RFQ to suppliers?"
          body="Invited suppliers will be notified. Status moves to SENT. You cannot edit items once sent."
          fn={sendRfq}
        />
      )}
      {canEvaluateRfq(rfq.status) && (
        <Action
          id={rfq.id}
          verb="evaluate"
          label="Mark Evaluated"
          Icon={ClipboardList}
          title={`Mark ${submittedQuotes} of ${totalQuotes} quotes as evaluated?`}
          body="Evaluation locks in the comparison. You can still cancel the whole RFQ before awarding."
          fn={evaluateRfq}
        />
      )}
      {canConvertRfq(rfq.status) && (
        <Action
          id={rfq.id}
          verb="convert"
          label="Convert to LPO"
          Icon={FileOutput}
          title="Convert the awarded quote to an LPO?"
          body="A new LPO is created for the winning supplier, using quoted prices and lead times. Supplier pricing records are updated."
          fn={convertRfqToLpo}
        />
      )}
      {canCancelRfq(rfq.status) && (
        <Action
          id={rfq.id}
          verb="cancel"
          label="Cancel"
          Icon={XCircle}
          variant="ghost"
          title="Cancel this RFQ?"
          body="Suppliers will see the RFQ is closed and no further quotes will be accepted."
          fn={cancelRfq}
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

export function AwardTrophyIcon() {
  return <Trophy className="h-4 w-4 mr-1.5" />;
}
