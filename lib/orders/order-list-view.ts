import type { Order } from "@/types/orders/type";

export interface OrderListSource {
  /** Status/entity-scoped orders, before search + pagination. */
  orders: Order[];
  /** Raw value of the `?search=` param (may be empty). */
  search: string;
  /** 1-based page number. */
  page: number;
  /** Page size. */
  limit: number;
  /** All location staff — used to resolve assigned-to / closed-by names. */
  staff: Array<{ id: string; fullName: string }>;
  /** All location tables — used to resolve the table name. */
  tables: Array<{ id: string; name: string }>;
}

export interface OrderListView {
  /** Rows for the requested page (already sliced). */
  pageData: Order[];
  /** Total rows after search, before pagination. */
  total: number;
  /** Number of pages at `limit` rows each (>= 1). */
  pageCount: number;
  /** id → name for staff referenced by `pageData` (small; for the client table). */
  staffNames: Record<string, string>;
  /** id → name for tables referenced by `pageData` (small; for the client table). */
  tableNames: Record<string, string>;
}

/**
 * Whether an order matches the free-text search. `needle` must already be
 * lower-cased and non-empty. Resolves staff/table UUIDs through the supplied
 * maps so a manager can search by table name, docket number, or the name of
 * the person who opened or closed the order — not just the raw order fields.
 */
export function orderMatchesSearch(
  order: Order,
  needle: string,
  staffById: Map<string, string>,
  tableById: Map<string, string>,
): boolean {
  const tableName = order.tableId ? tableById.get(order.tableId) ?? "" : "";
  const assignedToName = order.assignedTo
    ? staffById.get(order.assignedTo) ?? ""
    : "";
  const finishedByName = order.finishedBy
    ? staffById.get(order.finishedBy) ?? ""
    : "";
  const docket = order.docketNumber != null ? String(order.docketNumber) : "";

  return (
    (order.orderNumber ?? "").toLowerCase().includes(needle) ||
    tableName.toLowerCase().includes(needle) ||
    docket.includes(needle) ||
    assignedToName.toLowerCase().includes(needle) ||
    finishedByName.toLowerCase().includes(needle) ||
    (order.notes ?? "").toLowerCase().includes(needle) ||
    (order.externalOrderId ?? "").toLowerCase().includes(needle) ||
    (order.cancellationReason ?? "").toLowerCase().includes(needle)
  );
}

/**
 * Shared orders-list pipeline used by /orders, /staff/[id], and /tables/[id].
 * Filters the scoped set by the search string (matching order number, table
 * name, docket number, assigned-to and closed-by names, plus notes / external
 * id / cancellation reason), paginates, and resolves the staff/table names for
 * just the rows on the returned page (keeping the client props small).
 */
export function buildOrderListView({
  orders,
  search,
  page,
  limit,
  staff,
  tables,
}: OrderListSource): OrderListView {
  const staffById = new Map<string, string>();
  for (const s of staff) staffById.set(s.id, s.fullName);
  const tableById = new Map<string, string>();
  for (const t of tables) tableById.set(t.id, t.name);

  const needle = search.toLowerCase();
  const filtered = needle
    ? orders.filter((o) => orderMatchesSearch(o, needle, staffById, tableById))
    : orders;

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  const staffNames: Record<string, string> = {};
  const tableNames: Record<string, string> = {};
  for (const o of pageData) {
    if (o.assignedTo && staffById.has(o.assignedTo)) {
      staffNames[o.assignedTo] = staffById.get(o.assignedTo)!;
    }
    if (o.finishedBy && staffById.has(o.finishedBy)) {
      staffNames[o.finishedBy] = staffById.get(o.finishedBy)!;
    }
    if (o.tableId && tableById.has(o.tableId)) {
      tableNames[o.tableId] = tableById.get(o.tableId)!;
    }
  }

  return { pageData, total, pageCount, staffNames, tableNames };
}
