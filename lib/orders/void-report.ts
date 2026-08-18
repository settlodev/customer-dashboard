import type {
  Order,
  OrderItem,
  VoidReason,
  VoidReasonTally,
} from "@/types/orders/type";

/** Voided line items: removed AND carrying a void reason (matches the OMS predicate). */
export const orderVoidedItems = (o: Order): OrderItem[] =>
  (o.removedItems ?? []).filter((i) => i.voidReason != null);

/** Net value voided on this order. */
export const orderVoidAmount = (o: Order): number =>
  orderVoidedItems(o).reduce((sum, i) => sum + (i.netAmount ?? 0), 0);

/** Number of voided line items on this order. */
export const voidedItemCount = (o: Order): number => orderVoidedItems(o).length;

export interface VoidsRollup {
  voidedOrders: number;
  voidedItems: number;
  voidAmount: number;
  reasons: VoidReasonTally[];
}

/**
 * Recompute void totals from a set of orders. Lets the report's KPIs and
 * reason options track the active staff/reason filters — the server summary
 * covers the whole period only. Equals the server summary when `orders` is
 * the unfiltered period set. Reasons are returned highest-count first.
 */
export const summariseVoids = (orders: Order[]): VoidsRollup => {
  const byReason = new Map<VoidReason, { count: number; amount: number }>();
  let voidedItems = 0;
  let voidAmount = 0;

  for (const order of orders) {
    for (const item of orderVoidedItems(order)) {
      const amount = item.netAmount ?? 0;
      voidedItems += 1;
      voidAmount += amount;
      const reason = item.voidReason as VoidReason;
      const tally = byReason.get(reason) ?? { count: 0, amount: 0 };
      tally.count += 1;
      tally.amount += amount;
      byReason.set(reason, tally);
    }
  }

  const reasons: VoidReasonTally[] = Array.from(byReason, ([reason, t]) => ({
    reason,
    count: t.count,
    amount: t.amount,
  })).sort((a, b) => b.count - a.count);

  return { voidedOrders: orders.length, voidedItems, voidAmount, reasons };
};
