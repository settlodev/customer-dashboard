"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Link2,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import type {
  StockTransfer,
  StockTransferItem,
  TransferStatus,
} from "@/types/stock-transfer/type";
import type { Stock } from "@/types/stock/type";
import {
  getCachedStocks,
  invalidateStocksCache,
} from "@/lib/cache/reference-data";
import {
  acceptTransfer,
  cancelTransfer,
  confirmReturnTransfer,
  confirmTransfer,
  declineTransfer,
  dispatchTransfer,
  receiveTransfer,
  reconcileTransferLine,
  rejectTransfer,
  returnTransfer,
} from "@/lib/actions/stock-transfer-actions";

interface Props {
  transfer: StockTransfer;
  /**
   * The active destination's id (X-Location-Id). Decides which side of the
   * transfer the viewer is on:
   *   - id === transfer.sourceLocationId       → source
   *   - id === transfer.destinationLocationId  → destination
   */
  activeDestinationId: string | null;
}

/**
 * Status-aware action buttons for stock transfers — gated both by status and
 * by which side of the transfer the current viewer is on, so the source and
 * destination each only ever see the action that's actually theirs to take.
 *
 * When a transfer needs destination approval (`awaitingApproval` — the backend's
 * additive rule: location→location OR the destination's require_transfer_approval),
 * the destination Accepts or Rejects while it's REQUESTED, and the source can only
 * Confirm once it's ACCEPTED. Otherwise the source Confirms straight from REQUESTED:
 *   REQUESTED → [ACCEPTED] → CONFIRMED → DISPATCHED → (PARTIALLY_)RECEIVED / CANCELLED
 *   pending → REJECTED (no stock moved); post-dispatch → DECLINED → [RETURN_IN_TRANSIT] → RETURNED
 */
export function StockTransferStatusActions({ transfer, activeDestinationId }: Props) {
  const { status, awaitingApproval } = transfer;

  const isSource =
    !!activeDestinationId && activeDestinationId === transfer.sourceLocationId;
  const isDestination =
    !!activeDestinationId && activeDestinationId === transfer.destinationLocationId;

  const showAccept = awaitingApproval && isDestination;
  const showReject = awaitingApproval && isDestination;
  // A pending transfer awaiting approval blocks Confirm until it's Accepted;
  // one that needs no approval is confirmable straight from REQUESTED.
  const showConfirm =
    ((status === "REQUESTED" && !awaitingApproval) || status === "ACCEPTED") &&
    isSource;
  const showDispatch = status === "CONFIRMED" && isSource;
  const showReceive =
    (status === "DISPATCHED" || status === "PARTIALLY_RECEIVED") && isDestination;
  // Lines the auto-matcher couldn't map to this destination's catalogue —
  // the receiver links or creates each one; that's the only exit from
  // PENDING_MAPPING (receive/decline are locked until every line is mapped).
  const showMapItems =
    status === "PENDING_MAPPING" &&
    isDestination &&
    transfer.items.some((i) => i.mappingStatus === "PENDING");
  const showDecline =
    (status === "DISPATCHED" || status === "PARTIALLY_RECEIVED") && isDestination;
  const showReturn = status === "DECLINED" && isDestination;
  // The source can confirm receipt of the returned stock straight from DECLINED
  // — the RETURN_IN_TRANSIT hop is worth recording for a multi-day return, but
  // a driver who turns round the same hour shouldn't need it logged before the
  // stock can go back on the shelf. Backend accepts either status.
  const showConfirmReturn =
    (status === "RETURN_IN_TRANSIT" || status === "DECLINED") && isSource;
  const showCancel = CANCELLABLE.includes(status) && isSource;

  const anyVisible =
    showConfirm ||
    showAccept ||
    showReject ||
    showDispatch ||
    showReceive ||
    showMapItems ||
    showDecline ||
    showReturn ||
    showConfirmReturn ||
    showCancel;

  if (!anyVisible) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showAccept && <AcceptButton id={transfer.id} />}
      {showReject && <RejectButton id={transfer.id} />}
      {showConfirm && <ConfirmButton id={transfer.id} />}
      {showDispatch && <DispatchButton id={transfer.id} />}
      {showReceive && <ReceiveButton transfer={transfer} />}
      {showMapItems && <MapItemsButton transfer={transfer} />}
      {showDecline && <DeclineButton id={transfer.id} />}
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

function RejectButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(async () => {
      try {
        await rejectTransfer(id, reason.trim() || undefined);
        toast({ title: "Transfer rejected" });
        setOpen(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't reject",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
          <ThumbsDown className="h-4 w-4 mr-1.5" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject transfer request</DialogTitle>
          <DialogDescription>
            The source location will be notified. Nothing has been dispatched, so
            no stock moves — the transfer is simply closed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason (optional)</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this transfer being rejected?"
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
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        <Button variant="ghost" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
          <ThumbsDown className="h-4 w-4 mr-1.5" /> Decline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline this shipment</DialogTitle>
          <DialogDescription>
            The source location will be notified and asked to arrange a return.
            Use this if the shipment shouldn&apos;t be accepted as-is (wrong
            items, damage, etc).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason (optional)</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this shipment being declined?"
            rows={3}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
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

/**
 * Bespoke (not ActionButton) so the success toast can offer the delivery
 * note — the paper the driver carries — the moment the goods are marked
 * sent. The note also stays available from the detail header afterwards.
 */
function DispatchButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handle = () => {
    startTransition(async () => {
      try {
        await dispatchTransfer(id);
        toast({
          title: "Transfer dispatched",
          description: "Print the delivery note for the driver to carry.",
          action: (
            <ToastAction
              altText="Print delivery note"
              onClick={() =>
                window.open(
                  `/stock-transfers/${id}/print`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Print note
            </ToastAction>
          ),
        });
        setOpen(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't dispatch",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-1.5" /> Dispatch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dispatch this transfer?</DialogTitle>
          <DialogDescription>
            Mark the shipment sent. The destination will receive it next, and
            you&apos;ll be able to print a delivery note for the driver.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handle} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        await receiveTransfer(transfer.id, items, notes.trim() || undefined);
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
      <DialogContent className="max-w-2xl flex flex-col max-h-[calc(100dvh-2rem)] overflow-y-hidden">
        <DialogHeader>
          <DialogTitle>Receive transfer {transfer.transferNumber}</DialogTitle>
          <DialogDescription>
            Adjust quantities if the shipment was partial. A follow-up receive
            can handle the rest.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto">
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

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Item</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Sent</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Already received</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase w-36">Receiving now</th>
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
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                            More than outstanding ({outstanding.toLocaleString()})
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/60 font-semibold">
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

// ── Map-items dialog — resolves PENDING_MAPPING lines ─────────────────

interface LineDecision {
  createNew: boolean;
  variantId: string | null;
  /**
   * Which unit survives when the linked item is tracked in a different unit
   * (a merge): INCOMING = the line's own unit (re-labels the destination
   * item), EXISTING = the destination item's unit (re-labels the item back
   * at the source). Ignored when the units already agree.
   */
  mergeUnit: "INCOMING" | "EXISTING";
}

const UNDECIDED: LineDecision = {
  createNew: false,
  variantId: null,
  mergeUnit: "INCOMING",
};

const normalizeName = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Reconciliation for transfers parked in PENDING_MAPPING: the dispatch
 * auto-matcher found no equivalent in this destination's catalogue for these
 * lines, so nothing was credited for them at receive. Per line the receiver
 * either links a stock item they already carry, or creates it as a brand-new
 * item. Picking an item tracked in a DIFFERENT unit becomes a merge: the two
 * catalogues are unified onto whichever unit the receiver says is correct
 * (quantities keep their numbers — nothing converts) and stay connected as
 * one product. Each mapped line books its full outstanding quantity
 * immediately (one reconcile call per line); partially-decided submissions
 * are fine, the rest can be mapped later.
 */
function MapItemsButton({ transfer }: { transfer: StockTransfer }) {
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<Stock[] | null>(null);
  const [decisions, setDecisions] = useState<Record<string, LineDecision>>({});
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const pendingLines = transfer.items.filter(
    (i) => i.mappingStatus === "PENDING",
  );

  // The active destination IS the receiver here (the button is gated on
  // isDestination), so the cached /stocks list — scoped by the X-Location-Id
  // header — is exactly this destination's catalogue.
  useEffect(() => {
    if (!open || stocks) return;
    let cancelled = false;
    getCachedStocks().then((data) => {
      if (!cancelled) setStocks(data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, stocks]);

  const catalogueVariants = useMemo(() => {
    if (!stocks) return [];
    return stocks
      .filter((s) => !s.archived)
      .flatMap((s) =>
        (s.variants ?? [])
          .filter((v) => !v.archived)
          .map((v) => ({
            id: v.id,
            label: v.displayName || `${s.name} - ${v.name}`,
            sku: v.sku,
            barcode: v.barcode,
            unitId: v.unitId,
            unitName: v.unitName,
          })),
      );
  }, [stocks]);

  const variantById = useMemo(
    () => new Map(catalogueVariants.map((v) => [v.id, v])),
    [catalogueVariants],
  );

  const optionsForLine = (line: StockTransferItem): ComboboxOption[] => {
    // No unit filter: picking an item tracked in a different unit is allowed
    // and becomes a MERGE (the units get unified) — but same-unit items rank
    // first and mismatches are flagged so a merge is a deliberate choice.
    const needleWords = new Set(
      normalizeName(line.variantName)
        .split(" ")
        .filter((w) => w.length >= 3),
    );
    const isSimilar = (label: string) =>
      normalizeName(label)
        .split(" ")
        .some((w) => w.length >= 3 && needleWords.has(w));
    return catalogueVariants
      .map((v) => {
        const mismatch = !!line.baseUnitId && v.unitId !== line.baseUnitId;
        return {
          option: {
            value: v.id,
            label: v.label,
            description: [
              v.sku ? `SKU ${v.sku}` : null,
              mismatch ? `${v.unitName} — different unit` : v.unitName,
            ]
              .filter(Boolean)
              .join(" · "),
            keywords: [v.sku ?? "", v.barcode ?? ""].filter(Boolean),
            group: isSimilar(v.label) ? "Close name matches" : "All items",
          },
          mismatch,
        };
      })
      .sort((a, b) => {
        if (a.option.group !== b.option.group)
          return a.option.group === "Close name matches" ? -1 : 1;
        return Number(a.mismatch) - Number(b.mismatch);
      })
      .map((entry) => entry.option);
  };

  const setDecision = (lineId: string, decision: LineDecision) =>
    setDecisions((prev) => ({ ...prev, [lineId]: decision }));

  const decidedLines = pendingLines.filter((line) => {
    const d = decisions[line.id];
    return d && (d.createNew || d.variantId);
  });

  const onConfirm = () => {
    startTransition(async () => {
      let mapped = 0;
      let catalogueChanged = 0;
      const failures: string[] = [];
      // The backend resolves one line per call (each is idempotent and
      // recomputes the transfer status), so submit sequentially and keep
      // going past individual failures — successes stick either way.
      for (const line of decidedLines) {
        const d = decisions[line.id];
        const selected =
          !d.createNew && d.variantId ? variantById.get(d.variantId) : undefined;
        const isMerge =
          !!selected && !!line.baseUnitId && selected.unitId !== line.baseUnitId;
        try {
          await reconcileTransferLine(transfer.id, {
            transferItemId: line.id,
            linkToVariantId: d.createNew ? undefined : d.variantId ?? undefined,
            createNew: d.createNew,
            merge: isMerge,
            mergedUnitId: isMerge
              ? d.mergeUnit === "EXISTING"
                ? selected.unitId
                : line.baseUnitId!
              : undefined,
          });
          mapped += 1;
          // Creates add an item; merges re-label a unit — either way the
          // cached catalogue is stale.
          if (d.createNew || isMerge) catalogueChanged += 1;
        } catch (error: any) {
          failures.push(
            `${line.variantName}: ${error?.message ?? "request failed"}`,
          );
        }
      }
      if (catalogueChanged > 0) invalidateStocksCache();
      if (failures.length === 0) {
        toast({
          title:
            mapped === 1
              ? "1 item mapped and booked into stock"
              : `${mapped} items mapped and booked into stock`,
        });
        setOpen(false);
      } else {
        toast({
          variant: "destructive",
          title:
            mapped > 0
              ? `Mapped ${mapped} — ${failures.length} failed`
              : "Couldn't map items",
          description: failures[0],
        });
      }
      if (mapped > 0) router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Link2 className="h-4 w-4 mr-1.5" /> Map items
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl flex flex-col max-h-[calc(100dvh-2rem)] overflow-y-hidden">
        <DialogHeader>
          <DialogTitle>Map items — {transfer.transferNumber}</DialogTitle>
          <DialogDescription>
            These items have no match in this location&apos;s catalogue, so they
            couldn&apos;t be received yet. Link each to a stock item you already
            carry — if that item uses a different unit you&apos;ll choose which
            unit the merged item keeps — or create it as a new item. Mapping
            books the line&apos;s full outstanding quantity into your stock; you
            can map some now and come back for the rest.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="rounded-lg border divide-y">
            {pendingLines.map((line) => {
              const decision = decisions[line.id] ?? UNDECIDED;
              const outstanding = Math.max(
                0,
                line.quantity - Number(line.receivedQuantity ?? 0),
              );
              const selected =
                !decision.createNew && decision.variantId
                  ? variantById.get(decision.variantId)
                  : undefined;
              const isMerge =
                !!selected &&
                !!line.baseUnitId &&
                selected.unitId !== line.baseUnitId;
              return (
                <div key={line.id} className="p-3 space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium">{line.variantName}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {outstanding.toLocaleString()}
                      {line.baseUnitName ? ` ${line.baseUnitName}` : ""} to book
                      in
                    </p>
                  </div>
                  {decision.createNew ? (
                    <p className="text-xs text-muted-foreground">
                      A new stock item named &ldquo;{line.variantName}&rdquo;
                      will be created in this location&apos;s catalogue (its
                      product side lands as a draft to price and publish later).
                    </p>
                  ) : (
                    <Combobox
                      options={optionsForLine(line)}
                      value={decision.variantId}
                      onChange={(v) =>
                        setDecision(line.id, { ...decision, createNew: false, variantId: v })
                      }
                      placeholder="Link to an existing stock item…"
                      searchPlaceholder="Search by name, SKU, or barcode…"
                      emptyText={
                        !stocks
                          ? "Loading catalogue…"
                          : "No items in this catalogue — create it as a new item instead."
                      }
                      disabled={isPending}
                      className="w-full"
                    />
                  )}
                  {isMerge && selected && (
                    <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 space-y-2">
                      <p className="text-xs text-amber-900 dark:text-amber-400">
                        <span className="font-semibold">
                          Different unit — linking will merge the two items.
                        </span>{" "}
                        &ldquo;{selected.label}&rdquo; is tracked in{" "}
                        {selected.unitName}; this line arrives in{" "}
                        {line.baseUnitName}. They become one product under a
                        single unit — quantities keep their numbers, nothing is
                        converted. Pick the unit that&apos;s correct for this
                        product:
                      </p>
                      <RadioGroup
                        value={decision.mergeUnit}
                        onValueChange={(v) =>
                          setDecision(line.id, {
                            ...decision,
                            mergeUnit: v === "EXISTING" ? "EXISTING" : "INCOMING",
                          })
                        }
                        className="gap-1.5"
                      >
                        <div className="flex items-start gap-2">
                          <RadioGroupItem
                            value="INCOMING"
                            id={`${line.id}-merge-incoming`}
                            className="mt-0.5"
                            disabled={isPending}
                          />
                          <label
                            htmlFor={`${line.id}-merge-incoming`}
                            className="text-xs cursor-pointer"
                          >
                            Track it in{" "}
                            <span className="font-semibold">
                              {line.baseUnitName}
                            </span>{" "}
                            — updates &ldquo;{selected.label}&rdquo; at this
                            location
                          </label>
                        </div>
                        <div className="flex items-start gap-2">
                          <RadioGroupItem
                            value="EXISTING"
                            id={`${line.id}-merge-existing`}
                            className="mt-0.5"
                            disabled={isPending}
                          />
                          <label
                            htmlFor={`${line.id}-merge-existing`}
                            className="text-xs cursor-pointer"
                          >
                            Keep{" "}
                            <span className="font-semibold">
                              {selected.unitName}
                            </span>{" "}
                            — updates &ldquo;{line.variantName}&rdquo; at{" "}
                            {transfer.sourceLocationName ?? "the source"}
                          </label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={decision.createNew}
                      onCheckedChange={(checked) =>
                        setDecision(line.id, {
                          ...decision,
                          createNew: checked === true,
                          variantId: null,
                        })
                      }
                      disabled={isPending}
                    />
                    Create as a new item at this location
                  </label>
                </div>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || decidedLines.length === 0}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {decidedLines.length > 0
              ? `Map ${decidedLines.length} ${decidedLines.length === 1 ? "item" : "items"}`
              : "Map items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
