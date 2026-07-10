"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Banknote,
  CalendarDays,
  ClipboardList,
  Clock,
  Coins,
  CreditCard,
  History,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  ShoppingCart,
  Sparkles,
  StickyNote,
  Tag,
  Timer,
  TrendingDown,
  TrendingUp,
  Undo2,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  OrderDetail,
  OrderDetailItem,
  OrderDetailRefund,
  OrderDetailTimelineEvent,
  OrderDetailTransaction,
  OrderStatus,
  ORDER_STATUS_LABELS,
} from "@/types/orders/type";

const TABS = [
  { key: "overview", label: "Overview", icon: User },
  { key: "items", label: "Items", icon: Package },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "refunds", label: "Refunds", icon: Undo2 },
  { key: "timeline", label: "Timeline", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_TONE: Record<
  OrderStatus,
  { variant: "pos" | "neg" | "warn" | "soft"; label: string }
> = {
  [OrderStatus.OPEN]: { variant: "warn", label: "Open" },
  [OrderStatus.CLOSED]: { variant: "pos", label: "Closed" },
  [OrderStatus.CANCELLED]: { variant: "neg", label: "Cancelled" },
  [OrderStatus.ABANDONED]: { variant: "warn", label: "Abandoned" },
};

const PAYMENT_TONE: Record<
  string,
  { variant: "pos" | "neg" | "warn" | "soft"; label: string }
> = {
  PAID: { variant: "pos", label: "Paid" },
  PARTIAL: { variant: "warn", label: "Partial" },
  NOT_PAID: { variant: "neg", label: "Unpaid" },
};

const formatNumber = (value: number | null | undefined, fractionDigits = 0) => {
  if (value === null || value === undefined) return "—";
  return Intl.NumberFormat("en", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(date);
};

export function OrderDetailView({ order }: { order: OrderDetail }) {
  const [tab, setTab] = useState<TabKey>("overview");

  const status = order.orderStatus as OrderStatus;
  const tone = STATUS_TONE[status];
  const opened = formatDateTime(order.openedDate);
  const closed = formatDateTime(order.closedDate);
  const totalLabel = formatNumber(order.netAmount ?? order.grossAmount);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-line bg-line">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-5">
          <SummaryTile
            icon={<ShoppingCart className="h-3 w-3" />}
            label="Items"
            value={order.itemCount.toString()}
            sub={
              order.uniqueItemCount
                ? `${order.uniqueItemCount} unique`
                : undefined
            }
          />
          <SummaryTile
            icon={<Coins className="h-3 w-3" />}
            label="Net total"
            value={totalLabel}
          />
          <SummaryTile
            icon={<Banknote className="h-3 w-3" />}
            label="Paid"
            value={formatNumber(order.paidAmount)}
            sub={
              order.unpaidAmount && order.unpaidAmount > 0
                ? `−${formatNumber(order.unpaidAmount)} unpaid`
                : "Settled"
            }
          />
          <SummaryTile
            icon={<Clock className="h-3 w-3" />}
            label="Opened"
            value={opened ?? "—"}
          />
          <SummaryTile
            icon={<Timer className="h-3 w-3" />}
            label="Duration"
            value={
              <LiveDuration
                startedAt={order.openedDate}
                endedAt={order.closedDate}
              />
            }
            sub={closed ? `Closed ${closed}` : "Live"}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={isActive}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "border-primary text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink-2"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && (
        <OverviewTab order={order} statusTone={tone} />
      )}
      {tab === "items" && <ItemsTab order={order} />}
      {tab === "payments" && <PaymentsTab order={order} />}
      {tab === "refunds" && <RefundsTab order={order} />}
      {tab === "timeline" && <TimelineTab events={order.timeline ?? []} />}
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────

function OverviewTab({
  order,
  statusTone,
}: {
  order: OrderDetail;
  statusTone?: { variant: "pos" | "neg" | "warn" | "soft"; label: string };
}) {
  const paymentKey = (order.paymentStatus ?? "").toUpperCase();
  const paymentTone = PAYMENT_TONE[paymentKey];
  const customerLabel = order.customer?.name ?? "Walk-in";
  const orderStatusLabel =
    statusTone?.label ??
    ORDER_STATUS_LABELS[order.orderStatus as OrderStatus] ??
    order.orderStatus;
  const paymentStatusLabel =
    paymentTone?.label ?? order.paymentStatus ?? "—";

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Order
        </h3>
        <div className="overflow-hidden rounded-lg border border-line bg-line">
          <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            <DetailRow
              icon={ClipboardList}
              label="Order #"
              value={order.orderNumber}
            />
            <DetailRow
              icon={User}
              label="Customer"
              value={customerLabel}
            />
            <DetailRow
              icon={Activity}
              label="Status"
              value={
                <Badge
                  variant={statusTone?.variant ?? "soft"}
                  className="text-[10.5px]"
                >
                  {orderStatusLabel}
                </Badge>
              }
            />
            <DetailRow
              icon={CreditCard}
              label="Payment"
              value={
                <Badge
                  variant={paymentTone?.variant ?? "soft"}
                  className="text-[10.5px]"
                >
                  {paymentStatusLabel}
                </Badge>
              }
            />
            <DetailRow
              icon={Sparkles}
              label="Type"
              value={order.orderType ?? order.servingType}
            />
            <DetailRow
              icon={MapPin}
              label="Source"
              value={order.orderSource ?? order.platformType}
            />
            <DetailRow
              icon={Activity}
              label="Fulfillment"
              value={order.fulfillmentStatus}
            />
            <DetailRow
              icon={CalendarDays}
              label="Business date"
              value={
                order.businessDate
                  ? new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                    }).format(new Date(order.businessDate))
                  : null
              }
            />
            <DetailRow
              icon={Tag}
              label="Slug"
              value={order.slug}
            />
          </dl>
        </div>

        <h3 className="mt-2 flex items-center gap-2 text-sm font-semibold">
          <Coins className="h-4 w-4 text-muted-foreground" />
          Totals
        </h3>
        <div className="overflow-hidden rounded-lg border border-line bg-line">
          <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            <DetailRow
              label="Gross"
              value={formatNumber(order.grossAmount)}
              emphasize
            />
            <DetailRow
              label="Discount"
              value={
                order.discountAmount && order.discountAmount > 0
                  ? `−${formatNumber(order.discountAmount)}`
                  : "—"
              }
            />
            <DetailRow
              label="Tax"
              value={
                order.taxAmount && order.taxAmount > 0
                  ? formatNumber(order.taxAmount)
                  : "—"
              }
            />
            <DetailRow
              label="Customer charges"
              value={formatNumber(order.customerChargesTotal)}
            />
            <DetailRow
              label="Tip"
              value={formatNumber(order.totalTipAmount)}
            />
            <DetailRow
              label="Net"
              value={formatNumber(order.netAmount)}
              emphasize
            />
            <DetailRow
              label="Paid"
              value={formatNumber(order.paidAmount)}
            />
            <DetailRow
              label="Unpaid"
              value={
                order.unpaidAmount && order.unpaidAmount > 0
                  ? formatNumber(order.unpaidAmount)
                  : "—"
              }
            />
            <DetailRow
              label="Cost"
              value={formatNumber(order.totalCostPrice)}
            />
            <DetailRow
              label="Gross profit"
              value={formatNumber(order.grossProfit)}
              tone={
                (order.grossProfit ?? 0) >= 0
                  ? "pos"
                  : "neg"
              }
            />
            <DetailRow
              label="Margin"
              value={
                order.profitMargin != null
                  ? `${formatNumber(order.profitMargin, 1)}%`
                  : null
              }
              tone={
                order.profitMargin != null && order.profitMargin >= 0
                  ? "pos"
                  : order.profitMargin != null
                    ? "neg"
                    : undefined
              }
            />
          </dl>
        </div>

        <h3 className="mt-2 flex items-center gap-2 text-sm font-semibold">
          <User className="h-4 w-4 text-muted-foreground" />
          People
        </h3>
        <div className="overflow-hidden rounded-lg border border-line bg-line">
          <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            <DetailRow
              icon={User}
              label="Started by"
              value={order.startedBy?.name}
            />
            <DetailRow
              icon={User}
              label="Assigned to"
              value={order.assignedTo?.name}
            />
            <DetailRow
              icon={User}
              label="Closed by"
              value={order.finishedBy?.name}
            />
            <DetailRow
              icon={Users}
              label="Customer"
              value={customerLabel}
            />
            <DetailRow
              icon={Phone}
              label="Phone"
              value={order.customer?.phone}
            />
            <DetailRow
              icon={Mail}
              label="Email"
              value={order.customer?.email}
            />
          </dl>
        </div>

        {order.notes && (
          <>
            <h3 className="mt-2 flex items-center gap-2 text-sm font-semibold">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              Notes
            </h3>
            <div className="rounded-lg border border-line bg-card px-4 py-3">
              <p className="whitespace-pre-wrap text-sm text-ink-2">
                {order.notes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ItemsTab({ order }: { order: OrderDetail }) {
  const items = order.items ?? [];
  const removed = order.removedItems ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-muted-foreground" />
              Items
            </h3>
            <Badge variant="soft">{items.length}</Badge>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items recorded.</p>
          ) : (
            <ItemTable rows={items} />
          )}
        </CardContent>
      </Card>

      {removed.length > 0 && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Undo2 className="h-4 w-4 text-muted-foreground" />
                Removed items
              </h3>
              <Badge variant="warn">{removed.length}</Badge>
            </div>
            <ItemTable rows={removed} muted />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ItemTable({
  rows,
  muted,
}: {
  rows: OrderDetailItem[];
  muted?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-[12.5px]">
        <thead className="bg-canvas">
          <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium">Item</th>
            <th className="px-3 py-2 text-right font-medium">Qty</th>
            <th className="px-3 py-2 text-right font-medium">Unit</th>
            <th className="px-3 py-2 text-right font-medium">Discount</th>
            <th className="px-3 py-2 text-right font-medium">Tax</th>
            <th className="px-3 py-2 text-right font-medium">Net</th>
            <th className="px-3 py-2 text-left font-medium">Prep</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((item) => (
            <tr
              key={item.id as string}
              className={muted ? "text-muted-foreground" : "text-ink"}
            >
              <td className="px-3 py-2.5 align-top">
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  {item.staffName && (
                    <span className="text-[11px] text-muted-foreground">
                      by {item.staffName}
                    </span>
                  )}
                  {item.specialInstructions && (
                    <span className="mt-0.5 text-[11px] italic text-muted-foreground">
                      {item.specialInstructions}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {formatNumber(item.quantity, 0)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {formatNumber(item.unitPrice)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {item.discountAmount && item.discountAmount > 0
                  ? `−${formatNumber(item.discountAmount)}`
                  : "—"}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {item.taxAmount && item.taxAmount > 0 ? (
                  <div className="flex flex-col items-end">
                    <span>{formatNumber(item.taxAmount)}</span>
                    {(item.taxRate || item.taxTypeCode) && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.taxRate ? `${formatNumber(item.taxRate, 0)}%` : ""}
                        {item.taxTypeCode ? ` · ${item.taxTypeCode}` : ""}
                        {item.taxInclusive === true
                          ? " · incl."
                          : item.taxInclusive === false
                            ? " · excl."
                            : ""}
                      </span>
                    )}
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                {formatNumber(item.netAmount)}
              </td>
              <td className="px-3 py-2.5 align-top text-[11px]">
                {item.preparationStatus ? (
                  <Badge variant="soft">{item.preparationStatus}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTab({ order }: { order: OrderDetail }) {
  const txs = order.transactions ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Coins className="h-4 w-4 text-muted-foreground" />
            Money summary
          </h3>
          <div className="space-y-3">
            <KeyVal
              label="Gross"
              value={formatNumber(order.grossAmount)}
              icon={<Receipt className="h-3.5 w-3.5" />}
            />
            <KeyVal
              label="Discount"
              value={
                order.discountAmount && order.discountAmount > 0
                  ? `−${formatNumber(order.discountAmount)}`
                  : "—"
              }
              icon={<Tag className="h-3.5 w-3.5" />}
            />
            <KeyVal
              label="Tax"
              value={
                order.taxAmount && order.taxAmount > 0
                  ? formatNumber(order.taxAmount)
                  : "—"
              }
              icon={<Receipt className="h-3.5 w-3.5" />}
            />
            <KeyVal
              label="Tip"
              value={formatNumber(order.totalTipAmount)}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            />
            <div className="border-t border-line pt-3">
              <KeyVal
                label="Net total"
                value={formatNumber(order.netAmount)}
                emphasize
              />
              <KeyVal
                label="Paid"
                value={formatNumber(order.paidAmount)}
                tone="pos"
              />
              <KeyVal
                label="Unpaid"
                value={
                  order.unpaidAmount && order.unpaidAmount > 0
                    ? formatNumber(order.unpaidAmount)
                    : "—"
                }
                tone={
                  order.unpaidAmount && order.unpaidAmount > 0 ? "neg" : "soft"
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Transactions
            </h3>
            <Badge variant="soft">{txs.length}</Badge>
          </div>

          {txs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions recorded for this order yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-[12.5px]">
                <thead className="bg-canvas text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Method</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 text-right font-medium">Tip</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {txs.map((tx) => (
                    <TransactionRow key={tx.id as string} tx={tx} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionRow({ tx }: { tx: OrderDetailTransaction }) {
  const status = tx.status?.toUpperCase();
  const tone =
    status === "PAID" || status === "CONFIRMED" || status === "SUCCESS"
      ? "pos"
      : status === "FAILED" || status === "DECLINED"
        ? "neg"
        : "soft";
  return (
    <tr>
      <td className="px-3 py-2.5">{tx.paymentMethodName ?? "—"}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        {formatNumber(tx.amount)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        {tx.tipAmount && tx.tipAmount > 0 ? formatNumber(tx.tipAmount) : "—"}
      </td>
      <td className="px-3 py-2.5">
        {tx.status ? <Badge variant={tone}>{tx.status}</Badge> : "—"}
      </td>
      <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
        {formatDateTime(tx.createdAt) ?? "—"}
      </td>
    </tr>
  );
}

function RefundsTab({ order }: { order: OrderDetail }) {
  const refunds = order.refunds ?? [];

  if (refunds.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No refunds have been issued for this order.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalRefunded = refunds.reduce(
    (sum, r) => sum + (r.refundAmount ?? 0),
    0,
  );
  const totalQty = refunds.reduce((sum, r) => sum + (r.quantity ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-line bg-line">
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
          <SummaryTile
            icon={<Undo2 className="h-3 w-3" />}
            label="Refunds"
            value={refunds.length.toString()}
          />
          <SummaryTile
            icon={<TrendingDown className="h-3 w-3" />}
            label="Total refunded"
            value={formatNumber(totalRefunded)}
          />
          <SummaryTile
            icon={<Package className="h-3 w-3" />}
            label="Items returned"
            value={formatNumber(totalQty)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-[12.5px]">
              <thead className="bg-canvas text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Item</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Refund</th>
                  <th className="px-3 py-2 text-left font-medium">Reason</th>
                  <th className="px-3 py-2 text-left font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {refunds.map((refund) => (
                  <RefundRow
                    key={refund.id as string}
                    refund={refund}
                    items={order.items ?? []}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RefundRow({
  refund,
  items,
}: {
  refund: OrderDetailRefund;
  items: OrderDetailItem[];
}) {
  const item = items.find((i) => i.id === refund.orderItemId);
  return (
    <tr>
      <td className="px-3 py-2.5">{item?.name ?? "—"}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        {formatNumber(refund.quantity)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        {formatNumber(refund.refundAmount)}
      </td>
      <td className="px-3 py-2.5">{refund.reason ?? "—"}</td>
      <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
        {formatDateTime(refund.createdAt) ?? "—"}
      </td>
    </tr>
  );
}

function TimelineTab({ events }: { events: OrderDetailTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No timeline events have been recorded for this order yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort newest-first so the most recent action shows up at the top.
  const sorted = [...events].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return tb - ta;
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <ol className="relative ml-2 space-y-4 border-l border-line pl-6">
          {sorted.map((event, idx) => (
            <li key={`${event.event}-${event.timestamp}-${idx}`}>
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-sm font-medium text-ink">
                  {humanizeEvent(event.event)}
                </p>
                <time className="font-mono text-[11px] text-muted-foreground">
                  {formatDateTime(event.timestamp) ?? event.timestamp}
                </time>
              </div>
              {event.message && (
                <p className="mt-1 text-[12.5px] text-ink-2">{event.message}</p>
              )}
              {event.performedByName && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  by {event.performedByName}
                </p>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

// ─── Reusable bits ───────────────────────────────────────────────────

function SummaryTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="bg-card px-4 py-4 md:px-5">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        <span className="opacity-70">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5 text-[18px] font-semibold leading-none tracking-[-0.025em] text-ink">
        <span className="truncate">{value}</span>
      </div>
      {sub && (
        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
          {sub}
        </p>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
  emphasize,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  emphasize?: boolean;
  tone?: "pos" | "neg";
}) {
  const isEmpty =
    value == null || (typeof value === "string" && value.trim() === "");
  const valueClass = tone === "pos"
    ? "text-emerald-700 dark:text-emerald-400"
    : tone === "neg"
      ? "text-rose-700 dark:text-rose-400"
      : "text-ink";
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd
        className={`min-w-0 break-words text-sm font-medium sm:text-right ${
          emphasize ? "text-base font-semibold" : ""
        } ${valueClass}`}
      >
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </dd>
    </div>
  );
}

function KeyVal({
  label,
  value,
  emphasize,
  tone,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
  tone?: "pos" | "neg" | "soft";
  icon?: React.ReactNode;
}) {
  const valueClass = tone === "pos"
    ? "text-emerald-700 dark:text-emerald-400"
    : tone === "neg"
      ? "text-rose-700 dark:text-rose-400"
      : "text-ink";
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={`tabular-nums ${valueClass} ${
          emphasize ? "text-base font-semibold" : "text-sm font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

const HUMANIZED_EVENTS: Record<string, string> = {
  ORDER_OPEN: "Order opened",
  ORDER_OPENED: "Order opened",
  ORDER_CLOSE: "Order closed",
  ORDER_CLOSED: "Order closed",
  ORDER_CANCEL: "Order cancelled",
  ORDER_CANCELLED: "Order cancelled",
  ORDER_REOPEN: "Order reopened",
  ORDER_REOPENED: "Order reopened",
  ORDER_ITEM_ADD: "Item added",
  ORDER_ITEM_ADDED: "Item added",
  ORDER_ITEM_REMOVE: "Item removed",
  ORDER_ITEM_VOIDED: "Item voided",
  ORDER_ITEM_REFUND: "Item refunded",
  ORDER_DISCOUNT_APPLIED: "Discount applied",
  ORDER_DISCOUNT_REMOVED: "Discount removed",
  ORDER_TRANSACTION_ADD: "Payment added",
  ORDER_TRANSACTION_ADDED: "Payment added",
  ORDER_LOCKED: "Order locked",
  ORDER_UNLOCKED: "Order unlocked",
  ORDER_TRANSFER: "Order transferred",
  ORDER_TRANSFERRED: "Order transferred",
  ORDER_ASSIGNED: "Order assigned",
};

function humanizeEvent(event: string): string {
  return (
    HUMANIZED_EVENTS[event] ??
    event.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())
  );
}

function LiveDuration({
  startedAt,
  endedAt,
}: {
  startedAt: string;
  endedAt?: string | null;
}) {
  const startMs = new Date(startedAt).getTime();
  const endMs = endedAt ? new Date(endedAt).getTime() : null;
  const frozen = endMs != null && !Number.isNaN(endMs);

  const compute = () => {
    if (Number.isNaN(startMs)) return 0;
    const now = frozen ? (endMs as number) : Date.now();
    return Math.max(0, Math.floor((now - startMs) / 1000));
  };

  const [elapsed, setElapsed] = useState(compute);

  useEffect(() => {
    setElapsed(compute());
    if (frozen) return;
    const id = setInterval(() => setElapsed(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMs, endMs, frozen]);

  if (Number.isNaN(startMs)) return <>—</>;
  return <span className="tabular-nums">{formatElapsed(elapsed)}</span>;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}hr ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
