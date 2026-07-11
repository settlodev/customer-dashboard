import { notFound } from "next/navigation";
import {
  Activity,
  Ban,
  Banknote,
  CircleDollarSign,
  ListChecks,
  ListX,
  PiggyBank,
  Receipt,
  Undo2,
  Wallet,
} from "lucide-react";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { getCurrentDestination } from "@/lib/actions/context";
import {
  getCloseOfDayExtras,
  getDaySessionDetail,
} from "@/lib/actions/day-session-list-actions";
import { listPaymentMethodReconciliations } from "@/lib/actions/payment-method-reconciliation-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { PaymentMethodReconciliationCard } from "@/components/widgets/accounting/payment-method-reconciliation-card";
import { VOID_REASON_LABELS, VoidReason } from "@/types/orders/type";
import type { DaySessionExpenseItem } from "@/types/expense/type";

type Params = Promise<{ id: string }>;

const STATUS_TONE: Record<string, "pos" | "neg" | "warn" | "soft"> = {
  OPEN: "pos",
  CLOSED: "soft",
  SUPERSEDED: "warn",
  DELETED: "neg",
};

const fmt = (n?: number | null) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDuration = (
  openedAt?: string | null,
  closedAt?: string | null,
): string => {
  if (!openedAt) return "—";
  const open = new Date(openedAt).getTime();
  const close = closedAt ? new Date(closedAt).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((close - open) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const fmtTime = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Same +/− convention as PaymentMethodReconciliationCard's fmtVariance. */
const fmtVariance = (n?: number | null) => {
  const v = n ?? 0;
  return `${v > 0 ? "+" : ""}${fmt(v)}`;
};

/** Shortens a UUID for display when no human-readable label is available. */
const shortId = (id?: string | null): string => (id ? `${id.slice(0, 8)}…` : "—");

/**
 * Staff display name for the raw ids Order Management returns on void /
 * refund rows (removedBy/approvedBy/processedBy/staffId). `staffById` is
 * built once per page load from {@link fetchAllStaff}; falls back to a
 * shortened id — never blocks rendering on a missed lookup.
 */
const staffLabel = (
  id: string | null | undefined,
  staffById: Map<string, string>,
): string => {
  if (!id) return "—";
  return staffById.get(id) ?? shortId(id);
};

const VOID_REASON_TONE: Record<string, "neg" | "warn"> = {
  STAFF_ERROR: "neg",
  WRONG_ITEM: "neg",
  QUALITY: "neg",
  CUSTOMER_REQUEST: "warn",
  DUPLICATE: "warn",
  OUT_OF_STOCK: "warn",
  OTHER: "warn",
};

const voidReasonBadge = (
  reason: VoidReason | null,
): { label: string; tone: "neg" | "warn" } | null => {
  if (!reason) return null;
  return {
    label: VOID_REASON_LABELS[reason] ?? reason,
    tone: VOID_REASON_TONE[reason] ?? "warn",
  };
};

const PREPAYMENT_STATUS_TONE: Record<string, "warn" | "pos"> = {
  HELD: "warn",
  APPLIED: "pos",
};

/** Combines paymentStatus + paymentMethodCodes into one status chip, e.g. "PAID · CASH". */
const expenseStatusChip = (
  item: DaySessionExpenseItem,
): { label: string; tone: "pos" | "neg" | "warn" } => {
  const methods = item.paymentMethodCodes?.length
    ? item.paymentMethodCodes.join(" + ")
    : null;
  const tone =
    item.paymentStatus === "PAID"
      ? "pos"
      : item.paymentStatus === "UNPAID"
        ? "neg"
        : "warn";
  return {
    label: methods ? `${item.paymentStatus} · ${methods}` : item.paymentStatus,
    tone,
  };
};

export default async function DaySessionDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const destination = await getCurrentDestination();
  if (!destination || destination.type !== "LOCATION") notFound();
  const locationId = destination.id;

  // Fan out every read for this page at once: the lifecycle+report pair,
  // per-method cash-up, the four Close-of-Day extras (prepayments/
  // refunds/voids/expenses — each already null-safe on its own), and the
  // staff roster for name resolution. One slow/unavailable service never
  // blocks the others from rendering.
  const [detail, reconciliations, extras, staffList] = await Promise.all([
    getDaySessionDetail(locationId, id),
    listPaymentMethodReconciliations(id),
    getCloseOfDayExtras(locationId, id),
    fetchAllStaff().catch(() => []),
  ]);
  // Either half of `detail` can be null:
  //   - session=null  → Accounts couldn't find the session for this
  //     location. Likely a stale URL or wrong location selected — 404.
  //   - report=null   → Reports temporarily unavailable or no orders
  //     yet on a freshly-opened session. Render the lifecycle card and
  //     show empty financials gracefully below.
  if (!detail.session) notFound();
  const { session, report } = detail;

  // id -> display name, for the raw staff ids on void/refund rows.
  const staffById = new Map(
    staffList.map((s): [string, string] => [s.id, s.fullName]),
  );

  const headerLabel =
    session.identifier ?? `Session ${session.id.slice(0, 8)}`;
  const reportIsLive = session.status === "OPEN" && report?.preliminary;

  // "312 orders · 1,048 items" — itemCount is a newer field, so degrade to
  // just the order count when an older report payload doesn't carry it.
  const salesSummaryLine = report
    ? `${fmt(report.orderCount)} order${report.orderCount === 1 ? "" : "s"}` +
      (report.sales.itemCount != null
        ? ` · ${fmt(report.sales.itemCount)} item${report.sales.itemCount === 1 ? "" : "s"}`
        : "")
    : "";

  const voidItems = extras.voids?.items ?? [];
  const refundItems = extras.refunds?.refunds ?? [];
  const prepaymentItems = extras.prepayments?.items ?? [];
  const expenseItems = extras.expenses?.items ?? [];

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Day sessions", href: "/day-sessions" },
          { title: headerLabel },
        ]}
      />
      <PageHeader
        title={headerLabel}
        subtitle={`Business day ${session.businessDate} · ${session.triggerType} trigger`}
        titleAccessory={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[session.status] ?? "soft"}>
              {session.status}
            </Badge>
            {reportIsLive ? (
              <span className="text-[10px] uppercase tracking-wide text-emerald-700">
                live snapshot
              </span>
            ) : null}
          </div>
        }
      />

      <PageBody>
        {/* ── Lifecycle card (Accounts source of truth) ─────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Opened
              </div>
              <div>{fmtDateTime(session.openedAt)}</div>
              {session.openedByLabel ? (
                <div className="text-[11px] text-gray-500">
                  {session.openedByLabel}
                </div>
              ) : null}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Closed
              </div>
              <div>{fmtDateTime(session.closedAt)}</div>
              {session.closedByLabel ? (
                <div className="text-[11px] text-gray-500">
                  {session.closedByLabel}
                </div>
              ) : null}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Duration
              </div>
              <div>{fmtDuration(session.openedAt, session.closedAt)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Extensions
              </div>
              <div>{session.extensionCount ?? 0}</div>
              {session.extendedUntil ? (
                <div className="text-[11px] text-gray-500">
                  Until {fmtDateTime(session.extendedUntil)}
                </div>
              ) : null}
            </div>
            {session.openingNotes ? (
              <div className="col-span-2 md:col-span-4">
                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                  Opening notes
                </div>
                <div className="whitespace-pre-line text-sm">
                  {session.openingNotes}
                </div>
              </div>
            ) : null}
            {session.closingNotes ? (
              <div className="col-span-2 md:col-span-4">
                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                  Closing notes
                </div>
                <div className="whitespace-pre-line text-sm">
                  {session.closingNotes}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* ── KPI strip ─────────────────────────────────────────────────── */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<CircleDollarSign className="h-3 w-3" />}
            label="Net sales"
            value={fmt(report?.sales.net)}
            delta={report ? `${fmt(report.sales.gross)} gross` : ""}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<ListChecks className="h-3 w-3" />}
            label="Orders"
            value={fmt(report?.orderCount)}
            delta={
              report?.openOrdersAtClose
                ? `${report.openOrdersAtClose} open at close`
                : ""
            }
            deltaTone={
              report?.openOrdersAtClose ? "neg" : "neutral"
            }
          />
          <KpiCard
            icon={<Undo2 className="h-3 w-3" />}
            label="Refunds"
            value={fmt(report?.refunds.amount)}
            delta={
              report?.refunds.count
                ? `${report.refunds.count} refund${report.refunds.count === 1 ? "" : "s"}`
                : "None"
            }
            deltaTone={report && report.refunds.count > 0 ? "neg" : "pos"}
          />
          <KpiCard
            icon={<Wallet className="h-3 w-3" />}
            label="Cash net"
            value={fmt(report?.cashNet)}
            delta="Receipts − refunds − cash expenses"
            deltaTone="neutral"
          />
        </KpiStrip>

        {/* ── Detail tabs ───────────────────────────────────────────────── */}
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
            <TabsTrigger value="voids-refunds">Voids & refunds</TabsTrigger>
            <TabsTrigger value="prepayments">Prepayments</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          {/* ── Summary tab ─────────────────────────────────────────── */}
          <TabsContent value="summary" className="space-y-4 pt-4">
            {report ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sales breakdown</CardTitle>
                  {salesSummaryLine ? (
                    <CardDescription>{salesSummaryLine}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <KvRow label="Gross sales" value={fmt(report.sales.gross)} />
                  <KvRow
                    label="Discounts"
                    value={`− ${fmt(report.sales.discounts)}`}
                  />
                  <KvRow label="Net sales" value={fmt(report.sales.net)} bold />
                  <KvRow label="Tips" value={fmt(report.sales.tips)} />
                  <KvRow
                    label="Refunds"
                    value={`− ${fmt(report.refunds.amount)}`}
                  />
                  <KvRow
                    label="Expenses"
                    value={`− ${fmt(report.expenses.amount)}`}
                  />
                  <KvRow label="COGS" value={`− ${fmt(report.cogs)}`} />
                  <KvRow
                    label="Gross profit"
                    value={fmt(report.grossProfit)}
                    bold
                  />
                </CardContent>
              </Card>
            ) : (
              <EmptyReportCard
                message={
                  session.status === "OPEN"
                    ? "No financial activity yet — the X-report will populate as orders post."
                    : "Reports Service is temporarily unavailable. Refresh in a moment."
                }
              />
            )}
          </TabsContent>

          {/* ── Payments tab ────────────────────────────────────────── */}
          <TabsContent value="payments" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">By payment method</CardTitle>
              </CardHeader>
              <CardContent>
                {report && report.paymentsByMethod.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {report.paymentsByMethod.map((p) => (
                      <div
                        key={p.paymentMethodId}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Receipt className="h-3.5 w-3.5 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {p.paymentMethodName}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {p.count} transaction{p.count === 1 ? "" : "s"}
                              {p.tips > 0 ? ` · ${fmt(p.tips)} tips` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="font-medium">{fmt(p.amount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No payments recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Reconciliation tab ──────────────────────────────────── */}
          <TabsContent value="reconciliation" className="space-y-4 pt-4">
            {/* Physical till (drawer count-up) — deliberately a separate
                card from the multi-method reconciliation below: this is
                the single cash-drawer count, not a per-payment-method
                approval flow. */}
            {report?.physicalTill ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Banknote className="h-3.5 w-3.5" />
                    Physical till (cash drawer)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <KvRow
                    label="Opening float"
                    value={fmt(report.physicalTill.opening)}
                  />
                  <KvRow
                    label="Counted"
                    value={fmt(report.physicalTill.counted)}
                  />
                  <KvRow
                    label="Expected"
                    value={fmt(report.physicalTill.expected)}
                  />
                  <KvRow
                    label="Variance"
                    value={fmtVariance(report.physicalTill.variance)}
                    bold
                    tone={
                      !report.physicalTill.variance
                        ? undefined
                        : report.physicalTill.variance > 0
                          ? "pos"
                          : "neg"
                    }
                  />
                </CardContent>
              </Card>
            ) : null}

            <PaymentMethodReconciliationCard
              reconciliations={reconciliations}
              sessionId={id}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  Lifecycle flags
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                <KvRow
                  label="Force-closed"
                  value={(report?.openOrdersAtClose ?? 0) > 0 ? "Yes" : "No"}
                />
                <KvRow
                  label="Open at close"
                  value={String(report?.openOrdersAtClose ?? 0)}
                />
                <KvRow
                  label="Extensions"
                  value={String(session.extensionCount ?? 0)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Voids & refunds tab ──────────────────────────────────── */}
          <TabsContent value="voids-refunds" className="space-y-4 pt-4">
            {report?.voids ? (
              <KpiStrip cols={2}>
                <KpiCard
                  icon={<ListX className="h-3 w-3" />}
                  label="Voided items"
                  value={fmt(report.voids.voidedAmount)}
                  delta={`${fmt(report.voids.voidedItemCount)} item${report.voids.voidedItemCount === 1 ? "" : "s"}`}
                  deltaTone={report.voids.voidedItemCount > 0 ? "neg" : "pos"}
                />
                <KpiCard
                  icon={<Ban className="h-3 w-3" />}
                  label="Cancelled orders"
                  value={fmt(report.voids.cancelledAmount)}
                  delta={`${fmt(report.voids.cancelledOrderCount)} order${report.voids.cancelledOrderCount === 1 ? "" : "s"}`}
                  deltaTone={report.voids.cancelledOrderCount > 0 ? "neg" : "pos"}
                />
              </KpiStrip>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListX className="h-3.5 w-3.5" />
                  Voided items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extras.voids ? (
                  voidItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">Ticket</th>
                            <th className="px-3 py-2 font-medium">Reason</th>
                            <th className="px-3 py-2 font-medium">Waiter</th>
                            <th className="px-3 py-2 font-medium">Cashier</th>
                            <th className="px-3 py-2 font-medium">Approver</th>
                            <th className="px-3 py-2 font-medium">Time</th>
                            <th className="py-2 pl-3 text-right font-medium">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {voidItems.map((v) => {
                            const reason = voidReasonBadge(v.voidReason);
                            return (
                              <tr
                                key={`${v.orderId}:${v.orderItemId}`}
                                className="border-b last:border-0"
                              >
                                <td className="py-2.5 pr-3">
                                  <div className="font-medium">
                                    {v.quantity ? `${fmt(v.quantity)}× ` : ""}
                                    {v.itemName}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground tabular-nums">
                                    #{v.orderNumber}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  {reason ? (
                                    <Badge variant={reason.tone}>
                                      {reason.label}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  {staffLabel(v.staffId, staffById)}
                                </td>
                                <td className="px-3 py-2.5">
                                  {staffLabel(v.removedBy, staffById)}
                                </td>
                                <td className="px-3 py-2.5">
                                  {staffLabel(v.approvedBy, staffById)}
                                </td>
                                <td className="px-3 py-2.5">
                                  {fmtTime(v.removedAt)}
                                </td>
                                <td className="py-2.5 pl-3 text-right font-medium">
                                  {fmt(v.netAmount)}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="font-medium">
                            <td className="py-2.5 pr-3" colSpan={6}>
                              Total
                            </td>
                            <td className="py-2.5 pl-3 text-right">
                              {fmt(extras.voids.totalVoidedAmount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No voided items or cancelled orders recorded this
                      session.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Void detail is unavailable for this session.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Undo2 className="h-3.5 w-3.5" />
                  Refunds
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extras.refunds ? (
                  refundItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">Item</th>
                            <th className="px-3 py-2 font-medium">Reason</th>
                            <th className="px-3 py-2 font-medium">Approver</th>
                            <th className="px-3 py-2 font-medium">Method</th>
                            <th className="py-2 pl-3 text-right font-medium">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {refundItems.map((r) => (
                            <tr key={r.id} className="border-b last:border-0">
                              <td className="py-2.5 pr-3">
                                {fmt(r.quantity)}× Item #{shortId(r.orderItemId)}
                              </td>
                              <td className="px-3 py-2.5">
                                {r.reason ?? "—"}
                              </td>
                              <td className="px-3 py-2.5">
                                {staffLabel(r.approvedBy, staffById)}
                              </td>
                              <td className="px-3 py-2.5">
                                {r.paymentMethodCode ?? "—"}
                              </td>
                              <td className="py-2.5 pl-3 text-right font-medium">
                                {fmt(r.refundAmount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-medium">
                            <td className="py-2.5 pr-3" colSpan={4}>
                              Total
                            </td>
                            <td className="py-2.5 pl-3 text-right">
                              {fmt(extras.refunds.totalAmount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No refunds recorded this session.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Refunds data is unavailable for this session.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Prepayments tab ──────────────────────────────────────── */}
          <TabsContent value="prepayments" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PiggyBank className="h-3.5 w-3.5" />
                  Prepayments & deposits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extras.prepayments ? (
                  prepaymentItems.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                              <th className="py-2 pr-3 font-medium">
                                Customer
                              </th>
                              <th className="px-3 py-2 font-medium">
                                Reference
                              </th>
                              <th className="px-3 py-2 font-medium">
                                Description
                              </th>
                              <th className="px-3 py-2 font-medium">Method</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                              <th className="py-2 pl-3 text-right font-medium">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {prepaymentItems.map((p, idx) => (
                              <tr
                                key={`${p.instrumentId}-${idx}`}
                                className="border-b last:border-0"
                              >
                                <td className="py-2.5 pr-3 font-medium">
                                  {p.customerName ?? "—"}
                                </td>
                                <td className="px-3 py-2.5">
                                  {p.reference ?? "—"}
                                </td>
                                <td className="px-3 py-2.5">
                                  {p.description ?? "—"}
                                </td>
                                <td className="px-3 py-2.5">
                                  {shortId(p.paymentMethodId)}
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge
                                    variant={
                                      PREPAYMENT_STATUS_TONE[p.status] ??
                                      "soft"
                                    }
                                  >
                                    {p.status}
                                  </Badge>
                                </td>
                                <td className="py-2.5 pl-3 text-right font-medium">
                                  {fmt(p.amount)}
                                </td>
                              </tr>
                            ))}
                            <tr className="font-medium">
                              <td className="py-2.5 pr-3" colSpan={5}>
                                Total received
                              </td>
                              <td className="py-2.5 pl-3 text-right">
                                {fmt(extras.prepayments.totals.totalReceived)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
                        <KvRow
                          label="Held"
                          value={fmt(extras.prepayments.totals.heldTotal)}
                        />
                        <KvRow
                          label="Applied"
                          value={fmt(extras.prepayments.totals.appliedTotal)}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No prepayments recorded this session.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Prepayments data is unavailable for this session.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Expenses tab ─────────────────────────────────────────── */}
          <TabsContent value="expenses" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5" />
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extras.expenses ? (
                  expenseItems.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                              <th className="py-2 pr-3 font-medium">
                                Description
                              </th>
                              <th className="px-3 py-2 font-medium">
                                Category
                              </th>
                              <th className="px-3 py-2 font-medium">Payee</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                              <th className="py-2 pl-3 text-right font-medium">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenseItems.map((e) => {
                              const chip = expenseStatusChip(e);
                              return (
                                <tr
                                  key={e.expenseId}
                                  className="border-b last:border-0"
                                >
                                  <td className="py-2.5 pr-3 font-medium">
                                    {e.description ?? "—"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {e.categoryName ?? "—"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {e.payeeName ?? "—"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <Badge variant={chip.tone}>
                                      {chip.label}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 pl-3 text-right font-medium">
                                    {fmt(e.amount)}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="font-medium">
                              <td className="py-2.5 pr-3" colSpan={4}>
                                Total
                              </td>
                              <td className="py-2.5 pl-3 text-right">
                                {fmt(extras.expenses.totals.totalAmount)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4 text-sm">
                        <KvRow
                          label="Paid · cash"
                          value={fmt(extras.expenses.totals.paidByCash)}
                        />
                        <KvRow
                          label="Paid · mobile"
                          value={fmt(extras.expenses.totals.paidByMobile)}
                        />
                        <KvRow
                          label="Unpaid"
                          value={fmt(extras.expenses.totals.unpaidTotal)}
                          tone={
                            extras.expenses.totals.unpaidTotal > 0
                              ? "neg"
                              : undefined
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No expenses recorded this session.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Expenses data is unavailable for this session.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageShell>
  );
}

function KvRow({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  /** Tints the value pos/neg — e.g. a physical-till variance or an unpaid total. */
  tone?: "pos" | "neg";
}) {
  const toneClass = tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "";
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`${bold ? "font-semibold" : ""} ${toneClass}`.trim()}>
        {value}
      </div>
    </div>
  );
}

function EmptyReportCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-gray-500">
        {message}
      </CardContent>
    </Card>
  );
}
