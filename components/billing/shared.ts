import { format, parseISO } from "date-fns";
import type { BadgeProps } from "@/components/ui/badge";
import type {
  InvoiceStatus,
  CreditTransactionType,
} from "@/types/billing/types";
import type { SubscriptionStatus } from "@/types/types";

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

export function isUnlimited(limit: number | undefined | null): boolean {
  return limit === undefined || limit === null || limit === -1;
}
