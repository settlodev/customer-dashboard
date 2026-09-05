"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PenLine, ReceiptText } from "lucide-react";

import { EmptyState, PanelCard } from "@/components/layouts/order-detail";
import { DataTable } from "@/components/tables/data-table";
import { buildOrdersColumns } from "@/components/tables/orders/columns";
import type { OrdersKpis } from "@/components/orders/orders-panel";
import {
  CUSTOMER_ORDER_BUCKETS,
  type CustomerOrderBucket,
} from "@/lib/orders/customer-order-buckets";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/orders/type";

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

interface Props {
  /** `/customers/{id}` — the route the bucket links live on. */
  basePath: string;
  /** The current page's rows (already sliced server-side). */
  rows: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  bucket: CustomerOrderBucket;
  /** Whether the URL carries a free-text search — an empty filtered page is
   *  "no matches", not "no orders yet". */
  searching: boolean;
  /** All-time ledger totals from the OMS summary; null when unavailable. */
  ledger: OrdersKpis | null;
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
  currency: string;
  /** Carried across bucket switches so search / page size survive. */
  preservedParams: Record<string, string | undefined>;
}

const EMPTY: Record<CustomerOrderBucket, { title: string; sub: string }> = {
  all: {
    title: "No orders yet",
    sub: "Orders placed for this customer at the till will show up here.",
  },
  ongoing: {
    title: "Nothing ongoing",
    sub: "No open, unsigned orders right now.",
  },
  signed: {
    title: "Nothing owed",
    sub: "No signed bills are outstanding on this account.",
  },
  closed: {
    title: "No completed orders",
    sub: "Closed, fully settled orders will show up here.",
  },
};

/**
 * The customer's order ledger — the orders list's table, scoped to one
 * customer and split into buckets instead of a status dropdown. Everything
 * is URL-driven (`?bucket`, `?page`, `?search`) so the server re-queries the
 * OMS exactly like the Orders page does; nothing is sliced client-side.
 */
export function CustomerOrdersPanel({
  basePath,
  rows,
  pageCount,
  pageNo,
  total,
  bucket,
  searching,
  ledger,
  tableMode,
  staffNames,
  tableNames,
  currency,
  preservedParams,
}: Props) {
  const columns = useMemo(
    () => buildOrdersColumns({ tableMode, staffNames, tableNames }),
    [tableMode, staffNames, tableNames],
  );

  const counts: Record<CustomerOrderBucket, number | undefined> = {
    all: ledger?.totalOrders,
    ongoing: ledger?.ongoingOrders,
    signed: ledger?.signedOrders,
    closed: ledger?.completedOrders,
  };
  const signedAmount = ledger?.signedAmount ?? 0;
  const active = CUSTOMER_ORDER_BUCKETS.find((b) => b.key === bucket)!;

  const buildHref = (key: CustomerOrderBucket) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(preservedParams)) {
      // Page offsets don't carry across buckets — different sets, different
      // page counts.
      if (v && k !== "page" && k !== "bucket") qs.set(k, v);
    }
    if (key !== "all") qs.set("bucket", key);
    const query = qs.toString();
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Order bucket"
          className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
        >
          {CUSTOMER_ORDER_BUCKETS.map((b) => {
            const on = b.key === bucket;
            const count = counts[b.key];
            return (
              <Link
                key={b.key}
                href={buildHref(b.key)}
                role="tab"
                aria-selected={on}
                title={b.hint}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                  on
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:text-foreground/80",
                )}
              >
                {b.label}
                {count != null && count > 0 ? (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none tabular-nums",
                      on ? "bg-canvas text-ink-3" : "bg-background/60 text-muted-foreground",
                    )}
                  >
                    {count.toLocaleString()}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
        {signedAmount > 0 ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <PenLine className="h-3 w-3 text-neg" />
            <span className="font-semibold tabular-nums text-neg">
              {formatMoney(signedAmount)} {currency}
            </span>
            owed on {ledger?.signedOrders ?? 0} signed{" "}
            {(ledger?.signedOrders ?? 0) === 1 ? "bill" : "bills"}
          </span>
        ) : null}
      </div>

      <PanelCard
        icon={<ReceiptText className="h-3.5 w-3.5" />}
        title={bucket === "all" ? "Orders" : `${active.label} orders`}
        count={total > 0 ? total : undefined}
        pad0
      >
        {total === 0 && !searching ? (
          <EmptyState
            icon={<ReceiptText className="h-5 w-5" />}
            title={EMPTY[bucket].title}
            sub={EMPTY[bucket].sub}
          />
        ) : (
          <div className="px-2 pb-4 sm:px-5">
            <DataTable
              columns={columns}
              data={rows}
              pageCount={pageCount}
              pageNo={pageNo}
              total={total}
              searchKey="orderNumber"
              searchPlaceholder="Search order #, name, table, staff…"
              rowClickBasePath="/orders"
              disableArchive
            />
          </div>
        )}
      </PanelCard>
    </div>
  );
}
