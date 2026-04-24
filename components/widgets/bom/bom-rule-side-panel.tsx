"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  ChevronRight,
  Copy,
  GitBranch,
  History,
  Loader2,
} from "lucide-react";
import BomRevisionsDialog from "./bom-revisions-dialog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

import {
  BOM_COST_METHOD_LABELS,
  BomCostMethod,
  BomCostSnapshot,
  BomRule,
  WhereUsedNode,
} from "@/types/bom/type";
import {
  calculateBomCost,
  getWhereUsedForRule,
} from "@/lib/actions/bom-rule-actions";

interface Props {
  rule: BomRule;
}

/**
 * Right-rail of the rule detail page. Three cards:
 *  • On-demand cost calculation (backend /calculate-cost)
 *  • Where-used (multi-level upward walk)
 *  • Metadata (status, dates, counts)
 *
 * Revisions tab lives on the detail URL via ?tab=history; we just surface
 * the current revision number here.
 */
export default function BomRuleSidePanel({ rule }: Props) {
  return (
    <div className="space-y-4">
      <QuickActionsCard rule={rule} />
      <CostCalculatorCard rule={rule} />
      <WhereUsedCard rule={rule} />
      <MetadataCard rule={rule} />
    </div>
  );
}

function QuickActionsCard({ rule }: { rule: BomRule }) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-4 pb-4 flex flex-col gap-2">
        <BomRevisionsDialog
          rule={rule}
          trigger={
            <Button variant="outline" size="sm" className="w-full justify-start">
              <History className="h-4 w-4 mr-2" /> View revisions & diff
            </Button>
          }
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          asChild
        >
          <a href={`/bom-rules/new?cloneFrom=${rule.id}`}>
            <Copy className="h-4 w-4 mr-2" /> Clone as new rule
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function CostCalculatorCard({ rule }: { rule: BomRule }) {
  const [method, setMethod] = useState<BomCostMethod>(
    rule.baseCostMethod ?? "MOVING_AVG",
  );
  const [snapshot, setSnapshot] = useState<BomCostSnapshot | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      const result = await calculateBomCost(rule.id, method);
      if (!result) {
        toast({
          variant: "destructive",
          title: "Calculation failed",
          description: "Could not calculate cost. Check logs for details.",
        });
        return;
      }
      setSnapshot(result);
      toast({
        variant: "success",
        title: "Cost calculated",
        description: `Total: ${result.totalCost.toLocaleString()}`,
      });
    });
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-gray-400" />
          Cost calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Select value={method} onValueChange={(v) => setMethod(v as BomCostMethod)}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BOM_COST_METHOD_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={run} disabled={isPending} size="sm">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calculate"}
          </Button>
        </div>

        {snapshot && (
          <div className="space-y-1.5 text-sm">
            <CostLine label="Material" value={snapshot.materialCost} />
            <CostLine label="Scrap" value={snapshot.scrapCost} muted />
            <CostLine label="Operation" value={snapshot.operationCost} muted />
            <CostLine label="By-product credit" value={-snapshot.byProductCredit} muted />
            <Separator className="my-1" />
            <CostLine label="Total" value={snapshot.totalCost} bold />
            <p className="text-xs text-muted-foreground pt-1">
              Calculated {new Date(snapshot.calculatedAt).toLocaleString()} ·{" "}
              {BOM_COST_METHOD_LABELS[snapshot.costMethod]}
            </p>
          </div>
        )}

        {!snapshot && rule.baseCostCached !== null && rule.baseCostCached !== undefined && (
          <div className="text-sm">
            <CostLine label="Cached" value={rule.baseCostCached} bold />
            <p className="text-xs text-muted-foreground">
              From {rule.baseCostCalculatedAt
                ? new Date(rule.baseCostCalculatedAt).toLocaleString()
                : "—"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CostLine({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: number;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${muted ? "text-muted-foreground" : ""} ${bold ? "font-semibold" : ""}`}>
        {label}
      </span>
      <span className={`tabular-nums ${bold ? "font-semibold" : ""}`}>
        {value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })}
      </span>
    </div>
  );
}

function WhereUsedCard({ rule }: { rule: BomRule }) {
  const router = useRouter();
  const [nodes, setNodes] = useState<WhereUsedNode[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const result = await getWhereUsedForRule(rule.id);
      setNodes(result);
    });
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-gray-400" />
          Where-used
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {nodes === null ? (
          <Button variant="outline" size="sm" onClick={load} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Walk ancestor rules
          </Button>
        ) : nodes.length <= 1 ? (
          <p className="text-xs text-muted-foreground">
            Not referenced by any sub-rule. Safe to revise without cascading impact.
          </p>
        ) : (
          <ul className="space-y-1">
            {nodes
              .filter((n) => n.depth > 0)
              .map((n) => (
                <li
                  key={n.ruleId}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-xs text-muted-foreground tabular-nums"
                      aria-label={`depth ${n.depth}`}
                    >
                      L{n.depth}
                    </span>
                    <span className="truncate">{n.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {n.revisionNumber}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => router.push(`/bom-rules/${n.ruleId}`)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function MetadataCard({ rule }: { rule: BomRule }) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-gray-400" />
          Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <MetaRow label="Revision" value={rule.revisionNumber} />
        <MetaRow label="Status" value={rule.lifecycleStatus} />
        <MetaRow label="Items" value={rule.items?.length ?? 0} />
        <MetaRow label="Outputs" value={rule.outputs?.length ?? 0} />
        <MetaRow label="Operations" value={rule.operations?.length ?? 0} />
        <MetaRow
          label="Effective from"
          value={
            rule.effectiveFrom ? new Date(rule.effectiveFrom).toLocaleString() : "—"
          }
        />
        <MetaRow
          label="Effective to"
          value={
            rule.effectiveTo ? new Date(rule.effectiveTo).toLocaleString() : "Open"
          }
        />
      </CardContent>
    </Card>
  );
}

function MetaRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
