import type { Order } from "@/types/orders/type";

/**
 * Resolve the staff / table display names referenced by a page of orders, for
 * the client table props. The orders list is server-paginated: each page of
 * rows arrives from the OMS (`GET /api/v1/orders/search`) carrying only UUIDs,
 * and the page resolves just those ids against the full staff / table lists —
 * keeping the client props small.
 *
 * <p>Search, filtering, and pagination all happen server-side now; this name
 * resolution is the only piece of the old in-memory list pipeline still needed.
 */
export function resolveOrderRowNames(
  rows: Order[],
  staff: Array<{ id: string; fullName: string }>,
  tables: Array<{ id: string; name: string }>,
): { staffNames: Record<string, string>; tableNames: Record<string, string> } {
  const staffById = new Map<string, string>();
  for (const s of staff) staffById.set(s.id, s.fullName);
  const tableById = new Map<string, string>();
  for (const t of tables) tableById.set(t.id, t.name);

  const staffNames: Record<string, string> = {};
  const tableNames: Record<string, string> = {};
  for (const o of rows) {
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
  return { staffNames, tableNames };
}
