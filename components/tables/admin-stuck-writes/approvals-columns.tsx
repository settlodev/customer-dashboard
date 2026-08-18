"use client";

import { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Check, DollarSign, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, timeSince } from "@/components/admin/shared/format";
import {
  approveRepairCommand,
  rejectRepairCommand,
} from "@/lib/actions/admin/stuck-writes";
import type { RepairCommandRow } from "@/types/admin/stuck-writes";

function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

interface ApprovalActionCellProps {
  row: RepairCommandRow;
  /** Current operator userId — used only for the self-approval UI guard. */
  approverId: string;
  onActionDone: () => void;
}

function ApprovalActionCell({
  row,
  approverId,
  onActionDone,
}: ApprovalActionCellProps) {
  const { toast } = useToast();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // UI guard: the server also enforces approverId != requesterId, but we
  // surface it early so the operator doesn't attempt a self-approval.
  const isSelf = row.requesterId === approverId;

  function handle(action: "approve" | "reject") {
    startTransition(async () => {
      try {
        if (action === "approve") {
          // approverId is stamped server-side from the operator session —
          // do NOT pass it here.
          await approveRepairCommand(row.commandId);
          toast({
            title: "Approved",
            description: "Discard command dispatched to device.",
          });
          setApproveOpen(false);
        } else {
          await rejectRepairCommand(row.commandId);
          toast({
            title: "Rejected",
            description: "Money-op discard request rejected.",
          });
          setRejectOpen(false);
        }
        onActionDone();
      } catch (err: unknown) {
        toast({
          title: "Error",
          description:
            err instanceof Error
              ? err.message
              : "Action failed. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  if (isSelf) {
    return (
      <span className="font-mono text-[11.5px] italic text-muted-foreground">
        Cannot approve own request
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Approve */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-[12px]"
            disabled={isPending}
          >
            <Check className="h-3 w-3 text-emerald-600" />
            Approve
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve money-op discard?</AlertDialogTitle>
            <AlertDialogDescription>
              This will dispatch a <strong>DISCARD_MUTATION</strong> command to
              device{" "}
              <code className="font-mono text-[12px]">
                {shortId(row.deviceId)}
              </code>
              , permanently discarding mutation{" "}
              <code className="font-mono text-[12px]">
                {shortId(row.idempotencyKey)}
              </code>
              . <strong>This cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handle("approve")}
              className="bg-destructive hover:bg-destructive/90"
            >
              Approve &amp; dispatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-[12px] text-destructive hover:text-destructive"
            disabled={isPending}
          >
            <X className="h-3 w-3" />
            Reject
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject discard request?</AlertDialogTitle>
            <AlertDialogDescription>
              The mutation will remain dead-lettered. The requester must open a
              new request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handle("reject")}>
              Reject request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ColumnDeps {
  /** Whether the current operator holds REPAIR_APPROVE. */
  canApprove: boolean;
  /** Current operator userId — used only for the self-approval UI guard. */
  approverId: string;
  onActionDone: () => void;
}

export function buildApprovalsColumns({
  canApprove,
  approverId,
  onActionDone,
}: ColumnDeps): ColumnDef<RepairCommandRow>[] {
  return [
    {
      accessorKey: "requestedAt",
      header: "Requested",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="whitespace-nowrap text-[13px] text-ink">
            {formatDateTime(row.original.requestedAt)}
          </span>
          <span className="font-mono text-[11.5px] text-muted-foreground">
            {timeSince(row.original.requestedAt)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "verb",
      header: "Verb",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-medium text-ink-2">
          {row.original.isMoneyOp && (
            <span title="Money op — requires admin approval">
              <DollarSign className="h-3 w-3 flex-shrink-0 text-amber-500" />
            </span>
          )}
          {row.original.verb}
        </span>
      ),
    },
    {
      id: "target",
      header: "Target key",
      cell: ({ row }) => (
        <span
          title={row.original.idempotencyKey ?? undefined}
          className="font-mono text-[12px] text-ink-2"
        >
          {shortId(row.original.idempotencyKey)}
        </span>
      ),
    },
    {
      accessorKey: "deviceId",
      header: "Device",
      cell: ({ row }) => (
        <span
          title={row.original.deviceId}
          className="font-mono text-[12px] text-ink-2"
        >
          {shortId(row.original.deviceId)}
        </span>
      ),
    },
    {
      accessorKey: "requesterId",
      header: "Requested by",
      cell: ({ row }) => (
        <span
          title={row.original.requesterId}
          className="font-mono text-[12px] text-ink-2"
        >
          {shortId(row.original.requesterId)}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) =>
        row.original.reason ? (
          <span
            className="max-w-[200px] truncate text-[12.5px] text-ink-2"
            title={row.original.reason}
          >
            {row.original.reason}
          </span>
        ) : (
          <span className="text-[12.5px] text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        canApprove ? (
          <ApprovalActionCell
            row={row.original}
            approverId={approverId}
            onActionDone={onActionDone}
          />
        ) : null,
    },
  ];
}
