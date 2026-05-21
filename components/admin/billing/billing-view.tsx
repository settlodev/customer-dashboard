"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2,
  Gift,
  Loader2,
  MoreHorizontal,
  Plus,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

import { ApplyDiscountDialog } from "@/components/admin/billing/apply-discount-dialog";
import { GenerateInvoiceDialog } from "@/components/admin/billing/generate-invoice-dialog";
import { GrantFreeSubscriptionDialog } from "@/components/admin/billing/grant-free-subscription-dialog";
import { InvoiceActionsDialog } from "@/components/admin/billing/invoice-actions-dialog";
import { revokeDiscount } from "@/lib/actions/admin/billing";
import {
  DiscountResponse,
  InvoicePage,
  InvoiceResponse,
  InvoiceStatus,
  SubscriptionDiscountResponse,
  SubscriptionResponse,
  SubscriptionStatus,
} from "@/types/admin/billing";

interface BillingViewProps {
  businessId: string;
  subscription: SubscriptionResponse | null;
  invoicePage: InvoicePage | null;
  activeDiscounts: SubscriptionDiscountResponse[];
  availableDiscounts: DiscountResponse[];
  canGrantFree: boolean;
  errors: {
    subscription: string | null;
    invoices: string | null;
    activeDiscounts: string | null;
    availableDiscounts: string | null;
  };
}

const SUBSCRIPTION_STATUS_BADGE: Record<
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
    className:
      "border-muted bg-muted text-muted-foreground",
  },
};

const INVOICE_STATUS_BADGE: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
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

