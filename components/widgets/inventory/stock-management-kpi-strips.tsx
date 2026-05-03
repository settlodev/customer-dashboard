import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coins,
  DollarSign,
  FileCheck,
  FileText,
  Inbox,
  Layers,
  Mailbox,
  PackageCheck,
  PercentSquare,
  RefreshCw,
  Send,
  ShoppingCart,
  TrendingUp,
  Truck,
  Undo2,
  XCircle,
} from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import type {
  RsBomRulesKpi,
  RsGrnKpi,
  RsPurchaseOrderKpi,
  RsPurchaseRequisitionKpi,
  RsRfqKpi,
  RsStockModificationKpi,
  RsStockTakeKpi,
  RsStockTransferKpi,
  RsSupplierReturnKpi,
} from "@/types/reports-analytics/type";

type Tone = "pos" | "neg" | "neutral";

// ── shared formatters ───────────────────────────────────────────

const fmtCount = (n: number | null | undefined) =>
  n != null ? Math.round(n).toLocaleString() : "—";

const fmt1dp = (n: number | null | undefined) =>
  n != null
    ? n.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : "—";

const fmtSignedCount = (
  n: number | null | undefined,
  suffix: string,
): { text: string; tone: Tone } | undefined => {
  if (n == null) return undefined;
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const tone: Tone = n > 0 ? "pos" : n < 0 ? "neg" : "neutral";
  return { text: `${sign}${Math.abs(n).toLocaleString()} ${suffix}`, tone };
};

const fmtSignedPct = (
  pct: number | null | undefined,
  suffix: string,
  posIsGood = true,
): { text: string; tone: Tone } | undefined => {
  if (pct == null) return undefined;
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  const isPos = rounded > 0;
  const tone: Tone =
    rounded === 0 ? "neutral" : isPos === posIsGood ? "pos" : "neg";
  return { text: `${sign}${Math.abs(rounded).toFixed(1)}${suffix}`, tone };
};

