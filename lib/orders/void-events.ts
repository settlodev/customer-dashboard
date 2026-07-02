import {
  CANCELLATION_REASON_LABELS,
  CancellationReason,
  type Order,
  OrderStatus,
  VOID_REASON_LABELS,
  VoidReason,
} from "@/types/orders/type";

import { orderVoidedItems } from "./void-report";

/**
 * The voids report is event-grain: one row per thing that was taken off the
 * books. An `ITEM_VOID` is a single line item voided off an order (the order
 * may still be open); an `ORDER_CANCEL` is a whole order cancelled. They come
 * from two different sources (`/voids` vs `listOrders(CANCELLED)`) and have
 * separate reason vocabularies, so we normalise them into one row shape here.
 */
export type VoidEventKind = "ITEM_VOID" | "ORDER_CANCEL";

/** URL `?type=` filter values for the report's pill toggle. */
export type VoidEventTypeFilter = "" | "cancel" | "item";

export interface VoidEvent {
  /** Stable, unique row id. `${orderId}:item:${itemId}` or `${orderId}:cancel`. */
  id: string;
  kind: VoidEventKind;
  orderId: string;
  orderNumber: string;
  /** Resolved table name, or null when the order isn't on a table. */
  tableName: string | null;
  /** Staff dimension: `assignedTo` for item voids, `cancelledBy` for cancels. */
  staffId: string | null;
  staffName: string | null;
  /** Reason enum value (for filtering), null when only free-text/none exists. */
  reasonCode: string | null;
  /** Human-readable reason for display. */
  reasonLabel: string;
  /** Item-void only: the voided line. */
  itemName: string | null;
  quantity: number | null;
  /** Cancel only: items on the cancelled order, when the payload carries them. */
  itemCount: number | null;
  /** Net value voided (item) or net order total cancelled. Never negative-signed here. */
  amount: number;
  /** ISO timestamp used for the default newest-first sort and the When column. */
  occurredAt: string | null;
  /** Order status — always CANCELLED for cancel rows; the item's order for void rows. */
  orderStatus: OrderStatus;
}

export const VOID_EVENT_TYPE_FILTER_OPTIONS: {
  value: VoidEventTypeFilter;
  label: string;
}[] = [
  { value: "", label: "All" },
  { value: "cancel", label: "Cancellations" },
  { value: "item", label: "Item voids" },
];

const epoch = (iso: string | null): number => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const itemVoidReason = (
  code: VoidReason | null,
): { code: string | null; label: string } =>
  code ? { code, label: VOID_REASON_LABELS[code] ?? code } : { code: null, label: "—" };

const cancelReason = (
  order: Order,
): { code: string | null; label: string } => {
  const type = order.cancellationReasonType as CancellationReason | null;
  if (type) return { code: type, label: CANCELLATION_REASON_LABELS[type] ?? type };
  const free = order.cancellationReason?.trim();
  return free ? { code: null, label: free } : { code: null, label: "—" };
};

export interface BuildVoidEventsInput {
  /** Orders carrying >= 1 voided line item (from `getVoidsReport`). */
  voidedOrders: Order[];
  /** Cancelled orders in range (from `listOrders({ status: CANCELLED })`). */
  cancelledOrders: Order[];
  /** staffId -> display name. */
  staffById: Map<string, string>;
  /** tableId -> table name. */
  tableById: Map<string, string>;
}

/**
 * Flatten both sources into one newest-first event list. An order that was
 * both cancelled and had items voided off it legitimately yields both a cancel
 * row (its remaining net total) and item rows (the voided lines) — the amounts
 * don't overlap because voiding an item already removed it from the order total.
 */