export function BillingView({
  businessId,
  subscription,
  invoicePage,
  activeDiscounts,
  availableDiscounts,
  canGrantFree,
  errors,
}: BillingViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [applyDiscountOpen, setApplyDiscountOpen] = useState(false);
  const [grantFreeOpen, setGrantFreeOpen] = useState(false);
  const [invoiceTarget, setInvoiceTarget] = useState<InvoiceResponse | null>(
    null,
  );

  const handleRevoke = useCallback(
    (discount: SubscriptionDiscountResponse) => {
      if (!confirm(`Revoke "${discount.discountName}" discount?`)) return;
      startTransition(async () => {
        const result = await revokeDiscount(businessId, discount.id);
        if (result.responseType === "error") {
          toast({
            title: "Failed to revoke discount",
            description: result.message,
            variant: "destructive",
          });
          return;
        }
        toast({ title: result.message });
        router.refresh();
      });
    },
    [businessId, router, toast],
  );

  const refresh = () => router.refresh();

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => setGenerateOpen(true)}
          disabled={!subscription}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Generate invoice
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setApplyDiscountOpen(true)}
          disabled={!subscription || availableDiscounts.length === 0}
        >
          <Sparkles className="mr-1.5 h-4 w-4" />
          Apply discount
        </Button>
        {canGrantFree && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGrantFreeOpen(true)}
            disabled={!subscription}
            className="text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
          >
            <Gift className="mr-1.5 h-4 w-4" />
            Grant free subscription
          </Button>
        )}
      </div>

      {/* Subscription summary */}
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">Subscription</h3>
          {subscription && (
            <Badge
              variant="outline"
              className={SUBSCRIPTION_STATUS_BADGE[subscription.status].className}
            >
              {SUBSCRIPTION_STATUS_BADGE[subscription.status].label}
            </Badge>
          )}
        </div>
        {!subscription ? (
          <p className="text-sm text-muted-foreground">
            No subscription found for this business.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Info label="Subscription ID" value={subscription.id} mono />
            <Info
              label="Auto renew"
              value={subscription.autoRenew ? "Yes" : "No"}
            />
            <Info
              label="Free subscription"
              value={subscription.isFreeSubscription ? "Yes" : "No"}
            />
            <Info
              label="Active discount"
              value={subscription.hasActiveDiscount ? "Yes" : "No"}
            />
            <Info
              label="Trial"
              value={
                subscription.trialEndDate
                  ? `${formatDate(subscription.trialStartDate)} → ${formatDate(subscription.trialEndDate)}`
                  : "—"
              }
            />
            <Info
              label="Paid through"
              value={formatDate(subscription.paidThrough)}
            />
            <Info
              label="Next billing"
              value={formatDate(subscription.nextBillingDate)}
            />
            <Info
              label="Cancelled at"
              value={formatDate(subscription.cancelledAt)}
            />
          </div>
        )}

        {subscription && subscription.items.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <h4 className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Subscription items
            </h4>
            <ul className="space-y-1.5">
              {subscription.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="font-medium text-ink">
                    {item.packageName ?? item.packageId}
                  </span>
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {item.status}
                    {item.quantity ? ` · ${item.quantity}×` : ""}
                    {item.unitPrice !== null
                      ? ` · ${formatMoney(item.unitPrice)}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Active discounts */}
      <div className="rounded-lg border border-line bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink">
          Active discounts
        </h3>
        {errors.activeDiscounts ? (
          <p className="text-sm text-destructive">{errors.activeDiscounts}</p>
        ) : activeDiscounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active discounts.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeDiscounts.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-canvas/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {d.discountName}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {d.discountType === "PERCENTAGE"
                      ? `${d.discountValue}% off`
                      : `${formatMoney(d.discountValue)} off`}
                    {d.isFreeSubscription ? " · free subscription" : ""}
                    {d.expiresAt ? ` · expires ${formatDate(d.expiresAt)}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(d)}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invoices */}
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Invoices</h3>
          {invoicePage && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {invoicePage.totalElements} total
            </p>
          )}
        </div>

        {errors.invoices ? (
          <p className="text-sm text-destructive">{errors.invoices}</p>
        ) : !invoicePage || invoicePage.content.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No invoices on file for this business.
          </p>
        ) : (
          <>
            <div className="overflow-hidden rounded-md border border-line">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead className="w-[60px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicePage.content.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-ink">
                            {inv.invoiceNumber}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {inv.lineItems.length} line
                            {inv.lineItems.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={INVOICE_STATUS_BADGE[inv.status].className}
                        >
                          {INVOICE_STATUS_BADGE[inv.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatMoney(inv.totalAmount)}
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-muted-foreground">
                        {formatDate(inv.invoiceDate)}
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-muted-foreground">
                        {formatDate(inv.paidAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Actions for ${inv.invoiceNumber}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => setInvoiceTarget(inv)}
                            >
                              View / actions
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {invoicePage.totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="font-mono text-[12px] text-muted-foreground">
                  Page {invoicePage.number + 1} of {invoicePage.totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push(
                        `/billing?businessId=${businessId}&page=${invoicePage.number - 1}`,
                      );
                    }}
                    disabled={invoicePage.first || isPending}
                  >
                    <ArrowLeftIcon className="mr-1 h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push(
                        `/billing?businessId=${businessId}&page=${invoicePage.number + 1}`,
                      );
                    }}
                    disabled={invoicePage.last || isPending}
                  >
                    Next
                    <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      {subscription && (
        <GenerateInvoiceDialog
          businessId={businessId}
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          onCreated={refresh}
        />
      )}
      {subscription && (
        <ApplyDiscountDialog
          businessId={businessId}
          discounts={availableDiscounts}
          open={applyDiscountOpen}
          onOpenChange={setApplyDiscountOpen}
          onApplied={refresh}
        />
      )}
      {subscription && canGrantFree && (
        <GrantFreeSubscriptionDialog
          businessId={businessId}
          open={grantFreeOpen}
          onOpenChange={setGrantFreeOpen}
          onGranted={refresh}
        />
      )}
      {invoiceTarget && (
        <InvoiceActionsDialog
          businessId={businessId}
          invoice={invoiceTarget}
          open={!!invoiceTarget}
          onOpenChange={(open) => {
            if (!open) setInvoiceTarget(null);
          }}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          mono
            ? "break-all font-mono text-[12px] text-ink"
            : "break-words text-[13px] text-ink"
        }
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
