"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  PackageCheck,
  Send,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  PackagePlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import type { StockTransfer, TransferStatus } from "@/types/stock-transfer/type";
import {
  acceptTransfer,
  cancelTransfer,
  confirmReturnTransfer,
  confirmTransfer,
  declineTransfer,
  dispatchTransfer,
  receiveTransfer,
  returnTransfer,
} from "@/lib/actions/stock-transfer-actions";
import StaffSelectorWidget from "../staff_selector_widget";

interface Props {
  transfer: StockTransfer;
}

/**
 * Status-aware action buttons for stock transfers. The lifecycle depends on
 * `transferType`:
 *   - SUPPLY / RETURN / RETURN_TO_STORE:
 *       REQUESTED → CONFIRMED → DISPATCHED → (PARTIALLY_)RECEIVED / CANCELLED
 *   - INTER_LOCATION:
 *       REQUESTED → ACCEPTED → CONFIRMED → DISPATCHED → RECEIVED
 *                 or DECLINED → RETURN_IN_TRANSIT → RETURNED
 */
export function StockTransferStatusActions({ transfer }: Props) {
  const { status, transferType } = transfer;
  const isInterLocation = transferType === "INTER_LOCATION";

  const showConfirm =
    status === "REQUESTED" ||
    (status === "ACCEPTED" && isInterLocation);
  const showAccept = status === "REQUESTED" && isInterLocation;
  const showDecline = status === "REQUESTED" && isInterLocation;
  const showDispatch = status === "CONFIRMED";
  const showReceive =
    status === "DISPATCHED" || status === "PARTIALLY_RECEIVED";
  const showReturn = status === "DECLINED" && isInterLocation;
  const showConfirmReturn = status === "RETURN_IN_TRANSIT";
  const showCancel = CANCELLABLE.includes(status);

  const anyVisible =
    showConfirm ||
    showAccept ||
    showDecline ||
    showDispatch ||
    showReceive ||
    showReturn ||
    showConfirmReturn ||
    showCancel;

  if (!anyVisible) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showAccept && <AcceptButton id={transfer.id} />}
      {showDecline && <DeclineButton id={transfer.id} />}
      {showConfirm && <ConfirmButton id={transfer.id} />}
      {showDispatch && <DispatchButton id={transfer.id} />}
      {showReceive && <ReceiveButton transfer={transfer} />}
      {showReturn && <ReturnButton id={transfer.id} />}
      {showConfirmReturn && <ConfirmReturnButton id={transfer.id} />}
      {showCancel && <CancelButton id={transfer.id} />}
    </div>
  );
}

const CANCELLABLE: TransferStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "CONFIRMED",
];

// ── Individual buttons ───────────────────────────────────────────────

