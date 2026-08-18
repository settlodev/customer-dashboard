"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { buildBusinessColumns } from "@/components/tables/admin-businesses/column";
import { AdminBusinessPage, BusinessStatusCounts } from "@/types/admin/business";
import { BusinessLifecycleSnapshot } from "@/types/admin/business-intel";

interface BusinessesListViewProps {
  initialPage: AdminBusinessPage;
  counts: BusinessStatusCounts;
  initialStatus: string;
  accountId: string | null;
  lifecycleByBusinessId: Record<string, BusinessLifecycleSnapshot>;
}

interface TabConfig {
  key: "all" | "active" | "inactive";
  label: string;
  count: number;
  dotColor?: string;
}

export function BusinessesListView({
  initialPage,
  counts,
  initialStatus,
  accountId,
  lifecycleByBusinessId,
}: BusinessesListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParams = useCallback(
    (changes: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const queryString = next.toString();
      startTransition(() => {
        router.push(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  const columns = useMemo(
    () => buildBusinessColumns({ lifecycleByBusinessId }),
    [lifecycleByBusinessId],
  );

  const tabs: TabConfig[] = [
    { key: "all", label: "All", count: counts.total },
    {
      key: "active",
      label: "Active",
      count: counts.active,
      dotColor: "hsl(var(--pos))",
    },
    {
      key: "inactive",
      label: "Inactive",
      count: counts.inactive,
      dotColor: "hsl(var(--muted-2))",
    },
  ];

  const activeTabKey: TabConfig["key"] =
    initialStatus === "active" || initialStatus === "inactive"
      ? initialStatus
      : "all";

  const onTabClick = (key: TabConfig["key"]) => {
    updateParams({ status: key === "all" ? null : key, page: "1" });
  };

  const clearAccountFilter = () => {
    updateParams({ accountId: null, page: "1" });
  };

  const { content, totalElements, totalPages, number } = initialPage;

  return (
    <div className="space-y-4">
      {accountId && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5">
          <p className="font-mono text-[12px] text-muted-foreground">
            Filtered to account ·{" "}
            <span className="text-ink-3">{accountId}</span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAccountFilter}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Business status"
        className="-mb-px flex flex-wrap items-center gap-1.5 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab) => {
          const active = activeTabKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabClick(tab.key)}
              className={cn(
                "-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 pb-3 pt-2 text-[13.5px] transition-colors",
                active
                  ? "border-primary font-semibold text-ink"
                  : "border-transparent font-medium text-ink-3 hover:text-ink",
              )}
            >
              {tab.dotColor && (
                <span
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ backgroundColor: tab.dotColor }}
                />
              )}
              {tab.label}
              <span
                className={cn(
                  "rounded-md px-1.5 py-px font-mono text-[11px] font-semibold tracking-[0.02em]",
                  active
                    ? "bg-primary/12 text-[#C25E26]"
                    : "bg-black/[0.05] text-ink-3 dark:bg-white/[0.06]",
                )}
              >
                {tab.count.toLocaleString()}
              </span>
            </button>
          );
        })}

        <span className="ml-auto self-center pb-2 font-mono text-[12px] text-muted-foreground">
          {totalElements === 0
            ? "No businesses"
            : `Page ${number + 1} of ${Math.max(1, totalPages)} · ${totalElements.toLocaleString()} total`}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={content}
        searchKey="name"
        pageNo={number}
        total={totalElements}
        pageCount={Math.max(1, totalPages)}
        rowClickBasePath="/businesses"
        disableArchive
      />
    </div>
  );
}
