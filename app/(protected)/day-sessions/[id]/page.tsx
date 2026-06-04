import { notFound } from "next/navigation";
import {
  Activity,
  CircleDollarSign,
  ListChecks,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { getCurrentDestination } from "@/lib/actions/context";
import { getDaySessionDetail } from "@/lib/actions/day-session-list-actions";
import { listPaymentMethodReconciliations } from "@/lib/actions/payment-method-reconciliation-actions";
import { PaymentMethodReconciliationCard } from "@/components/widgets/accounting/payment-method-reconciliation-card";

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

export default async function DaySessionDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const destination = await getCurrentDestination();
  if (!destination || destination.type !== "LOCATION") notFound();
  const locationId = destination.id;

  const detail = await getDaySessionDetail(locationId, id);
  // Either half can be null:
  //   - session=null  → Accounts couldn't find the session for this
  //     location. Likely a stale URL or wrong location selected — 404.
  //   - report=null   → Reports temporarily unavailable or no orders
  //     yet on a freshly-opened session. Render the lifecycle card and
  //     show empty financials gracefully below.
  if (!detail.session) notFound();
  const { session, report } = detail;

  // Per-method cash-up (Accounting Service) — manager approves here; an
  // offline-mobile-money variance posts a Mobile Money Over/Short.
  const reconciliations = await listPaymentMethodReconciliations(id);

  const headerLabel =
    session.identifier ?? `Session ${session.id.slice(0, 8)}`;
  const reportIsLive = session.status === "OPEN" && report?.preliminary;

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
          </TabsList>

          {/* ── Summary tab ─────────────────────────────────────────── */}
          <TabsContent value="summary" className="space-y-4 pt-4">
            {report ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sales breakdown</CardTitle>
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
        </Tabs>
      </PageBody>
    </PageShell>
  );
}

function KvRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={bold ? "font-semibold" : ""}>{value}</div>
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
