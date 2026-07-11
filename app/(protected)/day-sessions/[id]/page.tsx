import { notFound } from "next/navigation";
import {
  CircleDollarSign,
  FileText,
  ListChecks,
  Scale,
  ShieldCheck,
  TrendingUp,
  Undo2,
  Wallet,
} from "lucide-react";

import {
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { getCurrentDestination } from "@/lib/actions/context";
import {
  getCloseOfDayExtras,
  getDaySessionDetail,
} from "@/lib/actions/day-session-list-actions";
import { listPaymentMethodReconciliations } from "@/lib/actions/payment-method-reconciliation-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import type { Staff } from "@/types/staff";

import { CashUpReconciliationCard } from "@/components/widgets/day-sessions/cash-up-reconciliation-card";
import { CodShareButton } from "@/components/widgets/day-sessions/cod-share-dialog";
import { ExportButton } from "@/components/widgets/day-sessions/print-button";
import {
  CancellationsVoids,
  CashDrawer,
  ExpensesList,
  PaymentMix,
  Prepayments,
  RefundsList,
  SalesBreakdown,
  SessionMetaStrip,
} from "@/components/widgets/day-sessions/cod-sections";
import {
  fmt,
  fmtDateTimeDot,
  fmtDuration,
  fmtTime,
  fmtVariance,
  initialsOf,
  marginPct,
  methodNameIndex,
  resolveCurrency,
  staffChip,
  staffName,
} from "@/lib/day-sessions/cod-format";

type Params = Promise<{ id: string }>;

const STATUS_TONE: Record<string, "pos" | "neg" | "warn" | "soft"> = {
  OPEN: "pos",
  CLOSED: "soft",
  SUPERSEDED: "warn",
  DELETED: "neg",
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
  // per-method cash-up, the four Close-of-Day extras, and the staff
  // roster for name/avatar resolution. One slow service never blocks the
  // others from rendering.
  const [detail, reconciliations, extras, staffList] = await Promise.all([
    getDaySessionDetail(locationId, id),
    listPaymentMethodReconciliations(id),
    getCloseOfDayExtras(locationId, id),
    fetchAllStaff().catch(() => [] as Staff[]),
  ]);

  // session=null → Accounts couldn't find it for this location (stale URL
  // or wrong location). report=null → Reports unavailable or no activity
  // yet; the page still renders the lifecycle + Close-of-Day extras.
  if (!detail.session) notFound();
  const { session, report } = detail;

  const staffById = new Map(staffList.map((s): [string, Staff] => [s.id, s]));
  const staffInitialsById = Object.fromEntries(
    staffList.map((s) => [s.id, initialsOf(s.fullName)]),
  );

  // id → payment-method name (from the report + reconciliation rows that
  // carry it) so prepayments and the cash drawer can label a raw method id.
  const methodNameById = methodNameIndex(
    report?.paymentsByMethod ?? [],
    reconciliations,
  );
  const txnsByMethodId = Object.fromEntries(
    (report?.paymentsByMethod ?? []).map((p) => [p.paymentMethodId, p.count]),
  );

  const currency = resolveCurrency(
    reconciliations.find((r) => r.currency)?.currency,
    extras.expenses?.items[0]?.currencyCode,
    extras.prepayments?.items[0]?.currency,
    extras.refunds?.refunds[0]?.refundCurrency,
  );

  // ── Verification (derived — the backend has no session-level sign-off).
  // A closed session is "verified" once every cash-up method is approved;
  // the verifier is whoever approved last.
  const approvedRecons = reconciliations
    .filter((r) => r.status === "APPROVED" && r.approvedAt)
    .sort(
      (a, b) =>
        new Date(b.approvedAt as string).getTime() -
        new Date(a.approvedAt as string).getTime(),
    );
  const pendingCount = reconciliations.filter(
    (r) => r.status === "SUBMITTED",
  ).length;
  const verified =
    session.status === "CLOSED" &&
    reconciliations.length > 0 &&
    reconciliations.every((r) => r.status === "APPROVED");
  const lastApproval = approvedRecons[0];
  const verifierChip =
    verified && lastApproval?.approvedBy
      ? staffChip(lastApproval.approvedBy, staffById, lastApproval.approvedByName)
      : null;

  const closedChip = session.closedBy
    ? staffChip(session.closedBy, staffById, session.closedByName)
    : null;

  // ── KPI figures ───────────────────────────────────────────────────
  const net = report?.sales.net ?? 0;
  const gross = report?.sales.gross ?? 0;
  const grossProfit = report?.grossProfit ?? 0;
  const margin = marginPct(grossProfit, net);
  const refundAmt = report?.refunds.amount ?? 0;
  const refundCount = report?.refunds.count ?? 0;
  const expectedTotal = reconciliations.reduce(
    (s, r) => s + (r.expectedAmount ?? 0),
    0,
  );
  const countedTotal = reconciliations.reduce(
    (s, r) => s + (r.countedAmount ?? 0),
    0,
  );
  const netVariance = countedTotal - expectedTotal;

  const headerLabel = session.identifier ?? `Session ${session.id.slice(0, 8)}`;
  const reportIsLive = session.status === "OPEN" && report?.preliminary;

  // ── Session meta strip cells ──────────────────────────────────────
  const metaCells = [
    {
      label: "Opened",
      value: fmtDateTimeDot(session.openedAt),
      sub:
        session.triggerType === "AUTO"
          ? "Auto · scheduler"
          : session.openedBy
            ? staffName(session.openedBy, staffById, session.openedByName)
            : (session.openedByLabel ?? "Manual"),
    },
    {
      label: "Closed",
      value: session.closedAt ? fmtDateTimeDot(session.closedAt) : "In progress",
      sub: session.closedAt
        ? `${fmtDuration(session.openedAt, session.closedAt)}${
            session.extensionCount
              ? ` · ${session.extensionCount} extension${session.extensionCount === 1 ? "" : "s"}`
              : ""
          }`
        : `Open ${fmtDuration(session.openedAt)}`,
    },
    closedChip
      ? {
          label: "Closed by",
          who: closedChip,
          sub: closedChip.title ?? undefined,
        }
      : {
          label: "Closed by",
          value: session.closedByLabel ?? "—",
          sub: session.status === "OPEN" ? "Session open" : undefined,
        },
    verifierChip
      ? {
          label: "Verified by",
          who: verifierChip,
          sub: `${verifierChip.title ? `${verifierChip.title} · ` : ""}${fmtTime(
            lastApproval?.approvedAt,
          )}`,
        }
      : {
          label: "Verified by",
          value: verified ? "Verified" : "Not verified",
          sub:
            !verified && pendingCount > 0
              ? `${pendingCount} awaiting`
              : undefined,
        },
    {
      label: "Opening float",
      value:
        report?.physicalTill?.opening != null ? (
          <>
            {fmt(report.physicalTill.opening)}
            <span className="ml-1.5 font-mono text-[11px] font-medium text-muted-foreground">
              {currency}
            </span>
          </>
        ) : (
          "—"
        ),
      sub: "Issued at open",
    },
  ];

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
        subtitle={
          <>
            Business day {session.businessDate}
            {session.locationName ? (
              <>
                {" · "}
                <span className="font-medium text-ink-3">
                  {session.locationName}
                </span>
              </>
            ) : null}
            {" · "}
            {session.triggerType} trigger
          </>
        }
        titleAccessory={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[session.status] ?? "soft"}>
              {session.status}
            </Badge>
            {verified ? (
              <Badge variant="pos">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            ) : null}
            {reportIsLive ? (
              <span className="font-mono text-[10px] uppercase tracking-wide text-pos">
                live snapshot
              </span>
            ) : null}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton />
            <CodShareButton
              locationId={locationId}
              sessionId={id}
              label={headerLabel}
            />
            <a
              href={`/day-sessions/${id}/report`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-[13px] text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <FileText className="h-[15px] w-[15px]" />
              <span className="hidden sm:inline">Report</span>
              <span aria-hidden>↗</span>
            </a>
          </div>
        }
      />

      <SessionMetaStrip cells={metaCells} />

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      <KpiStrip cols={6} className="mb-3.5">
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Net sales"
          value={fmt(net)}
          unit={currency}
          delta={`${fmt(gross)} gross`}
        />
        <KpiCard
          icon={<ListChecks className="h-3 w-3" />}
          label="Orders"
          value={fmt(report?.orderCount)}
          delta={
            report?.sales.itemCount != null
              ? `${fmt(report.sales.itemCount)} items`
              : report?.openOrdersAtClose
                ? `${report.openOrdersAtClose} open at close`
                : undefined
          }
        />
        <KpiCard
          icon={<Wallet className="h-3 w-3" />}
          label="Cash net"
          value={fmt(report?.cashNet)}
          unit={currency}
          delta="Receipts − refunds − exp."
        />
        <KpiCard
          icon={<Undo2 className="h-3 w-3" />}
          label="Refunds"
          value={fmt(refundAmt)}
          unit={currency}
          delta={
            <span className={refundCount > 0 ? "text-neg" : undefined}>
              {refundCount > 0
                ? `${refundCount} refund${refundCount === 1 ? "" : "s"}`
                : "None"}
            </span>
          }
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Gross profit"
          value={fmt(grossProfit)}
          unit={currency}
          delta={
            margin != null ? (
              <span className="text-pos">{margin}% margin</span>
            ) : undefined
          }
        />
        <KpiCard
          icon={<Scale className="h-3 w-3" />}
          label="Net variance"
          value={
            <span
              className={
                netVariance > 0
                  ? "text-warn"
                  : netVariance < 0
                    ? "text-neg"
                    : undefined
              }
            >
              {fmtVariance(netVariance)}
            </span>
          }
          delta={
            <span
              className={
                netVariance > 0
                  ? "text-warn"
                  : netVariance < 0
                    ? "text-neg"
                    : undefined
              }
            >
              {netVariance === 0
                ? "balanced"
                : netVariance > 0
                  ? "over"
                  : "short"}
            </span>
          }
        />
      </KpiStrip>

      {/* ── Main bento ─────────────────────────────────────────────── */}
      {/* 2:1 split via the app-standard grid-cols-3 + col-span-2 (an
          arbitrary `grid-cols-[1.5fr_1fr]` loses the cascade to the base
          `grid-cols-1` and collapses to one column). min-w-0 keeps the
          wide cash-up table from blowing out the left track. */}
      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-3">
        {/* LEFT */}
        <div className="min-w-0 lg:col-span-2">
          <CashUpReconciliationCard
            reconciliations={reconciliations}
            sessionId={id}
            currency={currency}
            txnsByMethodId={txnsByMethodId}
            staffInitialsById={staffInitialsById}
          />

          {report && report.paymentsByMethod.length > 0 ? (
            <PaymentMix report={report} />
          ) : null}

          <CancellationsVoids
            voids={extras.voids}
            report={report}
            roster={staffById}
            currency={currency}
          />
        </div>

        {/* RIGHT */}
        <div className="min-w-0">
          {report ? (
            <SalesBreakdown report={report} currency={currency} />
          ) : (
            <Card className="mb-3.5">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {session.status === "OPEN"
                  ? "No financial activity yet — the report populates as orders post."
                  : "Reports Service is temporarily unavailable. Refresh in a moment."}
              </CardContent>
            </Card>
          )}

          <Prepayments
            prepayments={extras.prepayments}
            methodNameById={methodNameById}
            currency={currency}
          />

          <RefundsList
            refunds={extras.refunds}
            roster={staffById}
            currency={currency}
          />

          <ExpensesList expenses={extras.expenses} currency={currency} />

          {report?.physicalTill ? (
            <CashDrawer
              till={report.physicalTill}
              payments={report.paymentsByMethod}
              refunds={extras.refunds?.refunds ?? []}
              prepayments={extras.prepayments?.items ?? []}
              cashExpenses={extras.expenses?.totals.paidByCash ?? 0}
              methodNameById={methodNameById}
              currency={currency}
            />
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
