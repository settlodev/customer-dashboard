"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  Coins,
  CreditCard,
  Layers,
  Percent,
  Receipt,
  ShieldCheck,
} from "lucide-react";

import {
  DetailTable,
  DetailTableBody,
  DetailTableHead,
  DetailTableTotals,
  DetailTd,
  DetailTh,
  EmptyState,
  FactGrid,
  fact,
  HeroCard,
  HeroChip,
  HeroLabel,
  HeroMeter,
  HeroValue,
  PanelCard,
  RailCard,
  SegTabs,
  StatusPill,
  type Fact,
  type SegTab,
} from "@/components/layouts/order-detail";
import { fmtClock, shortId } from "@/lib/day-sessions/cod-format";
import { vfdSalesFigure } from "@/lib/z-report/aggregate";
import type { ZReportDayDetail } from "@/types/reports/z-report";

type TabKey = "overview" | "sessions" | "tax" | "fiscal";

const num = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined || Number.isNaN(value)
    ? "—"
    : Intl.NumberFormat("en", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value);

const signed = (value: number) => `${value > 0 ? "+" : ""}${num(value)}`;

/** Rounding noise between two systems is not a finding. */
const balanced = (value: number) => Math.abs(value) < 1;

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Body of the combined daily Z-report, composed from the order-detail kit:
 * a persistent money rail on the left, drill-down tabs on the right.
 *
 * <p>The fiscal (TRA) rail card and tab exist ONLY when the device actually
 * returned a Z for the date. A location that doesn't print fiscal receipts
 * sees a plain daily Z-report with nothing about TRA on it — same rule the
 * order page follows with its Print-VFD button.
 */
