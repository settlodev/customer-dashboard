"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DataTable } from "@/components/tables/data-table";
import { buildManualPaymentColumns } from "@/components/tables/admin-manual-payments/column";
import { cn } from "@/lib/utils";
import { ManualPaymentPage, ManualPaymentStatus } from "@/types/admin/billing";

interface ManualPaymentsQueueViewProps {
  page: ManualPaymentPage;
  status: ManualPaymentStatus | "ALL";
  counts: Record<ManualPaymentStatus | "ALL", number>;
  actorNames: Record<string, string>;
}

const TABS: { key: ManualPaymentStatus | "ALL"; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "ALL", label: "All" },
];

export function ManualPaymentsQueueView({
  page,
  status,
  counts,
  actorNames,
}: ManualPaymentsQueueViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const columns = useMemo(
    () => buildManualPaymentColumns(actorNames),
    [actorNames],
  );

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

  const handleStatusChange = (next: ManualPaymentStatus | "ALL") => {
    updateParams({ status: next === "ALL" ? null : next, page: null });
  };

  const { content, totalElements, totalPages, number, size } = page;

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div
        role="tablist"
        aria-label="Manual payment status"
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
            ? "No manual payments"
            : `Page ${number + 1} of ${Math.max(1, totalPages)} · ${totalElements.toLocaleString()} total`}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={content}
        searchKey="invoiceNumber"
        hideSearch
        pageNo={number}
        total={totalElements}
        pageCount={Math.max(1, totalPages)}
        defaultPageSize={size}
        disableArchive
      />
    </div>
  );
}