const fmtSignedDays = (
  days: number | null | undefined,
  posIsGood = false,
): { text: string; tone: Tone } | undefined => {
  if (days == null) return undefined;
  const rounded = Math.round(days * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  const isPos = rounded > 0;
  const tone: Tone =
    rounded === 0 ? "neutral" : isPos === posIsGood ? "pos" : "neg";
  return { text: `${sign}${Math.abs(rounded).toFixed(1)} d`, tone };
};

const fmtSignedHours = (
  hours: number | null | undefined,
  posIsGood = false,
): { text: string; tone: Tone } | undefined => {
  if (hours == null) return undefined;
  const rounded = Math.round(hours * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  const isPos = rounded > 0;
  const tone: Tone =
    rounded === 0 ? "neutral" : isPos === posIsGood ? "pos" : "neg";
  return { text: `${sign}${Math.abs(rounded).toFixed(1)} hr`, tone };
};

// ── /stock-modifications ────────────────────────────────────────

export function StockModificationKpiStrip({
  summary,
}: {
  summary: RsStockModificationKpi | null;
}) {
  const weekDelta = fmtSignedCount(summary?.modificationsWeekDelta ?? null, "wk");
  const writeOffsDelta =
    summary && summary.highCostWriteOffs > 0
      ? { text: "approval pending", tone: "neg" as Tone }
      : undefined;

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<Activity className="h-3 w-3" />}
        label="Modifications (30d)"
        value={fmtCount(summary?.modificationsCount)}
        delta={weekDelta?.text}
        deltaTone={weekDelta?.tone ?? "neutral"}
        spark={summary?.modificationsSparkline}
      />
      <KpiCard
        icon={<ArrowUp className="h-3 w-3" />}
        label="Net adjustment up"
        value={summary ? `+${fmtCount(summary.netAdjustmentUp)}` : "—"}
        unit="units"
        deltaTone="pos"
      />
      <KpiCard
        icon={<ArrowDown className="h-3 w-3" />}
        label="Net adjustment down"
        value={summary ? `−${fmtCount(summary.netAdjustmentDown)}` : "—"}
        unit="units"
        deltaTone="neg"
      />
      <KpiCard
        icon={<AlertTriangle className="h-3 w-3" />}
        label="High-cost write-offs"
        value={fmtCount(summary?.highCostWriteOffs)}
        delta={writeOffsDelta?.text}
        deltaTone={writeOffsDelta?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}

// ── /stock-takes ────────────────────────────────────────────────

export function StockTakeKpiStrip({
  summary,
}: {
  summary: RsStockTakeKpi | null;
}) {
  const accuracyDelta = fmtSignedPct(summary?.accuracyDelta ?? null, " pts");
  const weekDelta = fmtSignedCount(summary?.countsWeekDelta ?? null, "wk");
  const inProgressLabel =
    summary && summary.takesInProgress > 0
      ? {
          text: `${summary.takesInProgress} in progress`,
          tone: "neutral" as Tone,
        }
      : undefined;
  const varianceLabel =
    summary && summary.varianceFlags > 0
      ? { text: "needs review", tone: "neg" as Tone }
      : undefined;

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<ClipboardList className="h-3 w-3" />}
        label="Open takes"
        value={fmtCount(summary?.openTakes)}
        unit="active"
        delta={inProgressLabel?.text}
        deltaTone={inProgressLabel?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<ClipboardCheck className="h-3 w-3" />}
        label="Counts (30d)"
        value={fmtCount(summary?.countsCount)}
        delta={weekDelta?.text}
        deltaTone={weekDelta?.tone ?? "neutral"}
        spark={summary?.takesSparkline}
      />
      <KpiCard
        icon={<PercentSquare className="h-3 w-3" />}
        label="Avg accuracy"
        value={fmt1dp(summary?.avgAccuracyPct)}
        unit={summary?.avgAccuracyPct != null ? "%" : undefined}
        delta={accuracyDelta?.text}
        deltaTone={accuracyDelta?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<AlertTriangle className="h-3 w-3" />}
        label="Variances flagged"
        value={fmtCount(summary?.varianceFlags)}
        delta={varianceLabel?.text}
        deltaTone={varianceLabel?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}

// ── /stock-transfers ────────────────────────────────────────────

export function StockTransferKpiStrip({
  summary,
}: {
  summary: RsStockTransferKpi | null;
}) {
  const weekDelta = fmtSignedCount(summary?.transfersWeekDelta ?? null, "wk");
  const dueLabel =
    summary && summary.dueToday > 0
      ? { text: `${summary.dueToday} due today`, tone: "neutral" as Tone }
      : undefined;
  const leadDelta = fmtSignedDays(summary?.leadTimeDelta ?? null);
  const onTimeDelta = fmtSignedPct(summary?.onTimeDelta ?? null, " pts");

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<Truck className="h-3 w-3" />}
        label="Transfers (30d)"
        value={fmtCount(summary?.transfersCount)}
        delta={weekDelta?.text}
        deltaTone={weekDelta?.tone ?? "neutral"}
        spark={summary?.transfersSparkline}
      />
      <KpiCard
        icon={<Send className="h-3 w-3" />}
        label="In transit"
        value={fmtCount(summary?.inTransit)}
        unit="active"
        delta={dueLabel?.text}
        deltaTone={dueLabel?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<Clock className="h-3 w-3" />}
        label="Avg lead time"
        value={fmt1dp(summary?.avgLeadTimeDays)}
        unit={summary?.avgLeadTimeDays != null ? "days" : undefined}
        delta={leadDelta?.text}
        deltaTone={leadDelta?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<CheckCircle2 className="h-3 w-3" />}
        label="On-time arrivals"
        value={fmt1dp(summary?.onTimeArrivalsPct)}
        unit={summary?.onTimeArrivalsPct != null ? "%" : undefined}
        delta={onTimeDelta?.text}
        deltaTone={onTimeDelta?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}

// ── /bom-rules ──────────────────────────────────────────────────

export function BomRulesKpiStrip({
  summary,
}: {
  summary: RsBomRulesKpi | null;
}) {
  const hitsDelta = fmtSignedPct(summary?.consumptionHitsWowPct ?? null, "% wk");
  const reviewLabel =
    summary && summary.rulesNeedingReview > 0
      ? { text: "missing components", tone: "neg" as Tone }
      : undefined;

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<RefreshCw className="h-3 w-3" />}
        label="Active rules"
        value={fmtCount(summary?.activeRules)}
        delta={summary && summary.activeRules > 0 ? "in use" : "none yet"}
        deltaTone="neutral"
      />
      <KpiCard
        icon={<Boxes className="h-3 w-3" />}
        label="Linked variants"
        value={fmtCount(summary?.linkedVariants)}
      />
      <KpiCard
        icon={<TrendingUp className="h-3 w-3" />}
        label="Consumption hits (7d)"
        value={fmtCount(summary?.consumptionHits7d)}
        delta={hitsDelta?.text}
        deltaTone={hitsDelta?.tone ?? "neutral"}
        spark={summary?.hitsSparkline}
      />
      <KpiCard
        icon={<AlertTriangle className="h-3 w-3" />}
        label="Rules needing review"
        value={fmtCount(summary?.rulesNeedingReview)}
        delta={reviewLabel?.text}
        deltaTone={reviewLabel?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}

// ── /purchase-requisitions ──────────────────────────────────────

export function PurchaseRequisitionKpiStrip({
  summary,
}: {
  summary: RsPurchaseRequisitionKpi | null;
}) {
  const awaitingLabel =
    summary && summary.awaitingApproval > 0
      ? {
          text: `${summary.awaitingApproval} awaiting approval`,
          tone: "neutral" as Tone,
        }
      : undefined;
  const weekDelta = fmtSignedCount(summary?.approvedWeekDelta ?? null, "wk");
  const hoursDelta = fmtSignedHours(summary?.avgApprovalDelta ?? null);
  const rejectedLabel =
    summary && summary.rejectedCount > 0
      ? { text: "needs review", tone: "neg" as Tone }
      : undefined;

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<FileText className="h-3 w-3" />}
        label="Open requisitions"
        value={fmtCount(summary?.openRequisitions)}
        unit="active"
        delta={awaitingLabel?.text}
        deltaTone={awaitingLabel?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<FileCheck className="h-3 w-3" />}
        label="Approved (30d)"
        value={fmtCount(summary?.approvedCount)}
        delta={weekDelta?.text}
        deltaTone={weekDelta?.tone ?? "neutral"}
        spark={summary?.approvedSparkline}
      />
      <KpiCard
        icon={<Clock className="h-3 w-3" />}
        label="Avg approval time"
        value={fmt1dp(summary?.avgApprovalHours)}
        unit={summary?.avgApprovalHours != null ? "hrs" : undefined}
        delta={hoursDelta?.text}
        deltaTone={hoursDelta?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<XCircle className="h-3 w-3" />}
        label="Rejected (30d)"
        value={fmtCount(summary?.rejectedCount)}
        delta={rejectedLabel?.text}
        deltaTone={rejectedLabel?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}

// ── /rfqs ───────────────────────────────────────────────────────

export function RfqKpiStrip({ summary }: { summary: RsRfqKpi | null }) {
  const awaitingLabel =
    summary && summary.awaitingQuotes > 0
      ? {
          text: `${summary.awaitingQuotes} awaiting quotes`,
          tone: "neutral" as Tone,
        }
      : undefined;
  const weekDelta = fmtSignedCount(summary?.quotesWeekDelta ?? null, "wk");
  const turnDelta = fmtSignedDays(summary?.turnaroundDelta ?? null);
  const onTimeLabel =
    summary?.awardedOnTimePct != null
      ? {
          text: `${summary.awardedOnTimePct.toFixed(0)}% on time`,
          tone: "pos" as Tone,
        }
      : undefined;

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<Mailbox className="h-3 w-3" />}
        label="Open RFQs"
        value={fmtCount(summary?.openRfqs)}
        unit="active"
        delta={awaitingLabel?.text}
        deltaTone={awaitingLabel?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<Inbox className="h-3 w-3" />}
        label="Quotes received (30d)"
        value={fmtCount(summary?.quotesReceived)}
        delta={weekDelta?.text}
        deltaTone={weekDelta?.tone ?? "neutral"}
        spark={summary?.quotesSparkline}
      />
      <KpiCard
        icon={<Clock className="h-3 w-3" />}
        label="Avg quote turnaround"
        value={fmt1dp(summary?.avgQuoteTurnaroundDays)}
        unit={summary?.avgQuoteTurnaroundDays != null ? "days" : undefined}
        delta={turnDelta?.text}
        deltaTone={turnDelta?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<CheckCircle2 className="h-3 w-3" />}
        label="Awarded (30d)"
        value={fmtCount(summary?.awardedCount)}
        delta={onTimeLabel?.text}
        deltaTone={onTimeLabel?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}

// ── /purchase-orders ────────────────────────────────────────────

export function PurchaseOrderKpiStrip({
  summary,
}: {
  summary: RsPurchaseOrderKpi | null;
}) {
  const awaitingLabel =
    summary && summary.awaitingReceipt > 0
      ? {
          text: `${summary.awaitingReceipt} awaiting receipt`,
          tone: "neutral" as Tone,
        }
      : undefined;
  const committedDelta = fmtSignedPct(summary?.committedWowPct ?? null, "% wk");
  const onTimeDelta = fmtSignedPct(summary?.onTimeDelta ?? null, " pts");
  const overdueLabel =
    summary && summary.overdueCount > 0
      ? { text: "follow up", tone: "neg" as Tone }
      : undefined;

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<ShoppingCart className="h-3 w-3" />}
        label="Open POs"
        value={fmtCount(summary?.openPos)}
        unit="active"
        delta={awaitingLabel?.text}
        deltaTone={awaitingLabel?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<DollarSign className="h-3 w-3" />}
        label="Committed (30d)"
        value={fmtCount(summary?.committedAmount)}
        unit={summary?.committedCurrency ?? "TZS"}
        delta={committedDelta?.text}
        deltaTone={committedDelta?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<CheckCircle2 className="h-3 w-3" />}
        label="On-time receipt rate"
        value={fmt1dp(summary?.onTimeReceiptPct)}
        unit={summary?.onTimeReceiptPct != null ? "%" : undefined}
        delta={onTimeDelta?.text}
        deltaTone={onTimeDelta?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<AlertTriangle className="h-3 w-3" />}
        label="Overdue"
        value={fmtCount(summary?.overdueCount)}
        delta={overdueLabel?.text}
        deltaTone={overdueLabel?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}

// ── /goods-received ─────────────────────────────────────────────

export function GrnKpiStrip({ summary }: { summary: RsGrnKpi | null }) {
  const weekDelta = fmtSignedCount(summary?.grnsWeekDelta ?? null, "wk");
  const unitsDelta = fmtSignedPct(summary?.unitsWowPct ?? null, "% wk");
  const pendingLabel =
    summary && summary.pendingOver24h > 0
      ? {
          text: `${summary.pendingOver24h} over 24h`,
          tone: "neutral" as Tone,
        }
      : undefined;
  const varianceLabel =
    summary && summary.varianceFlags > 0
      ? { text: "needs review", tone: "neg" as Tone }
      : undefined;

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<PackageCheck className="h-3 w-3" />}
        label="GRNs (30d)"
        value={fmtCount(summary?.grnsCount)}
        delta={weekDelta?.text}
        deltaTone={weekDelta?.tone ?? "neutral"}
        spark={summary?.grnsSparkline}
      />
      <KpiCard
        icon={<Layers className="h-3 w-3" />}
        label="Units received"
        value={fmtCount(summary?.unitsReceived)}
        delta={unitsDelta?.text}
        deltaTone={unitsDelta?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<Clock className="h-3 w-3" />}
        label="Pending posting"
        value={fmtCount(summary?.pendingPosting)}
        unit="GRNs"
        delta={pendingLabel?.text}
        deltaTone={pendingLabel?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<AlertTriangle className="h-3 w-3" />}
        label="Variance flags"
        value={fmtCount(summary?.varianceFlags)}
        delta={varianceLabel?.text}
        deltaTone={varianceLabel?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}

// ── /supplier-returns ───────────────────────────────────────────

export function SupplierReturnKpiStrip({
  summary,
}: {
  summary: RsSupplierReturnKpi | null;
}) {
  const weekDelta = fmtSignedCount(summary?.returnsWeekDelta ?? null, "wk");
  const dueLabel =
    summary && summary.dueToday > 0
      ? { text: `${summary.dueToday} due today`, tone: "neutral" as Tone }
      : undefined;
  const creditLabel =
    summary && summary.creditDueAmount > 0
      ? { text: "awaiting credit notes", tone: "neutral" as Tone }
      : undefined;
  const disputesLabel =
    summary && summary.disputes > 0
      ? { text: "needs review", tone: "neg" as Tone }
      : undefined;

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<Undo2 className="h-3 w-3" />}
        label="Returns (30d)"
        value={fmtCount(summary?.returnsCount)}
        delta={weekDelta?.text}
        deltaTone={weekDelta?.tone ?? "neutral"}
        spark={summary?.returnsSparkline}
      />
      <KpiCard
        icon={<Send className="h-3 w-3" />}
        label="In transit"
        value={fmtCount(summary?.inTransit)}
        unit="active"
        delta={dueLabel?.text}
        deltaTone={dueLabel?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<Coins className="h-3 w-3" />}
        label="Credit due"
        value={fmtCount(summary?.creditDueAmount)}
        unit={summary?.creditDueCurrency ?? "TZS"}
        delta={creditLabel?.text}
        deltaTone={creditLabel?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<AlertTriangle className="h-3 w-3" />}
        label="Disputes"
        value={fmtCount(summary?.disputes)}
        delta={disputesLabel?.text}
        deltaTone={disputesLabel?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}
