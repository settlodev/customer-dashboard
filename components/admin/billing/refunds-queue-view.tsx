"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { processRefund, rejectRefund } from "@/lib/actions/admin/billing";
import {
  RefundPage,
  RefundResponse,
  RefundStatus,
} from "@/types/admin/billing";

interface RefundsQueueViewProps {
  page: RefundPage;
  status: RefundStatus | "ALL";
  counts: Record<RefundStatus | "ALL", number>;
}

const STATUS_BADGE: Record<
  RefundStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  },
  PROCESSED: {
    label: "Processed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  APPROVED: {
    label: "Approved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  REJECTED: {
    label: "Rejected",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
};

const TABS: { key: RefundStatus | "ALL"; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSED", label: "Processed" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export function RefundsQueueView({
  page,
  status,
  counts,
}: RefundsQueueViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const handleStatusChange = (next: RefundStatus | "ALL") => {
    updateParams({ status: next === "ALL" ? null : next, page: null });
  };

  const handleAction = (refund: RefundResponse, kind: "approve" | "reject") => {
    // Approval is a money-moving operation; reject is recoverable but
    // we still confirm because PENDING is the only state both buttons
    // act on and a misclick after that means re-asking the customer.
    const verb = kind === "approve" ? "Approve" : "Reject";
    if (
      !confirm(
        `${verb} refund of ${formatMoney(refund.amount)} for invoice ${refund.invoiceNumber}?`,
      )
    ) {
      return;
    }
    setBusyId(refund.id);
    startTransition(async () => {
      // Both server actions accept a businessId for the revalidatePath
      // call; pass a placeholder when the refund is on a prospect
      // invoice (no business attached) — the queue is what we really
      // care about refreshing.
      const businessId = refund.businessId ?? "_";
      const result = await (kind === "approve"
        ? processRefund(businessId, refund.id)
        : rejectRefund(businessId, refund.id));
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: kind === "approve" ? "Approval failed" : "Reject failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  const goToPage = (n: number) => {
    updateParams({ page: n > 0 ? String(n) : null });
  };

  const { content, totalElements, totalPages, number, first, last } = page;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Refund status"
        className="inline-flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-md border border-line bg-card p-[3px]"
      >
        {TABS.map((tab) => {
          const active = status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleStatusChange(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                active ? "bg-canvas text-ink" : "text-ink-3 hover:text-ink",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-[3px] px-1.5 font-mono text-[10.5px] tracking-[0.02em]",
                  active
                    ? "border border-line bg-card text-ink-3"
                    : "bg-canvas text-muted-foreground",
                )}
              >
                {counts[tab.key].toLocaleString()}
              </span>
            </button>
          );
        })}
        <span className="ml-3 self-center font-mono text-[12px] text-muted-foreground">
          {totalElements === 0
            ? "No refunds"
            : `Page ${number + 1} of ${Math.max(1, totalPages)} · ${totalElements.toLocaleString()} total`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[220px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {status === "PENDING"
                    ? "Nothing pending — refund queue is clear."
                    : "No refunds match the current filter."}
                </TableCell>
              </TableRow>
            ) : (
              content.map((r) => {
                const badge =
                  STATUS_BADGE[r.status] ?? {
                    label: r.status,
                    className: "border-muted bg-muted text-muted-foreground",
                  };
                const live = r.status === "PENDING";
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                          <RotateCcw className="h-4 w-4 text-violet-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {r.invoiceNumber}
                          </p>
                          {r.businessId ? (
                            <Link
                              href={`/businesses/${r.businessId}/billing`}
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {r.businessId}
                            </Link>
                          ) : (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              Prospect invoice
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMoney(r.amount)}
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <p className="truncate text-[13px]" title={r.reason}>
                        {r.reason || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-[11.5px] text-muted-foreground">
                      {formatDateTime(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {live ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busyId === r.id || isPending}
                              onClick={() => handleAction(r, "approve")}
                              className="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                            >
                              {busyId === r.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              )}
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busyId === r.id || isPending}
                              onClick={() => handleAction(r, "reject")}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </>
                        ) : r.businessId ? (
                          <Button
                            asChild
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-ink"
                          >
                            <Link href={`/businesses/${r.businessId}/billing`}>
                              View business billing
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToPage(number - 1)}
            disabled={first || isPending}
          >
            <ArrowLeftIcon className="mr-1 h-3.5 w-3.5" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToPage(number + 1)}
            disabled={last || isPending}
          >
            Next
            <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