export function ZReportDayView({ day }: { day: ZReportDayDetail }) {
  const { local, vfd } = day;
  const hasFiscal = !!vfd;

  const [tab, setTab] = useState<TabKey>("overview");

  const tabs: SegTab<TabKey>[] = [
    { id: "overview", label: "Overview", icon: Coins },
    {
      id: "sessions",
      label: "Sessions",
      icon: CalendarClock,
      count: local?.sessionCount || undefined,
    },
    {
      id: "tax",
      label: "Tax",
      icon: Percent,
      count: day.taxByCode.length || undefined,
    },
    ...(hasFiscal
      ? [{ id: "fiscal" as const, label: "Fiscal Z", icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
        <DayHero day={day} />
        <RailCard icon={<Coins className="h-3.5 w-3.5" />} title="Money breakdown">
          <FactGrid cols={1} rows={moneyRows(day)} />
        </RailCard>
        {hasFiscal && (
          <RailCard
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            title="Fiscal Z (TRA)"
          >
            <FactGrid cols={1} rows={fiscalRows(day)} />
          </RailCard>
        )}
      </aside>

      <main className="flex min-w-0 flex-col gap-3.5">
        <SegTabs tabs={tabs} active={tab} onSelect={setTab} />
        <div className="flex flex-col gap-3.5">
          {tab === "overview" && <OverviewPanel day={day} />}
          {tab === "sessions" && <SessionsPanel day={day} />}
          {tab === "tax" && <TaxPanel day={day} />}
          {tab === "fiscal" && hasFiscal && <FiscalPanel day={day} />}
        </div>
      </main>
    </div>
  );
}

function moneyRows(d: ZReportDayDetail): Fact[] {
  const a = d.aggregate;
  const rows: Fact[] = [
    fact("Gross sales", num(a?.sales.gross ?? d.local?.gross)),
    fact("Discounts", `−${num(a?.sales.discounts ?? d.local?.discounts)}`),
  ];
  if (a?.complimentaryAmount) {
    rows.push(fact("Comps", `−${num(a.complimentaryAmount)}`));
  }
  rows.push(
    fact("Net sales", num(d.local?.net ?? a?.sales.net)),
    fact("Tax charged", num(d.local?.taxAmount)),
  );
  if (a?.refunds.amount) rows.push(fact("Refunds", `−${num(a.refunds.amount)}`));
  if (a?.expenses.amount) {
    rows.push(fact("Expenses", `−${num(a.expenses.amount)}`));
  }
  rows.push(fact("Cash net", num(a?.cashNet)));
  return rows;
}

function fiscalRows(d: ZReportDayDetail): Fact[] {
  if (!d.vfd) return [];
  const rows: Fact[] = [
    fact("Receipts", num(d.vfd.totalReceipt)),
    fact("Sales", num(vfdSalesFigure(d.vfd))),
    fact("Tax", num(d.vfd.totalTax)),
    fact("Issued", d.vfd.zrTime ?? null),
  ];
  if (d.variance) {
    rows.push({
      label: "Difference",
      badge: (
        <StatusPill tone={balanced(d.variance.sales) ? "pos" : "warn"} dot>
          {balanced(d.variance.sales) ? "Matches" : signed(d.variance.sales)}
        </StatusPill>
      ),
    });
  }
  return rows;
}

// ─── money rail ──────────────────────────────────────────────────────

function DayHero({ day }: { day: ZReportDayDetail }) {
  const { local, aggregate, vfd, variance, currency } = day;
  const netCollected = aggregate?.sales.netCollected ?? local?.net ?? 0;
  const gross = aggregate?.sales.gross ?? local?.gross ?? 0;

  // With a fiscal device the meter answers the question that matters at
  // close — how much of the day reached TRA. Without one it falls back to
  // how much of the gross ring-up the day actually kept.
  const meter = vfd
    ? {
        pct: local?.orderCount
          ? clamp((vfd.totalReceipt / local.orderCount) * 100)
          : 0,
        color:
          variance && variance.receipts === 0 ? "#12B981" : "#E0A43B",
        left: `${num(vfd.totalReceipt)} of ${num(local?.orderCount)} fiscalised`,
        right:
          variance && variance.receipts === 0
            ? "All receipted"
            : `${num(Math.abs(variance?.receipts ?? 0))} unreceipted`,
      }
    : {
        pct: gross > 0 ? clamp((netCollected / gross) * 100) : 0,
        color: "#12B981",
        left: `Gross ${num(gross)}`,
        right: `Kept ${gross > 0 ? Math.round((netCollected / gross) * 100) : 0}%`,
      };

  return (
    <HeroCard>
      <div className="flex items-center justify-between gap-3">
        <HeroLabel>Net collected</HeroLabel>
        {aggregate?.preliminary ? (
          <HeroChip tone="warn">Provisional</HeroChip>
        ) : local?.sessionCount ? (
          <HeroChip tone="muted">
            {local.sessionCount}{" "}
            {local.sessionCount === 1 ? "session" : "sessions"}
          </HeroChip>
        ) : null}
      </div>
      <HeroValue value={num(netCollected)} unit={currency} />
      <HeroMeter {...meter} />
    </HeroCard>
  );
}

// ─── panels ──────────────────────────────────────────────────────────

function OverviewPanel({ day }: { day: ZReportDayDetail }) {
  const a = day.aggregate;

  if (!a) {
    return (
      <PanelCard icon={<Coins className="h-3.5 w-3.5" />} title="Overview">
        <EmptyState
          icon={<Coins className="h-4 w-4" />}
          title="No session figures for this day"
          sub="Analytics has nothing recorded against this business date yet."
        />
      </PanelCard>
    );
  }

  const paymentTotal = a.paymentsByMethod.reduce((s, pm) => s + pm.amount, 0);
  const paymentCount = a.paymentsByMethod.reduce((s, pm) => s + pm.count, 0);

  const movements: Fact[] = [
    fact("Refunds", `${num(a.refunds.amount)} · ${a.refunds.count}`),
    fact("Comps", `${num(a.complimentaryAmount)} · ${a.complimentaryCount}`),
    fact("Voids", `${num(a.voids.voidedAmount)} · ${a.voids.voidedItemCount}`),
    fact(
      "Cancelled",
      `${num(a.voids.cancelledAmount)} · ${a.voids.cancelledOrderCount}`,
    ),
    fact("Expenses", `${num(a.expenses.amount)} · ${a.expenses.count}`),
    fact("COGS", num(a.cogs)),
    fact("Gross profit", num(a.grossProfit)),
    fact("Tips", num(a.sales.tips)),
  ];

  return (
    <>
      <PanelCard
        icon={<CreditCard className="h-3.5 w-3.5" />}
        title="Payments"
        count={a.paymentsByMethod.length || undefined}
        pad0
      >
        {a.paymentsByMethod.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-4 w-4" />}
            title="No payments recorded"
          />
        ) : (
          <DetailTable>
            <DetailTableHead>
              <DetailTh>Method</DetailTh>
              <DetailTh align="right">Count</DetailTh>
              <DetailTh align="right">Amount</DetailTh>
              <DetailTh align="right">Tips</DetailTh>
            </DetailTableHead>
            <DetailTableBody>
              {a.paymentsByMethod.map((pm) => (
                <tr key={pm.paymentMethodId ?? pm.paymentMethodCode}>
                  <DetailTd>
                    {pm.paymentMethodName ?? pm.paymentMethodCode ?? "—"}
                  </DetailTd>
                  <DetailTd align="right">{pm.count}</DetailTd>
                  <DetailTd align="right" strong>
                    {num(pm.amount)}
                  </DetailTd>
                  <DetailTd align="right" dim={!pm.tips}>
                    {pm.tips ? num(pm.tips) : "—"}
                  </DetailTd>
                </tr>
              ))}
            </DetailTableBody>
            <DetailTableTotals>
              <DetailTd strong>Total</DetailTd>
              <DetailTd align="right" strong>
                {paymentCount}
              </DetailTd>
              <DetailTd align="right" strong>
                {num(paymentTotal)}
              </DetailTd>
              <DetailTd align="right" strong>
                {num(a.sales.tips)}
              </DetailTd>
            </DetailTableTotals>
          </DetailTable>
        )}
      </PanelCard>

      <PanelCard icon={<Receipt className="h-3.5 w-3.5" />} title="Day movements">
        <FactGrid cols={2} rows={movements} />
      </PanelCard>

      {a.salesByDepartment.length > 1 && (
        <PanelCard
          icon={<Layers className="h-3.5 w-3.5" />}
          title="Sales by department"
          count={a.salesByDepartment.length}
          pad0
        >
          <DetailTable>
            <DetailTableHead>
              <DetailTh>Department</DetailTh>
              <DetailTh align="right">Qty</DetailTh>
              <DetailTh align="right">Net</DetailTh>
              <DetailTh align="right">Gross profit</DetailTh>
            </DetailTableHead>
            <DetailTableBody>
              {a.salesByDepartment.map((dept) => (
                <tr key={dept.departmentId ?? "unassigned"}>
                  <DetailTd dim={!dept.departmentName}>
                    {dept.departmentName ?? "Unassigned"}
                  </DetailTd>
                  <DetailTd align="right">{dept.quantity}</DetailTd>
                  <DetailTd align="right" strong>
                    {num(dept.net)}
                  </DetailTd>
                  <DetailTd align="right">{num(dept.grossProfit)}</DetailTd>
                </tr>
              ))}
            </DetailTableBody>
          </DetailTable>
        </PanelCard>
      )}
    </>
  );
}

function SessionsPanel({ day }: { day: ZReportDayDetail }) {
  if (day.sessions.length === 0) {
    return (
      <PanelCard
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        title="Sessions"
      >
        <EmptyState
          icon={<CalendarClock className="h-4 w-4" />}
          title="No day session on this date"
        />
      </PanelCard>
    );
  }

  return (
    <PanelCard
      icon={<CalendarClock className="h-3.5 w-3.5" />}
      title="Sessions"
      count={day.sessions.length}
      pad0
    >
      <DetailTable>
        <DetailTableHead>
          <DetailTh>Session</DetailTh>
          <DetailTh>Opened</DetailTh>
          <DetailTh>Closed</DetailTh>
          <DetailTh align="right">Orders</DetailTh>
          <DetailTh align="right">Net sales</DetailTh>
          <DetailTh align="right">{""}</DetailTh>
        </DetailTableHead>
        <DetailTableBody>
          {day.sessions.map(({ session, hasReport }) => (
            <tr key={session.sessionId}>
              <DetailTd>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11.5px]">
                    {shortId(session.sessionId)}
                  </span>
                  {session.status === "OPEN" && (
                    <StatusPill tone="warn" dot>
                      Open
                    </StatusPill>
                  )}
                  {!hasReport && (
                    <span
                      className="text-[11px] text-muted-2"
                      title="Analytics has no report for this session, so its figures are missing from the day total."
                    >
                      no report
                    </span>
                  )}
                </div>
              </DetailTd>
              <DetailTd>{fmtClock(session.openedAt)}</DetailTd>
              <DetailTd dim={!session.closedAt}>
                {session.closedAt ? fmtClock(session.closedAt) : "—"}
              </DetailTd>
              <DetailTd align="right">{session.orderCount}</DetailTd>
              <DetailTd align="right" strong>
                {num(session.netSales)}
              </DetailTd>
              <DetailTd align="right">
                <Link
                  href={`/day-sessions/${session.sessionId}`}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 hover:text-ink"
                >
                  Open
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </DetailTd>
            </tr>
          ))}
        </DetailTableBody>
      </DetailTable>
    </PanelCard>
  );
}

function TaxPanel({ day }: { day: ZReportDayDetail }) {
  if (day.taxByCode.length === 0) {
    return (
      <PanelCard icon={<Percent className="h-3.5 w-3.5" />} title="Tax by code">
        <EmptyState
          icon={<Percent className="h-4 w-4" />}
          title="No tax charged on this day"
        />
      </PanelCard>
    );
  }

  return (
    <PanelCard
      icon={<Percent className="h-3.5 w-3.5" />}
      title="Tax by code"
      count={day.taxByCode.length}
      pad0
    >
      <DetailTable>
        <DetailTableHead>
          <DetailTh>Code</DetailTh>
          <DetailTh align="right">Taxable</DetailTh>
          <DetailTh align="right">Tax</DetailTh>
        </DetailTableHead>
        <DetailTableBody>
          {day.taxByCode.map((code) => (
            <tr key={`${code.taxCode}-${code.taxName ?? ""}`}>
              <DetailTd>
                <span className="font-semibold">
                  {code.taxCode || "Unclassified"}
                </span>
                {code.taxName && (
                  <span className="ml-2 text-[11.5px] text-muted-foreground">
                    {code.taxName}
                  </span>
                )}
              </DetailTd>
              <DetailTd align="right">{num(code.taxableAmount)}</DetailTd>
              <DetailTd align="right" strong>
                {num(code.taxAmount)}
              </DetailTd>
            </tr>
          ))}
        </DetailTableBody>
        <DetailTableTotals>
          <DetailTd strong>Total</DetailTd>
          <DetailTd align="right" strong>
            {num(day.local?.taxableAmount)}
          </DetailTd>
          <DetailTd align="right" strong>
            {num(day.local?.taxAmount)}
          </DetailTd>
        </DetailTableTotals>
      </DetailTable>
    </PanelCard>
  );
}

function FiscalPanel({ day }: { day: ZReportDayDetail }) {
  const { local, vfd, variance } = day;
  if (!vfd) return null;

  const rows: Array<{
    label: string;
    settlo: number | null;
    fiscal: number | null;
    delta: number | null;
    integer?: boolean;
  }> = [
    {
      label: "Sales (VAT inclusive)",
      settlo: local?.net ?? null,
      fiscal: vfdSalesFigure(vfd),
      delta: variance?.sales ?? null,
    },
    {
      label: "Tax",
      settlo: local?.taxAmount ?? null,
      fiscal: vfd.totalTax,
      delta: variance?.tax ?? null,
    },
    {
      label: "Discounts",
      settlo: local?.discounts ?? null,
      fiscal: vfd.totalDiscount,
      delta: local ? local.discounts - (vfd.totalDiscount ?? 0) : null,
    },
    {
      label: "Orders / receipts",
      settlo: local?.orderCount ?? null,
      fiscal: vfd.totalReceipt,
      delta: variance?.receipts ?? null,
      integer: true,
    },
  ];

  const show = (value: number | null, integer?: boolean) =>
    value === null ? "—" : integer ? value.toLocaleString() : num(value);

  return (
    <>
      <PanelCard
        icon={<ShieldCheck className="h-3.5 w-3.5" />}
        title="Settlo vs TRA"
        pad0
      >
        <DetailTable>
          <DetailTableHead>
            <DetailTh>Figure</DetailTh>
            <DetailTh align="right">Settlo</DetailTh>
            <DetailTh align="right">VFD</DetailTh>
            <DetailTh align="right">Difference</DetailTh>
          </DetailTableHead>
          <DetailTableBody>
            {rows.map((row) => (
              <tr key={row.label}>
                <DetailTd>{row.label}</DetailTd>
                <DetailTd align="right" strong>
                  {show(row.settlo, row.integer)}
                </DetailTd>
                <DetailTd align="right" strong>
                  {show(row.fiscal, row.integer)}
                </DetailTd>
                <DetailTd align="right">
                  {row.delta === null ? (
                    <span className="text-muted-2">—</span>
                  ) : balanced(row.delta) ? (
                    <StatusPill tone="pos">Matches</StatusPill>
                  ) : (
                    <StatusPill tone="warn">
                      {row.integer
                        ? `${row.delta > 0 ? "+" : ""}${row.delta}`
                        : signed(row.delta)}
                    </StatusPill>
                  )}
                </DetailTd>
              </tr>
            ))}
          </DetailTableBody>
        </DetailTable>
      </PanelCard>

      <PanelCard
        icon={<Receipt className="h-3.5 w-3.5" />}
        title="As reported by the device"
      >
        <FactGrid
          cols={2}
          rows={[
            fact("Total sales", num(vfd.totalSales)),
            fact("Sales VAT inc.", num(vfd.totalSalesVatInc)),
            fact("Sales VAT exc.", num(vfd.totalSalesVatExc)),
            fact("Net amount", num(vfd.totalNetAmount)),
            fact("Gross", num(vfd.gross)),
            fact("Tax", num(vfd.totalTax)),
            fact("Issued", vfd.zrTime),
            fact("Status", vfd.status),
          ]}
        />
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
          The comparison above reads the VAT-inclusive figure, which is what
          Settlo bills at. Fiscal days are struck in EAT by the device, so a
          session running past midnight posts its late receipts under the next
          fiscal date.
        </p>
      </PanelCard>
    </>
  );
}
