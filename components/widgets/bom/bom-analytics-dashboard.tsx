"use client";

import React, { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  AlertOctagon,
  AlertTriangle,
  Factory,
  Loader2,
  PackageX,
  TrendingUp,
  Waves,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getCostCascades,
  getDeductionFailures,
  getMissingRules,
  getProductionYield,
  getRecipeCostTrend,
  getSubstituteUsage,
} from "@/lib/actions/bom-analytics-actions";
import type { RsPageResponse } from "@/lib/actions/bom-analytics-actions";
import {
  BomCostCascadeRow,
  BomDeductionFailureRow,
  BomMissingRuleSummary,
  BomProductionYieldRow,
  BomRecipeCostTrend,
  BomSubstituteUsageSummary,
  BOM_SUBSTITUTION_STRATEGY_LABELS,
  DEDUCTION_FAILURE_LABELS,
} from "@/types/bom/type";

interface Props {
  businessId: string;
  initialStartDate: string;
  initialEndDate: string;
  costTrend: BomRecipeCostTrend[];
  substituteUsage: BomSubstituteUsageSummary[];
  missingRules: BomMissingRuleSummary[];
  deductionFailures: RsPageResponse<BomDeductionFailureRow>;
  productionYield: BomProductionYieldRow[];
  costCascades: BomCostCascadeRow[];
}

