import Link from "next/link";
import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  InvoicePage,
  InvoiceStatus,
  SubscriptionDiscountResponse,
  SubscriptionResponse,
  SubscriptionStatus,
} from "@/types/admin/billing";

interface BusinessSubscriptionPanelProps {
  businessId: string;
  subscription: SubscriptionResponse | null;
  invoices: InvoicePage | null;
  activeDiscounts: SubscriptionDiscountResponse[];
  errors: {
    subscription: string | null;
    invoices: string | null;
    discounts: string | null;
  };
}

const SUBSCRIPTION_BADGE: Record<
  SubscriptionStatus,
  { label: string; className: string }
> = {
  TRIAL: {
    label: "Trial",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  },
  ACTIVE: {
    label: "Active",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  PAST_DUE: {
    label: "Past due",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  },
  EXPIRED: {
    label: "Expired",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
  SUSPENDED: {
    label: "Suspended",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-muted bg-muted text-muted-foreground",
  },
};

const INVOICE_BADGE: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "border-muted bg-muted text-muted-foreground",
  },
  PENDING: {
    label: "Pending",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  },
  PAID: {
    label: "Paid",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  FAILED: {
    label: "Failed",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-muted bg-muted text-muted-foreground",
  },
  REFUNDED: {
    label: "Refunded",
    className:
      "border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
  },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="break-words text-[13px] text-ink">{value ?? "—"}</p>
    </div>
  );
}

export function BusinessSubscriptionPanel({
  businessId,
  subscription,
  invoices,
  activeDiscounts,
  errors,
}: BusinessSubscriptionPanelProps) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <CreditCard className="h-4 w-4 text-primary" />
          Subscription &amp; billing
        </h3>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/businesses/${businessId}/billing`}>
            Manage billing →
          </Link>
        </Button>
      </div>

      {/* Subscription summary */}
      {errors.subscription && !subscription ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errors.subscription}
        </p>
      ) : !subscription ? (
        <p className="rounded-md border border-dashed border-line p-4 text-center text-sm text-muted-foreground">
          No subscription found for this business.
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className={SUBSCRIPTION_BADGE[subscription.status].className}
            >
              {SUBSCRIPTION_BADGE[subscription.status].label}
            </Badge>
            {subscription.isFreeSubscription && (
              <Badge
                variant="outline"
                className="border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20"
              >
                Free
              </Badge>
            )}
            {subscription.hasActiveDiscount && (
              <Badge
                variant="outline"
                className="border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20"
              >
                Discounted
              </Badge>
            )}
            {!subscription.autoRenew && (
              <Badge
                variant="outline"
                className="border-muted bg-muted text-muted-foreground"
              >
                Auto-renew off
              </Badge>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <MiniInfo
              label="Trial"
              value={
                subscription.trialEndDate
                  ? `${formatDate(subscription.trialStartDate)} → ${formatDate(subscription.trialEndDate)}`
                  : "—"
              }
            />
            <MiniInfo
              label="Paid through"
              value={formatDate(subscription.paidThrough)}
            />
            <MiniInfo
              label="Next billing"
              value={formatDate(subscription.nextBillingDate)}
            />
            <MiniInfo
              label="Cancelled at"
              value={formatDate(subscription.cancelledAt)}
            />
          </div>

          {subscription.items.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                Plan items
              </p>
              <ul className="space-y-1">
                {subscription.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span className="font-medium text-ink">
                      {item.packageName ?? item.packageId}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {item.status}
                      {item.unitPrice !== null
                        ? ` · ${formatMoney(item.unitPrice)}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Active discounts */}
      {(activeDiscounts.length > 0 || errors.discounts) && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Active discounts
          </p>
          {errors.discounts ? (
            <p className="text-sm text-destructive">{errors.discounts}</p>
          ) : (
            <ul className="space-y-1">
              {activeDiscounts.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-ink">{d.discountName}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {d.discountType === "PERCENTAGE"
                      ? `${d.discountValue}% off`
                      : `${formatMoney(d.discountValue)} off`}
                    {d.expiresAt ? ` · until ${formatDate(d.expiresAt)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Recent invoices */}
      <div className="mt-4 border-t border-line pt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Recent invoices
          </p>
          {invoices && invoices.totalElements > 0 && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {invoices.totalElements} total
            </p>
          )}
        </div>

        {errors.invoices ? (
          <p className="text-sm text-destructive">{errors.invoices}</p>
        ) : !invoices || invoices.content.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No invoices on file.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-line">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.content.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-ink">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={INVOICE_BADGE[inv.status].className}
                      >
                        {INVOICE_BADGE[inv.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMoney(inv.totalAmount)}
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-muted-foreground">
                      {formatDate(inv.invoiceDate)}
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-muted-foreground">
                      {formatDate(inv.paidAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
