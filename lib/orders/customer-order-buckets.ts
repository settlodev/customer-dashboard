import { OrderStatus } from "@/types/orders/type";

/**
 * How one customer's orders split on their detail page. The three named
 * buckets are exclusive, so their counts add up to the ledger total (less
 * cancellations):
 *
 * - `signed`  — the debt: orders put on the customer's account as a signed
 *               bill and still owed (`signedAmount > 0`), whatever their
 *               status. This is the primary thing the page exists to show.
 * - `ongoing` — open at the till and never signed; running tabs.
 * - `closed`  — completed: closed with nothing owed on them.
 *
 * Carried on the URL as `?bucket=`; `all` is the default and is never written.
 */
export type CustomerOrderBucket = "all" | "ongoing" | "signed" | "closed";

export const CUSTOMER_ORDER_BUCKETS: ReadonlyArray<{
  key: CustomerOrderBucket;
  label: string;
  hint: string;
}> = [
  { key: "all", label: "All", hint: "Every order placed for this customer" },
  { key: "ongoing", label: "Ongoing", hint: "Open at the till, not yet signed" },
  {
    key: "signed",
    label: "Signed",
    hint: "On the customer's account and still owed",
  },
  { key: "closed", label: "Completed", hint: "Closed with nothing owed" },
];

export function parseCustomerOrderBucket(
  raw: string | undefined,
): CustomerOrderBucket {
  return raw === "ongoing" || raw === "signed" || raw === "closed"
    ? raw
    : "all";
}

/**
 * The OMS `/orders/search` and `/orders/summary` filters that carve a bucket
 * out of the customer's ledger — `status` plus the `signed` flag.
 */
export function customerOrderBucketQuery(bucket: CustomerOrderBucket): {
  status?: OrderStatus;
  signed?: boolean;
} {
  switch (bucket) {
    case "ongoing":
      return { status: OrderStatus.OPEN, signed: false };
    case "signed":
      return { signed: true };
    case "closed":
      return { status: OrderStatus.CLOSED, signed: false };
    default:
      return {};
  }
}