export function buildVoidEvents({
  voidedOrders,
  cancelledOrders,
  staffById,
  tableById,
}: BuildVoidEventsInput): VoidEvent[] {
  const events: VoidEvent[] = [];

  for (const o of voidedOrders) {
    const tableName = o.tableId ? tableById.get(o.tableId) ?? null : null;
    const staffId = o.assignedTo ?? null;
    const staffName = staffId ? staffById.get(staffId) ?? null : null;
    for (const item of orderVoidedItems(o)) {
      const reason = itemVoidReason(item.voidReason);
      events.push({
        id: `${o.id}:item:${item.id}`,
        kind: "ITEM_VOID",
        orderId: o.id,
        orderNumber: o.orderNumber,
        tableName,
        staffId,
        staffName,
        reasonCode: reason.code,
        reasonLabel: reason.label,
        itemName: item.name,
        quantity: item.quantity ?? null,
        itemCount: null,
        amount: item.netAmount ?? 0,
        occurredAt: item.updatedAt ?? o.updatedAt ?? o.openedDate ?? null,
        orderStatus: o.orderStatus,
      });
    }
  }

  for (const o of cancelledOrders) {
    const tableName = o.tableId ? tableById.get(o.tableId) ?? null : null;
    const staffId = o.cancelledBy ?? o.finishedBy ?? o.assignedTo ?? null;
    const staffName = staffId ? staffById.get(staffId) ?? null : null;
    const reason = cancelReason(o);
    events.push({
      id: `${o.id}:cancel`,
      kind: "ORDER_CANCEL",
      orderId: o.id,
      orderNumber: o.orderNumber,
      tableName,
      staffId,
      staffName,
      reasonCode: reason.code,
      reasonLabel: reason.label,
      itemName: null,
      quantity: null,
      itemCount: o.items?.length ?? null,
      amount: o.netAmount ?? o.grossAmount ?? 0,
      occurredAt: o.closedDate ?? o.updatedAt ?? o.openedDate ?? null,
      orderStatus: o.orderStatus,
    });
  }

  return events.sort((a, b) => epoch(b.occurredAt) - epoch(a.occurredAt));
}

export interface VoidEventsRollup {
  cancelledOrders: number;
  voidedItems: number;
  /** Σ net value of voided line items. */
  voidValue: number;
  /** Σ net order total of cancelled orders. */
  cancelledValue: number;
}

export function summariseVoidEvents(events: VoidEvent[]): VoidEventsRollup {
  let cancelledOrders = 0;
  let voidedItems = 0;
  let voidValue = 0;
  let cancelledValue = 0;
  for (const e of events) {
    if (e.kind === "ORDER_CANCEL") {
      cancelledOrders += 1;
      cancelledValue += e.amount;
    } else {
      voidedItems += 1;
      voidValue += e.amount;
    }
  }
  return { cancelledOrders, voidedItems, voidValue, cancelledValue };
}

/** Whether an event matches the free-text search. `needle` must be lower-cased. */
export function voidEventMatchesSearch(event: VoidEvent, needle: string): boolean {
  if (!needle) return true;
  return (
    event.orderNumber.toLowerCase().includes(needle) ||
    (event.itemName ?? "").toLowerCase().includes(needle) ||
    event.reasonLabel.toLowerCase().includes(needle) ||
    (event.staffName ?? "").toLowerCase().includes(needle) ||
    (event.tableName ?? "").toLowerCase().includes(needle)
  );
}

export interface VoidFilterOption {
  value: string;
  label: string;
}

/** Distinct reasons present across the events, count-labelled, highest first. */
export function buildVoidReasonOptions(events: VoidEvent[]): VoidFilterOption[] {
  const byCode = new Map<string, { label: string; count: number }>();
  for (const e of events) {
    if (!e.reasonCode) continue;
    const entry = byCode.get(e.reasonCode) ?? { label: e.reasonLabel, count: 0 };
    entry.count += 1;
    byCode.set(e.reasonCode, entry);
  }
  return Array.from(byCode, ([value, { label, count }]) => ({
    value,
    label: `${label} (${count})`,
    count,
  }))
    .sort((a, b) => b.count - a.count)
    .map(({ value, label }) => ({ value, label }));
}

/** Distinct named staff present across the events, alphabetical. */
export function buildVoidStaffOptions(events: VoidEvent[]): VoidFilterOption[] {
  const byId = new Map<string, string>();
  for (const e of events) {
    if (e.staffId && e.staffName && !byId.has(e.staffId)) {
      byId.set(e.staffId, e.staffName);
    }
  }
  return Array.from(byId, ([value, label]) => ({ value, label })).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