function ActionButton({
  label,
  Icon,
  title,
  body,
  onConfirm,
  variant = "default",
}: {
  label: string;
  Icon: typeof CheckCircle2;
  title: string;
  body: string;
  onConfirm: () => Promise<void> | void;
  variant?: "default" | "outline" | "ghost" | "destructive";
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handle = () => {
    startTransition(async () => {
      try {
        await onConfirm();
        toast({ title: `${label} complete` });
        setOpen(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: `Couldn't ${label.toLowerCase()}`,
          description: error?.message ?? "Request failed",
        });
      }
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
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handle}
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

function AcceptButton({ id }: { id: string }) {
  return (
    <ActionButton
      label="Accept"
      Icon={ThumbsUp}
      variant="outline"
      title="Accept this transfer request?"
      body="Accepting tells the source location you agree to receive these items. They'll then confirm and dispatch."
      onConfirm={() => acceptTransfer(id)}
    />
  );
}

function DeclineButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(async () => {
      try {
        await declineTransfer(id, reason.trim() || undefined);
        toast({ title: "Transfer declined" });
        setOpen(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't decline",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-red-600 hover:bg-red-50">
          <ThumbsDown className="h-4 w-4 mr-1.5" /> Decline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline transfer request</DialogTitle>
          <DialogDescription>
            The source location will be notified. They can then request the
            items be returned.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason (optional)</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this transfer being declined?"
            rows={3}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Keep
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmButton({ id }: { id: string }) {
  return (
    <ActionButton
      label="Confirm"
      Icon={CheckCircle2}
      title="Confirm this transfer?"
      body="Stock will be moved from on-hand into in-transit. You can still cancel before dispatch."
      onConfirm={() => confirmTransfer(id)}
    />
  );
}

function DispatchButton({ id }: { id: string }) {
  return (
    <ActionButton
      label="Dispatch"
      Icon={Send}
      title="Dispatch this transfer?"
      body="Mark the shipment sent. The destination will receive it next."
      onConfirm={() => dispatchTransfer(id)}
    />
  );
}

function ReturnButton({ id }: { id: string }) {
  return (
    <ActionButton
      label="Return to Source"
      Icon={RotateCcw}
      variant="outline"
      title="Return this declined transfer?"
      body="Items start moving back to the source location. They'll confirm on arrival."
      onConfirm={() => returnTransfer(id)}
    />
  );
}

function ConfirmReturnButton({ id }: { id: string }) {
  return (
    <ActionButton
      label="Confirm Return"
      Icon={PackageCheck}
      title="Confirm return received?"
      body="Stock comes back into the source location's on-hand balance."
      onConfirm={() => confirmReturnTransfer(id)}
    />
  );
}

function CancelButton({ id }: { id: string }) {
  return (
    <ActionButton
      label="Cancel"
      Icon={XCircle}
      variant="ghost"
      title="Cancel this transfer?"
      body="Any reserved in-transit stock is released. This can't be undone."
      onConfirm={() => cancelTransfer(id)}
    />
  );
}

// ── Receive dialog — supports partial quantities per item ─────────────

function ReceiveButton({ transfer }: { transfer: StockTransfer }) {
  const [open, setOpen] = useState(false);
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    transfer.items.forEach((item) => {
      const outstanding = Math.max(
        0,
        item.quantity - Number(item.receivedQuantity ?? 0),
      );
      initial[item.id] = outstanding;
    });
    return initial;
  });

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const totalReceiving = useMemo(
    () => Object.values(quantities).reduce((s, q) => s + q, 0),
    [quantities],
  );

  const setQty = (itemId: string, value: number) =>
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, value) }));

  const onConfirm = () => {
    if (!receivedBy) {
      toast({
        variant: "destructive",
        title: "Select the receiver",
        description: "Pick a staff member who received the goods.",
      });
      return;
    }
    if (totalReceiving <= 0) {
      toast({
        variant: "destructive",
        title: "Nothing to receive",
        description: "Enter at least one quantity greater than zero.",
      });
      return;
    }
    const items = transfer.items.map((item) => ({
      stockVariantId: item.stockVariantId,
      receivedQuantity: quantities[item.id] ?? 0,
    }));
    startTransition(async () => {
      try {
        await receiveTransfer(transfer.id, receivedBy, items, notes.trim() || undefined);
        toast({ title: "Transfer received into inventory" });
        setOpen(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't receive",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PackagePlus className="h-4 w-4 mr-1.5" /> Receive
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive transfer {transfer.transferNumber}</DialogTitle>
          <DialogDescription>
            Adjust quantities if the shipment was partial. A follow-up receive
            can handle the rest.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Received by</label>
              <StaffSelectorWidget
                label="Received by"
                placeholder="Select staff"
                value={receivedBy}
                onChange={setReceivedBy}
                onBlur={() => {}}
                isDisabled={isPending}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional — condition, short-shipment cause…"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Sent</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Already received</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase w-36">Receiving now</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transfer.items.map((item) => {
                  const already = Number(item.receivedQuantity ?? 0);
                  const outstanding = Math.max(0, item.quantity - already);
                  const value = quantities[item.id] ?? 0;
                  const overshoot = value > outstanding;
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-medium">{item.variantName}</td>
                      <td className="px-3 py-2 text-right">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {already.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <NumericFormat
                          customInput={Input}
                          value={value}
                          onValueChange={(v) =>
                            setQty(item.id, v.value ? Number(v.value) : 0)
                          }
                          thousandSeparator
                          decimalScale={6}
                          allowNegative={false}
                          disabled={isPending}
                          className={overshoot ? "border-amber-400" : undefined}
                        />
                        {overshoot && (
                          <p className="text-[10px] text-amber-700 mt-0.5">
                            More than outstanding ({outstanding.toLocaleString()})
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/60 font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right">Total receiving</td>
                  <td className="px-3 py-2 text-right">
                    {totalReceiving.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
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
