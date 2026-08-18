"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2, Play, RefreshCw, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createRepairCommand, retryDeadLetter } from "@/lib/actions/admin/stuck-writes";
import type { DeadLetterRow, RepairVerb } from "@/types/admin/stuck-writes";

const VERB_META: Record<
  RepairVerb,
  { label: string; icon: React.ComponentType<{ className?: string }>; destructive: boolean }
> = {
  RESYNC: { label: "Re-sync device", icon: RefreshCw, destructive: false },
  FORCE_DRAIN: { label: "Force drain queue", icon: Play, destructive: false },
  RETRY_MUTATION: { label: "Retry mutation", icon: RotateCcw, destructive: false },
  DISCARD_MUTATION: { label: "Discard mutation", icon: Trash2, destructive: true },
};

interface RepairActionDialogProps {
  row: DeadLetterRow;
  /** The current operator's userId — retained for caller context but NOT forwarded
   *  to createRepairCommand (the server action stamps requesterId from the session). */
  requesterId: string;
  onActionDone: () => void;
}

export function RepairActionDialog({
  row,
  onActionDone,
}: RepairActionDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeVerb, setActiveVerb] = useState<RepairVerb | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const isMoneyDiscard = activeVerb === "DISCARD_MUTATION" && row.isMoneyOp;
  const isNonMoneyDiscard = activeVerb === "DISCARD_MUTATION" && !row.isMoneyOp;
  const isSafeVerb = activeVerb !== null && activeVerb !== "DISCARD_MUTATION";
  // Server-side replay is valid only for rows the device provably discarded.
  // Money / stale rows are still queued on the device and must use the
  // RETRY_MUTATION device command instead (replaying them would double-apply).
  const isReplayable = !row.isMoneyOp && row.classification !== "stale";

  function open(verb: RepairVerb) {
    setReason("");
    setError("");
    setActiveVerb(verb);
  }

  function close() {
    if (isPending) return;
    setActiveVerb(null);
    setReason("");
    setError("");
  }

  function handleConfirm() {
    if (!activeVerb) return;
    setError("");
    startTransition(async () => {
      try {
        await createRepairCommand({
          locationId: row.locationId,
          businessId: row.businessId,
          deviceId: row.deviceId,
          verb: activeVerb,
          idempotencyKey:
            activeVerb === "RETRY_MUTATION" || activeVerb === "DISCARD_MUTATION"
              ? (row.idempotencyKey ?? undefined)
              : undefined,
          reason: reason.trim() || undefined,
        });

        if (isMoneyDiscard) {
          toast({
            title: "Request sent to approvers",
            description:
              "The discard request is held for a second operator to approve before it is dispatched.",
          });
        } else {
          toast({
            title: "Command dispatched",
            description: `${VERB_META[activeVerb].label} sent to device ${row.deviceId.slice(0, 8)}…`,
          });
        }
        close();
        onActionDone();
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to dispatch command. Please try again.";
        setError(message);
      }
    });
  }

  // Eligible RETRY replays the stored payload server-side and reports the real
  // outcome synchronously (DRAINED/FAILED), rather than firing a device command.
  function handleServerReplay() {
    setError("");
    startTransition(async () => {
      const res = await retryDeadLetter(row.id);
      if (res.responseType === "success") {
        toast({
          variant: "success",
          title: "Mutation replayed",
          description: res.message,
        });
        close();
        onActionDone();
      } else {
        // FAILED replay, RETRY_IN_PROGRESS, or another rejection — keep the
        // dialog open with the reason so the operator can read it.
        setError(res.message);
      }
    });
  }

  const confirmDisabled =
    isPending ||
    (activeVerb === "DISCARD_MUTATION" && !reason.trim());

  const dialogTitle = activeVerb ? VERB_META[activeVerb].label : "";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
            Actions
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {(["RESYNC", "FORCE_DRAIN", "RETRY_MUTATION"] as RepairVerb[]).map((verb) => {
            const { label, icon: Icon } = VERB_META[verb];
            const disabled = verb === "RETRY_MUTATION" && !row.idempotencyKey;
            return (
              <DropdownMenuItem
                key={verb}
                onClick={() => open(verb)}
                disabled={disabled}
                className="gap-2 text-[13px]"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {label}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => open("DISCARD_MUTATION")}
            disabled={!row.idempotencyKey}
            className="gap-2 text-[13px] text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Discard mutation
            {row.isMoneyOp && (
              <span className="ml-auto font-mono text-[10px] text-amber-600">$</span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={activeVerb !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogTitle}
              {isMoneyDiscard && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-700">
                  Requires admin approval
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {isSafeVerb &&
                activeVerb === "RESYNC" &&
                `This is a safe, idempotent operation. It will signal device ${row.deviceId.slice(0, 8)}… to perform a full re-sync.`}
              {isSafeVerb &&
                activeVerb === "FORCE_DRAIN" &&
                `This is a safe, idempotent operation. It will signal device ${row.deviceId.slice(0, 8)}… to force-drain its mutation queue.`}
              {activeVerb === "RETRY_MUTATION" &&
                (isReplayable
                  ? "Replays this mutation on the server from its stored payload and reports the result immediately. Safe to retry — it only lands if it hasn't already."
                  : `This mutation is still held on device ${row.deviceId.slice(0, 8)}… (it touches money or is a version conflict). This re-queues it for the device to retry on its next sync.`)}
              {isNonMoneyDiscard && (
                <>
                  This will permanently discard mutation{" "}
                  <code className="font-mono text-[12px]">{row.idempotencyKey?.slice(0, 8)}…</code>{" "}
                  from device{" "}
                  <code className="font-mono text-[12px]">{row.deviceId.slice(0, 8)}…</code>.
                  The device will roll back any optimistic state.{" "}
                  <strong>This cannot be undone.</strong>
                </>
              )}
              {isMoneyDiscard &&
                "This mutation touches real money. Discarding it requires a second operator to approve. Add a reason and submit — the request will appear in the approvals inbox."}
            </DialogDescription>
          </DialogHeader>

          {activeVerb === "DISCARD_MUTATION" && (
            <div className="space-y-1.5 py-1">
              <Label htmlFor="repair-reason" className="text-[13px]">
                Reason (required)
              </Label>
              <Textarea
                id="repair-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why should this mutation be discarded?"
                rows={3}
                disabled={isPending}
                aria-required={true}
                className="text-[13px]"
              />
            </div>
          )}

          {error && (
            <p className="text-[13px] text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={
                activeVerb === "RETRY_MUTATION" && isReplayable
                  ? handleServerReplay
                  : handleConfirm
              }
              disabled={confirmDisabled}
              variant={activeVerb === "DISCARD_MUTATION" ? "destructive" : "default"}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {activeVerb === "RETRY_MUTATION" && isReplayable
                    ? "Replaying…"
                    : "Sending…"}
                </span>
              ) : isMoneyDiscard ? (
                "Request approval"
              ) : activeVerb === "RETRY_MUTATION" && isReplayable ? (
                "Retry now"
              ) : (
                "Dispatch"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