export default function BomAnalyticsDashboard({
  businessId,
  initialStartDate,
  initialEndDate,
  costTrend: costTrendProp,
  substituteUsage: substituteUsageProp,
  missingRules: missingRulesProp,
  deductionFailures: deductionFailuresProp,
  productionYield: productionYieldProp,
  costCascades: costCascadesProp,
}: Props) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [costTrend, setCostTrend] = useState(costTrendProp);
  const [substituteUsage, setSubstituteUsage] = useState(substituteUsageProp);
  const [missingRules, setMissingRules] = useState(missingRulesProp);
  const [deductionFailures, setDeductionFailures] = useState(deductionFailuresProp);
  const [productionYield, setProductionYield] = useState(productionYieldProp);
  const [costCascades, setCostCascades] = useState(costCascadesProp);
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      const params = { businessId, startDate, endDate };
      const [ct, su, mr, df, py, cc] = await Promise.all([
        getRecipeCostTrend(params),
        getSubstituteUsage(params),
        getMissingRules(params),
        getDeductionFailures({ ...params, page: 0, size: 25 }),
        getProductionYield(params),
        getCostCascades({ ...params, minRules: 1 }),
      ]);
      setCostTrend(ct);
      setSubstituteUsage(su);
      setMissingRules(mr);
      setDeductionFailures(df);
      setProductionYield(py);
      setCostCascades(cc);
    });
  };

  const dailyCost = useMemo(() => aggregateCostByDay(costTrend), [costTrend]);
  const substituteByStrategy = useMemo(
    () => aggregateSubstitutesByStrategy(substituteUsage),
    [substituteUsage],
  );
  const yieldRows = useMemo(
    () => productionYield.slice().sort((a, b) => b.completedRuns - a.completedRuns),
    [productionYield],
  );
  const missCount = missingRules.reduce((s, r) => s + r.missCount, 0);
  const substituteFires = substituteUsage.reduce((s, r) => s + r.fireCount, 0);
  const cascadeRules = costCascades.reduce((s, r) => s + r.rulesInvalidated, 0);
  const failureCount = deductionFailures.totalElements;

  return (
    <div className="space-y-6">
      {/* Date range ── */}
      <Card>
        <CardContent className="pt-4 pb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Start date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-[170px]"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">End date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-[170px]"
            />
          </div>
          <Button onClick={refresh} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Refresh
          </Button>
          <span className="text-xs text-muted-foreground">
            Data from the Reports Service (ClickHouse).
          </span>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          label="Cost snapshots"
          value={costTrend.length}
        />
        <KpiCard
          icon={<Waves className="h-4 w-4 text-sky-500" />}
          label="Substitute fires"
          value={substituteFires}
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Missing-rule hits"
          value={missCount}
        />
        <KpiCard
          icon={<AlertOctagon className="h-4 w-4 text-red-500" />}
          label="Deduction failures"
          value={failureCount}
        />
      </div>

      {/* Cost trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" /> Daily total cost (all rules)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyCost.length === 0 ? (
            <EmptyRow message="No cost snapshots in range." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyCost}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="material" stroke="#0ea5e9" dot={false} name="Material" />
                <Line type="monotone" dataKey="scrap" stroke="#f59e0b" dot={false} name="Scrap" />
                <Line type="monotone" dataKey="operation" stroke="#8b5cf6" dot={false} name="Operation" />
                <Line type="monotone" dataKey="total" stroke="#10b981" dot={false} name="Total" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Substitute usage by strategy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Waves className="h-4 w-4 text-gray-400" /> Substitute fires by strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {substituteByStrategy.length === 0 ? (
              <EmptyRow message="No substitutes fired in range." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={substituteByStrategy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="strategy" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="fires" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Missing rules */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PackageX className="h-4 w-4 text-gray-400" /> Products sold without a rule
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[260px] overflow-auto">
            {missingRules.length === 0 ? (
              <EmptyRow message="No missing-rule alerts in range." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead className="text-right">Hits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingRules.slice(0, 50).map((r, i) => (
                    <TableRow key={`${r.businessDate}-${r.productVariantId}-${i}`}>
                      <TableCell className="text-xs">{r.businessDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {r.kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.missCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Production yield */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Factory className="h-4 w-4 text-gray-400" /> Production yield variance
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[320px] overflow-auto">
          {yieldRows.length === 0 ? (
            <EmptyRow message="No completed production runs in range." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Recipe</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Planned</TableHead>
                  <TableHead className="text-right">Produced</TableHead>
                  <TableHead className="text-right">Var %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yieldRows.map((r) => (
                  <TableRow key={`${r.bomRuleId}-${r.businessDate}`}>
                    <TableCell className="text-xs">{r.businessDate}</TableCell>
                    <TableCell className="font-medium">{r.bomRuleName}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.completedRuns}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.totalPlanned.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.totalProduced.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${variancePctColor(r.avgVariancePct)}`}
                    >
                      {r.avgVariancePct.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deduction failures */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-gray-400" /> Deduction failures
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[260px] overflow-auto">
            {deductionFailures.content.length === 0 ? (
              <EmptyRow message="No deduction failures — good sign." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductionFailures.content.map((r) => (
                    <TableRow key={r.eventId}>
                      <TableCell className="text-xs">
                        {format(new Date(r.occurredAt), "yyyy-MM-dd HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-xs">
                          {DEDUCTION_FAILURE_LABELS[r.reason] ?? r.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.attemptedQuantity.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Cost cascades */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Waves className="h-4 w-4 text-gray-400" /> Cost cascade ({cascadeRules} rule-invalidations)
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[260px] overflow-auto">
            {costCascades.length === 0 ? (
              <EmptyRow message="No cascading cost changes in range." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Prev</TableHead>
                    <TableHead className="text-right">New</TableHead>
                    <TableHead className="text-right">Rules</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costCascades.map((r) => (
                    <TableRow key={r.eventId}>
                      <TableCell className="text-xs">
                        {format(new Date(r.occurredAt), "yyyy-MM-dd HH:mm")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.previousAvgCost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.newAvgCost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {r.rulesInvalidated}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        Reports are backed by ClickHouse. Numbers may lag live transactions by seconds.
      </p>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon} {label}
        </div>
        <div className="text-2xl font-semibold tabular-nums mt-1">
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="text-sm text-muted-foreground italic py-6 text-center">{message}</div>
  );
}

function variancePctColor(v: number): string {
  if (Math.abs(v) < 2) return "";
  return v < 0 ? "text-red-600" : "text-emerald-600";
}

// Fold all rules/cost-methods into a single daily series.
function aggregateCostByDay(rows: BomRecipeCostTrend[]) {
  const by: Record<
    string,
    { date: string; material: number; scrap: number; operation: number; total: number }
  > = {};
  for (const r of rows) {
    const entry = (by[r.businessDate] ??= {
      date: r.businessDate,
      material: 0,
      scrap: 0,
      operation: 0,
      total: 0,
    });
    entry.material += r.materialCost ?? 0;
    entry.scrap += r.scrapCost ?? 0;
    entry.operation += r.operationCost ?? 0;
    entry.total += r.totalCost ?? 0;
  }
  return Object.values(by).sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateSubstitutesByStrategy(rows: BomSubstituteUsageSummary[]) {
  const by: Record<string, { strategy: string; fires: number }> = {};
  for (const r of rows) {
    const s = BOM_SUBSTITUTION_STRATEGY_LABELS[r.strategy] ?? r.strategy;
    (by[s] ??= { strategy: s, fires: 0 }).fires += r.fireCount;
  }
  return Object.values(by).sort((a, b) => b.fires - a.fires);
}
