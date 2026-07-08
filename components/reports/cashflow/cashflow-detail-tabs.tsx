"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  CASHFLOW_DETAIL_VIEWS,
  type CashflowDetailView,
} from "@/types/reports/cashflow";

const VIEW_LABELS: Record<CashflowDetailView, string> = {
  payments: "Payments",
  refunds: "Refunds",
  expenses: "Expenses",
};

/**
 * URL-driven view pills for the "Transaction detail" section. Same idiom as
 * the report tab navs (`ExpenseTabNav`): plain links over `?view=` so the
 * server component re-fetches only the active list. Switching views drops
 * `page` and the payments-only `method` filter — a page/filter carried across
 * views would land on a nonsense offset — while `from`/`to`/`limit` persist.
 * `scroll={false}` because the section sits mid-page.
 */
export function CashflowDetailTabs({ active }: { active: CashflowDetailView }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (view: CashflowDetailView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    params.delete("page");
    params.delete("method");
    return `${pathname}?${params.toString()}`;
  };

  return (
    <nav className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {CASHFLOW_DETAIL_VIEWS.map((view) => (
        <Link
          key={view}
          href={buildHref(view)}
          scroll={false}
          className={cn(
            "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
            active === view
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {VIEW_LABELS[view]}
        </Link>
      ))}
    </nav>
  );
}
