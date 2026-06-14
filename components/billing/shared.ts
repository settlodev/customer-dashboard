import { format, parseISO } from "date-fns";
import type { BadgeProps } from "@/components/ui/badge";
import type {
  InvoiceStatus,
  CreditTransactionType,
  SubscriptionItemStatus,
} from "@/types/billing/types";
import type { SubscriptionStatus } from "@/types/types";
import type { Business } from "@/types/business/type";
import type { Location } from "@/types/location/type";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;
type ActiveSubscriptionStatus = NonNullable<SubscriptionStatus>;

export function formatBillingDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "d MMM yyyy");
  } catch {
    return "—";
  }
}

export function formatBillingDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "d MMM yyyy, HH:mm");
  } catch {
    return "—";
  }
}

const SUBSCRIPTION_STATUS_VARIANT: Record<ActiveSubscriptionStatus, BadgeVariant> = {
  ACTIVE: "pos",
  TRIAL: "pos",
  PAST_DUE: "warn",
  SUSPENDED: "neg",
  EXPIRED: "neg",
  CANCELLED: "neg",
};

const SUBSCRIPTION_STATUS_LABEL: Record<ActiveSubscriptionStatus, string> = {
  ACTIVE: "Active",
  TRIAL: "Trial",
  PAST_DUE: "Past due",
  SUSPENDED: "Suspended",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export function getSubscriptionStatusMeta(
  status: SubscriptionStatus | undefined | null,
): { label: string; variant: BadgeVariant } {
  if (!status) return { label: "Unknown", variant: "soft" };
  return {
    label: SUBSCRIPTION_STATUS_LABEL[status] ?? status,
    variant: SUBSCRIPTION_STATUS_VARIANT[status] ?? "soft",
  };
}

const INVOICE_STATUS_VARIANT: Record<InvoiceStatus, BadgeVariant> = {
  PAID: "pos",
  PENDING: "warn",
  DRAFT: "soft",
  FAILED: "neg",
  CANCELLED: "soft",
  REFUNDED: "secondary",
};

const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  DRAFT: "Draft",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function getInvoiceStatusMeta(status: InvoiceStatus): {
  label: string;
  variant: BadgeVariant;
} {
  return {
    label: INVOICE_STATUS_LABEL[status] ?? status,
    variant: INVOICE_STATUS_VARIANT[status] ?? "soft",
  };
}

const CREDIT_TXN_LABEL: Record<CreditTransactionType, string> = {
  PACKAGE_RENEWAL: "Renewal",
  PACK_PURCHASE: "Purchase",
  USAGE: "Usage",
  MANUAL_ADJUSTMENT: "Adjustment",
  EXPIRY: "Expiry",
  REFUND: "Refund",
};

export function getCreditTxnLabel(type: CreditTransactionType): string {
  return CREDIT_TXN_LABEL[type] ?? type;
}

// ── Per-item subscription status ──────────────────────────────────────
// Each SubscriptionItem has its own lifecycle status independent of the
// parent subscription. REMOVED is a soft-delete sentinel (item no longer
// visible in active listings); the rest map to the billing service enum.

const SUBSCRIPTION_ITEM_STATUS_VARIANT: Record<SubscriptionItemStatus, BadgeVariant> = {
  ACTIVE: "pos",
  PAST_DUE: "warn",
  EXPIRED: "neg",
  SUSPENDED: "neg",
  CANCELLED: "neg",
  REMOVED: "soft",
};

const SUBSCRIPTION_ITEM_STATUS_LABEL: Record<SubscriptionItemStatus, string> = {
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
  REMOVED: "Removed",
};

export function getSubscriptionItemStatusMeta(
  status: SubscriptionItemStatus,
): { label: string; variant: BadgeVariant } {
  return {
    label: SUBSCRIPTION_ITEM_STATUS_LABEL[status] ?? status,
    variant: SUBSCRIPTION_ITEM_STATUS_VARIANT[status] ?? "soft",
  };
}

export function isUnlimited(limit: number | undefined | null): boolean {
  return limit === undefined || limit === null || limit === -1;
}

export interface InvoiceParty {
  name: string;
  /** Shown under `name` only when the business name differs from the location name. */
  secondaryName?: string;
  addressLines: string[];
  phone?: string;
  email?: string;
}

// Fixed seller identity printed on every subscription invoice — Settlo is the
// merchant of record for SaaS billing, regardless of which whitelabel ran the
// transaction.
export const SETTLO_SELLER: InvoiceParty = {
  name: "Settlo Technologies Limited",
  addressLines: [
    "P.O. Box 8059",
    "Dar Es Salaam",
    "United Republic of Tanzania",
  ],
  phone: "+255 759 229 777",
  email: "support@settlo.co.tz",
};

function pickString(...candidates: Array<string | null | undefined>): string {
  for (const c of candidates) {
    const v = typeof c === "string" ? c.trim() : "";
    if (v) return v;
  }
  return "";
}

// Build the "Bill to" party from a location and its parent business. Each field
// prefers the location value and falls back to the business value when the
// location is missing it. The business name is shown as a secondary line only
// when it differs from the location name.
export function buildBillToParty(
  location: Location | null | undefined,
  business: Business | null | undefined,
): InvoiceParty {
  const locName = pickString(location?.name);
  const busName = pickString(business?.name);
  const name = pickString(locName, busName) || "—";
  const secondaryName =
    locName && busName && locName !== busName ? busName : undefined;

  const street = pickString(location?.address, business?.address);
  const ward = pickString(location?.ward, business?.ward);
  const district = pickString(location?.district, business?.district);
  const region = pickString(location?.region, business?.region);
  const postalCode = pickString(location?.postalCode, business?.postalCode);

  const addressLines: string[] = [];
  if (street) addressLines.push(street);
  const cityLine = [ward, district].filter(Boolean).join(", ");
  if (cityLine) addressLines.push(cityLine);
  const regionLine = [region, postalCode].filter(Boolean).join(" ");
  if (regionLine) addressLines.push(regionLine);

  const phone = pickString(location?.phoneNumber, business?.phoneNumber) || undefined;
  const email = pickString(location?.email, business?.email) || undefined;

  return { name, secondaryName, addressLines, phone, email };
}
