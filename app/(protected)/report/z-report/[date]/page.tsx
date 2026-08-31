import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ExternalLink, Printer } from "lucide-react";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VfdStatusNotice } from "@/components/reports/z-report/vfd-status-notice";
import { getCurrentDestination } from "@/lib/actions/context";
import { getZReportDay } from "@/lib/actions/z-report-actions";
import { requireReportAccess } from "@/lib/auth-utils";
import { fmtClock, shortId } from "@/lib/day-sessions/cod-format";
import { vfdSalesFigure } from "@/lib/z-report/aggregate";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ date: string }> };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const money = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(value)
    ? "—"
    : Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

const signed = (value: number) =>
  `${value > 0 ? "+" : ""}${Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value)}`;

const balanced = (value: number) => Math.abs(value) < 1;

/**
 * The combined Z-report for a single business date: every session of that day
 * rolled into one set of figures, with the TRA fiscal Z beside it.
 *
 * <p>Drill-down target of the Z-report list. The per-session detail an
 * operator needs at close (item-level voids, prepayment lines, the cash-up)
 * stays on each session's own Close-of-Day page, linked from the sessions
 * table — this page is the day-level view those roll up into.
 */
export default async function ZReportDayPage({ params }: Params) {
  const { date } = await params;
  await requireReportAccess("/report/z-report");

  if (!ISO_DATE.test(date)) notFound();

  const destination = await getCurrentDestination();
  if (!destination || destination.type !== "LOCATION") notFound();

  const day = await getZReportDay(destination.id, date);
  const { local, aggregate, vfd, variance } = day;

  const longDate = format(new Date(`${date}T00:00:00`), "EEEE, MMMM d, yyyy");

  if (!local && !vfd) {
    return (
      <PageShell maxWidth="wide">
        <PageBreadcrumbs
          items={[
            { title: "Z-report", href: "/report/z-report" },
            { title: date },
          ]}
        />
        <PageHeader title={longDate} subtitle="Nothing recorded for this day." />
        <PageBody>
          <VfdStatusNotice
            availability={day.vfdAvailability}
            error={day.vfdError}
          />
          <NoItems itemName="sessions" />
        </PageBody>
      </PageShell>
    );
  }

  const netCollected = aggregate?.sales.netCollected ?? local?.net ?? 0;

  return (
    <PageShell maxWidth="wide">
      <PageBreadcrumbs
        items={[
          { title: "Z-report", href: "/report/z-report" },
          { title: date },
        ]}
      />
      <PageHeader
        title={longDate}
        subtitle={
          local
            ? `${local.sessionCount} ${local.sessionCount === 1 ? "session" : "sessions"} · ${local.orderCount} orders`
            : "Fiscal Z only — no day session on this date"
        }
        titleAccessory={
          aggregate?.preliminary ? (
            <Badge variant="warn">Provisional — a session is still open</Badge>
          ) : undefined
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/z-report/${date}`} target="_blank">
              <Printer className="mr-2 h-4 w-4" />
              Print / download
            </Link>
          </Button>
        }
      />

      <PageBody>
        <KpiStrip cols={4}>
          <KpiCard
            label="Net sales"
            value={money(local?.net)}
            unit={day.currency}
            delta={`${local?.orderCount ?? 0} orders`}
            tooltip="Selling value billed across every session of the day, comps included."
          />
          <KpiCard
            label="Net collected"
            value={money(netCollected)}
            unit={day.currency}
            delta={
              aggregate?.complimentaryAmount
                ? `less ${money(aggregate.complimentaryAmount)} comped`
                : "no comps"
            }
            tooltip="Net sales less anything given away on the house — what the day should actually have taken."
          />
          <KpiCard
            label="Tax charged"
            value={money(local?.taxAmount)}
            unit={day.currency}
            delta={`on ${money(local?.taxableAmount)} taxable`}
          />
          <KpiCard
            label="Cash net"
            value={money(aggregate?.cashNet)}
            unit={day.currency}
            delta="cash in less cash out"
            tooltip="Cash collections minus cash refunds and cash-paid expenses across the day's sessions."
          />
        </KpiStrip>

        <VfdStatusNotice
          availability={day.vfdAvailability}
          error={day.vfdError}
        />

        {aggregate && aggregate.missingSessionCount > 0 && (
          <p className="text-[11px] text-warn">
            {aggregate.missingSessionCount} of {local?.sessionCount} sessions
            have no report in analytics yet — the day&apos;s totals below
            under-count until they land.
          </p>
        )}

        {/* ── Settlo vs TRA ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settlo vs TRA</CardTitle>
            <CardDescription>
              {vfd
                ? `Fiscal Z issued ${vfd.zrTime ? `at ${vfd.zrTime}` : "on this date"}${vfd.status ? ` · ${vfd.status}` : ""}`
                : day.vfdAvailability === "available"
                  ? "The device has no Z for this date."
                  : "No fiscal device on this location."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 font-medium">Figure</th>
                    <th className="py-2 text-right font-medium">Settlo</th>
                    <th className="py-2 text-right font-medium">VFD</th>
                    <th className="py-2 text-right font-medium">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <ComparisonRow
                    label="Sales (VAT inclusive)"
                    local={local?.net ?? null}
                    fiscal={vfd ? vfdSalesFigure(vfd) : null}
                    delta={variance?.sales ?? null}
                  />
                  <ComparisonRow
                    label="Tax"
                    local={local?.taxAmount ?? null}
                    fiscal={vfd?.totalTax ?? null}
                    delta={variance?.tax ?? null}
                  />
                  <ComparisonRow
                    label="Discounts"
                    local={local?.discounts ?? null}
                    fiscal={vfd?.totalDiscount ?? null}
                    delta={
                      local && vfd
                        ? local.discounts - (vfd.totalDiscount ?? 0)
                        : null
                    }
                  />
                  <ComparisonRow
                    label="Orders / fiscal receipts"
                    local={local?.orderCount ?? null}
                    fiscal={vfd?.totalReceipt ?? null}
                    delta={variance?.receipts ?? null}
                    integer
                  />
                </tbody>
              </table>
            </div>

            {vfd && (
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-muted/40 p-3 text-xs sm:grid-cols-3">
                <RawFigure label="Total sales" value={vfd.totalSales} />
                <RawFigure label="Sales VAT inc." value={vfd.totalSalesVatInc} />
                <RawFigure label="Sales VAT exc." value={vfd.totalSalesVatExc} />
                <RawFigure label="Net amount" value={vfd.totalNetAmount} />
                <RawFigure label="Gross" value={vfd.gross} />
                <RawFigure label="Tax" value={vfd.totalTax} />
              </div>
            )}
            {vfd && (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                The device reports several overlapping money fields; the
                comparison above reads the VAT-inclusive one, which is what
                Settlo&apos;s net sales are billed at. All six are shown raw so
                the choice stays checkable.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Sessions behind the day ───────────────────────────────── */}
        {local && local.sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Sessions on this business day
              </CardTitle>
              <CardDescription>
                Each settles independently — open a session for its cash-up,
                item-level voids and Close-of-Day report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 font-medium">Session</th>
                      <th className="py-2 font-medium">Opened</th>
                      <th className="py-2 font-medium">Closed</th>
                      <th className="py-2 text-right font-medium">Orders</th>
                      <th className="py-2 text-right font-medium">Net sales</th>
                      <th className="py-2 text-right font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {day.sessions.map(({ session, hasReport }) => (
                      <tr key={session.sessionId}>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {shortId(session.sessionId)}
                            </span>
                            {session.status === "OPEN" && (
                              <Badge variant="warn" className="text-[10px]">
                                Open
                              </Badge>
                            )}
                            {!hasReport && (
                              <span
                                className="text-[10px] text-muted-foreground"
                                title="Analytics has no report for this session, so its figures are missing from the day total."
                              >
                                no report
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 tabular-nums">
                          {fmtClock(session.openedAt)}
                        </td>
                        <td className="py-2 tabular-nums">
                          {session.closedAt ? fmtClock(session.closedAt) : "—"}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {session.orderCount}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {money(session.netSales)}
                        </td>
                        <td className="py-2 text-right">
                          <Link
                            href={`/day-sessions/${session.sessionId}`}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink hover:underline"
                          >
                            Open
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Payments ──────────────────────────────────────────────── */}
        {aggregate && aggregate.paymentsByMethod.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments by method</CardTitle>
              <CardDescription>
                Every session of the day combined.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 font-medium">Method</th>
                      <th className="py-2 text-right font-medium">Count</th>
                      <th className="py-2 text-right font-medium">Amount</th>
                      <th className="py-2 text-right font-medium">Tips</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {aggregate.paymentsByMethod.map((pm) => (
                      <tr key={pm.paymentMethodId ?? pm.paymentMethodCode}>
                        <td className="py-2">
                          {pm.paymentMethodName ?? pm.paymentMethodCode ?? "—"}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {pm.count}
                        </td>
                        <td className="py-2 text-right font-medium tabular-nums">
                          {money(pm.amount)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {pm.tips ? money(pm.tips) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-medium">
                      <td className="py-2">Total</td>
                      <td className="py-2 text-right tabular-nums">
                        {aggregate.paymentsByMethod.reduce(
                          (s, pm) => s + pm.count,
                          0,
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {money(
                          aggregate.paymentsByMethod.reduce(
                            (s, pm) => s + pm.amount,
                            0,
                          ),
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {money(aggregate.sales.tips)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Day movements ─────────────────────────────────────────── */}
        {aggregate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Day movements</CardTitle>
              <CardDescription>
                What moved off the day&apos;s takings, summed across sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Movement
                label="Refunds"
                value={money(aggregate.refunds.amount)}
                note={`${aggregate.refunds.count} refunded`}
              />
              <Movement
                label="Discounts"
                value={money(aggregate.sales.discounts)}
                note="off list price"
              />
              <Movement
                label="Comps"
                value={money(aggregate.complimentaryAmount)}
                note={`${aggregate.complimentaryCount} orders on the house`}
              />
              <Movement
                label="Expenses"
                value={money(aggregate.expenses.amount)}
                note={`${aggregate.expenses.count} paid out`}
              />
              <Movement
                label="Voids"
                value={money(aggregate.voids.voidedAmount)}
                note={`${aggregate.voids.voidedItemCount} items`}
              />
              <Movement
                label="Cancelled orders"
                value={money(aggregate.voids.cancelledAmount)}
                note={`${aggregate.voids.cancelledOrderCount} orders`}
              />
              <Movement
                label="COGS"
                value={money(aggregate.cogs)}
                note="cost of what sold"
              />
              <Movement
                label="Gross profit"
                value={money(aggregate.grossProfit)}
                note="collected less COGS and expenses"
              />
            </CardContent>
          </Card>
        )}

        {/* ── Tax split ─────────────────────────────────────────────── */}
        {day.taxByCode.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tax by code</CardTitle>
              <CardDescription>
                As charged on the day&apos;s orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 font-medium">Code</th>
                      <th className="py-2 text-right font-medium">Taxable</th>
                      <th className="py-2 text-right font-medium">Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {day.taxByCode.map((code) => (
                      <tr key={`${code.taxCode}-${code.taxName ?? ""}`}>
                        <td className="py-2">
                          <span className="font-medium">
                            {code.taxCode || "Unclassified"}
                          </span>
                          {code.taxName && (
                            <span className="ml-2 text-[11px] text-muted-foreground">
                              {code.taxName}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {money(code.taxableAmount)}
                        </td>
                        <td className="py-2 text-right font-medium tabular-nums">
                          {money(code.taxAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Departments ───────────────────────────────────────────── */}
        {aggregate && aggregate.salesByDepartment.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales by department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 font-medium">Department</th>
                      <th className="py-2 text-right font-medium">Qty</th>
                      <th className="py-2 text-right font-medium">Net</th>
                      <th className="py-2 text-right font-medium">
                        Gross profit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {aggregate.salesByDepartment.map((dept) => (
                      <tr key={dept.departmentId ?? "unassigned"}>
                        <td className="py-2">
                          {dept.departmentName ?? (
                            <span className="text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {dept.quantity}
                        </td>
                        <td className="py-2 text-right font-medium tabular-nums">
                          {money(dept.net)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {money(dept.grossProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </PageShell>
  );
}

function ComparisonRow({
  label,
  local,
  fiscal,
  delta,
  integer = false,
}: {
  label: string;
  local: number | null;
  fiscal: number | null;
  delta: number | null;
  integer?: boolean;
}) {
  const show = (value: number | null) =>
    value === null
      ? "—"
      : integer
        ? value.toLocaleString()
        : money(value);

  return (
    <tr>
      <td className="py-2">{label}</td>
      <td className="py-2 text-right font-medium tabular-nums">
        {show(local)}
      </td>
      <td className="py-2 text-right font-medium tabular-nums">
        {show(fiscal)}
      </td>
      <td
        className={cn(
          "py-2 text-right tabular-nums",
          delta === null || balanced(delta)
            ? "text-muted-foreground"
            : "font-medium text-warn",
        )}
      >
        {delta === null ? "n/a" : balanced(delta) ? "0" : signed(delta)}
      </td>
    </tr>
  );
}

function RawFigure({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{money(value)}</span>
    </div>
  );
}

function Movement({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{note}</span>
    </div>
  );
}
