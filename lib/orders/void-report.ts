import type { Order, OrderItem } from "@/types/orders/type";

/** Voided line items: removed AND carrying a void reason (matches the OMS predicate). */
export const orderVoidedItems = (o: Order): OrderItem[] =>
  (o.removedItems ?? []).filter((i) => i.voidReason != null);

/** Net value voided on this order. */
export const orderVoidAmount = (o: Order): number =>
  orderVoidedItems(o).reduce((sum, i) => sum + (i.netAmount ?? 0), 0);

/** Number of voided line items on this order. */
export const voidedItemCount = (o: Order): number => orderVoidedItems(o).length;
