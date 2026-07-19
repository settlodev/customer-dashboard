import { format, parseISO } from "date-fns";
import type { BadgeProps } from "@/components/ui/badge";
import type {
  BillingTerm,
  EntityType,
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

/**
 * Money formatters for the billing surfaces. Locale is pinned to en-US
 * on purpose: these render inside `"use client"` components that still
 * SSR on Node, and an unpinned `toLocaleString()` resolves to the host
 * locale — which differs between the server and the browser and trips
 * hydration mismatches on every amount.
 */
export function formatAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Same, rounded to whole units — used in button labels and KPI values. */
export function formatWhole(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("en-US");
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

/** Cycle length in months for each billing term. */
export const BILLING_TERM_MONTHS: Record<BillingTerm, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  SEMI_ANNUAL: 6,
  ANNUAL: 12,
};

/**
 * How many months the subscription's own cycle covers. This is what a
 * server-side re-price bills for, so the pay dialog defaults its period
 * picker here — assuming a year would show a monthly account a 12-month
 * estimate for an invoice the service issues for one month.
 */
export function getTermMonths(term: BillingTerm | undefined | null): number {
  return term ? BILLING_TERM_MONTHS[term] : 12;
}

/** Human label for a billable entity type. Shared by the items table and
 *  the pay dialog so both read "Location" / "Warehouse" / "Store". */
export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  LOCATION: "Location",
  WAREHOUSE: "Warehouse",
  STORE: "Store",
};

export function isUnlimited(limit: number | undefined | null): boolean {
  return limit === undefined || limit === null || limit === -1;
}

/**
 * Returns true when the entity is currently in a free trial period.
 * Derived purely from the trial end date — if the date is in the future
 * the trial is active regardless of the subscription status field.
 */
export function isInTrial(trialEndDate: string | null | undefined): boolean {
  return !!trialEndDate && new Date(trialEndDate).getTime() > Date.now();
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
