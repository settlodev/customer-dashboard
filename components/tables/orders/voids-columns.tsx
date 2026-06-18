"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Order } from "@/types/orders/type";
import { orderVoidAmount, voidedItemCount } from "@/lib/orders/void-report";
import { buildOrdersColumns, OrdersColumnOptions } from "./columns";

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * The Orders columns plus a "Void amount" column inserted just before Status.
 * Reuses buildOrdersColumns so the shared columns stay identical to /orders.
 */
export function buildVoidsColumns(opts: OrdersColumnOptions): ColumnDef<Order>[] {
  const cols = buildOrdersColumns(opts);

  const voidColumn: ColumnDef<Order> = {
    id: "voidAmount",
    header: "Void amount",
    cell: ({ row }) => {
      const amount = orderVoidAmount(row.original);
      const count = voidedItemCount(row.original);
      return (
        <div className="flex flex-col tabular-nums text-[12.5px]">
          <span className="font-medium text-amber-700 dark:text-amber-400">
            {formatMoney(amount)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {count} item{count === 1 ? "" : "s"}
          </span>
        </div>
      );
    },
  };

  const statusIdx = cols.findIndex(
    (c) => "accessorKey" in c && c.accessorKey === "orderStatus",
  );
  cols.splice(statusIdx === -1 ? cols.length : statusIdx, 0, voidColumn);
  return cols;
}
