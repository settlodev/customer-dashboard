"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { RecomputeButton } from "@/components/admin/analytics/recompute-button";
import { recomputeChurn } from "@/lib/actions/admin/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ChurnPrediction, ChurnSummary, ChurnTier } from "@/types/admin/analytics";

interface ChurnSectionProps {
  summary: ChurnSummary | null;
  predictions: ChurnPrediction[];
  canRecompute: boolean;
  error: string | null;
}

const TIER_FILTERS = ["ALL", "HIGH", "MEDIUM", "LOW"] as const;
type TierFilter = (typeof TIER_FILTERS)[number];

const TIER_BADGE: Record<
  ChurnTier,
  { label: string; className: string }
> = {
  HIGH: {
    label: "High",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
  MEDIUM: {
    label: "Medium",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  },
  LOW: {
    label: "Low",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
};

function formatPercent(probability: number | null | undefined): string {
  if (probability === null || probability === undefined) return "—";
  return `${(probability * 100).toFixed(0)}%`;
}

export function ChurnSection({
  summary,
  predictions,
  canRecompute,
  error,
}: ChurnSectionProps) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return predictions.filter((p) => {
      if (tierFilter !== "ALL" && p.risk_tier !== tierFilter) return false;
      if (
        needle &&
        !(p.business_name ?? "").toLowerCase().includes(needle) &&
        !p.business_id.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [predictions, search, tierFilter]);

  if (error && predictions.length === 0 && !summary) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {canRecompute && (
        <div className="flex justify-end">
          <RecomputeButton
            label="Churn predictions"
            description="Re-runs the ML churn model and refreshes risk tiers. The job runs asynchronously; data refreshes once it finishes."
            action={recomputeChurn}
          />
        </div>
      )}
      {summary && (
        <KpiStrip cols={4}>
          <KpiCard
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Total scored"
            value={summary.total_scored.toLocaleString()}
          />
          <KpiCard
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            label="High risk"
            value={summary.high_risk.toLocaleString()}
            deltaTone="neg"
            delta={`${summary.total_scored ? ((summary.high_risk / summary.total_scored) * 100).toFixed(1) : 0}% of base`}
          />
          <KpiCard
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Medium risk"
            value={summary.medium_risk.toLocaleString()}
          />
          <KpiCard
            label="Avg 30d churn prob."
            value={`${(summary.avg_churn_prob_30d * 100).toFixed(1)}%`}
          />
        </KpiStrip>
      )}

      <div className="space-y-3 rounded-lg border border-line bg-card p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-sm font-semibold text-ink">
            Top churn-risk businesses
          </h3>
          <p className="font-mono text-[11px] text-muted-foreground">
            {filtered.length} of {predictions.length} shown
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by business name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={tierFilter}
            onValueChange={(v) => setTierFilter(v as TierFilter)}
          >
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="All tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All risk tiers</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="text-right">7d</TableHead>
                <TableHead className="text-right">30d</TableHead>
                <TableHead className="text-right">90d</TableHead>
                <TableHead className="text-right">Idle</TableHead>
                <TableHead>Recommended action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No businesses match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.business_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/accounts/${p.account_id}`}
                          className="font-medium text-ink hover:text-primary"
                        >
                          {p.business_name || p.business_id}
                        </Link>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {p.subscription_status ?? "—"}
                          {p.is_in_trial ? ` · trial ${p.trial_days_remaining ?? "?"}d left` : ""}
                          {p.is_past_due ? " · PAST DUE" : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={TIER_BADGE[p.risk_tier].className}
                      >
                        {TIER_BADGE[p.risk_tier].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] tabular-nums">
                      {formatPercent(p.churn_probability_7d)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] tabular-nums">
                      {formatPercent(p.churn_probability_30d)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] tabular-nums">
                      {formatPercent(p.churn_probability_90d)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] tabular-nums">
                      {p.days_since_last_order !== null
                        ? `${p.days_since_last_order}d`
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-[12px] text-muted-foreground">
                      {p.recommended_action ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
