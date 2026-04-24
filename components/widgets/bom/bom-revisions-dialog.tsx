"use client";

import React, { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import {
  diffRules,
  getBomRuleRevisions,
} from "@/lib/actions/bom-rule-actions";
import {
  BOM_LIFECYCLE_LABELS,
  BomRule,
  BomRuleDiff,
} from "@/types/bom/type";

interface Props {
  rule: BomRule;
  trigger: React.ReactNode;
}

export default function BomRevisionsDialog({ rule, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [revisions, setRevisions] = useState<BomRule[] | null>(null);
  const [diff, setDiff] = useState<BomRuleDiff | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || revisions !== null) return;
    startTransition(async () => {
      const list = await getBomRuleRevisions(rule.productVariantId);
      setRevisions(list);
    });
  }, [open, revisions, rule.productVariantId]);

  const handleCompare = (otherId: string) => {
    setCompareId(otherId);
    setDiff(null);
    startTransition(async () => {
      const d = await diffRules(rule.id, otherId);
      setDiff(d);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Revision history — {rule.name}</DialogTitle>
          <DialogDescription>
            Every edit to a consumption rule creates a new revision. Compare any prior
            revision to this one to see exactly what changed.
          </DialogDescription>
        </DialogHeader>

        {isPending && revisions === null ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading revisions…
          </div>
        ) : revisions && revisions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Revision</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Effective to</TableHead>
                <TableHead className="text-right">Compare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisions.map((r) => (
                <TableRow key={r.id} className={r.id === rule.id ? "bg-emerald-50/50" : ""}>
                  <TableCell className="font-medium">{r.revisionNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {BOM_LIFECYCLE_LABELS[r.lifecycleStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(r.effectiveFrom), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.effectiveTo
                      ? format(new Date(r.effectiveTo), "yyyy-MM-dd HH:mm")
                      : "Open"}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.id === rule.id ? (
                      <span className="text-xs text-muted-foreground">current</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCompare(r.id)}
                        disabled={isPending && compareId === r.id}
                      >
                        {isPending && compareId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        Diff
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No revision history available.
          </p>
        )}

        {diff && <DiffViewer diff={diff} />}
      </DialogContent>
    </Dialog>
  );
}

function DiffViewer({ diff }: { diff: BomRuleDiff }) {
  const totalChanges =
    diff.headerChanges.length +
    diff.itemsAdded.length +
    diff.itemsRemoved.length +
    diff.itemsChanged.length +
    diff.outputsAdded.length +
    diff.outputsRemoved.length +
    diff.outputsChanged.length;

  if (totalChanges === 0) {
    return (
      <div className="border-t pt-4 mt-4">
        <p className="text-sm text-muted-foreground italic">
          Selected revisions are identical — no differences.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t pt-4 mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {diff.ruleARevision} → {diff.ruleBRevision}
        </p>
        <span className="text-xs text-muted-foreground">
          {totalChanges} change{totalChanges === 1 ? "" : "s"}
        </span>
      </div>

      {diff.headerChanges.length > 0 && (
        <DiffSection title="Header">
          {diff.headerChanges.map((c) => (
            <DiffRow key={c.field} field={c.field} before={c.before} after={c.after} />
          ))}
        </DiffSection>
      )}

      {diff.itemsAdded.length > 0 && (
        <DiffSection title={`Items added (${diff.itemsAdded.length})`}>
          {diff.itemsAdded.map((i) => (
            <p key={i.itemNumber} className="text-xs text-emerald-700">
              + {i.itemNumber} · {i.category}
              {i.stockVariantId ? ` · ${i.stockVariantId.slice(0, 8)}` : ""}
              {i.quantity ? ` · qty ${i.quantity}` : ""}
            </p>
          ))}
        </DiffSection>
      )}

      {diff.itemsRemoved.length > 0 && (
        <DiffSection title={`Items removed (${diff.itemsRemoved.length})`}>
          {diff.itemsRemoved.map((i) => (
            <p key={i.itemNumber} className="text-xs text-red-700">
              − {i.itemNumber} · {i.category}
            </p>
          ))}
        </DiffSection>
      )}

      {diff.itemsChanged.length > 0 && (
        <DiffSection title={`Items changed (${diff.itemsChanged.length})`}>
          {diff.itemsChanged.map((i) => (
            <div key={i.itemNumber} className="mb-2">
              <p className="text-xs font-medium">Item {i.itemNumber}</p>
              {i.changes.map((c, ix) => (
                <DiffRow key={ix} field={c.field} before={c.before} after={c.after} />
              ))}
            </div>
          ))}
        </DiffSection>
      )}

      {(diff.outputsAdded.length > 0 ||
        diff.outputsRemoved.length > 0 ||
        diff.outputsChanged.length > 0) && (
        <DiffSection title="Outputs">
          {diff.outputsAdded.map((o) => (
            <p key={`a-${o.stockVariantId}`} className="text-xs text-emerald-700">
              + {o.outputType} · {o.stockVariantId.slice(0, 8)} · {o.yieldQuantity}
            </p>
          ))}
          {diff.outputsRemoved.map((o) => (
            <p key={`r-${o.stockVariantId}`} className="text-xs text-red-700">
              − {o.outputType} · {o.stockVariantId.slice(0, 8)}
            </p>
          ))}
          {diff.outputsChanged.map((o) => (
            <div key={`c-${o.stockVariantId}`} className="mb-2">
              <p className="text-xs font-medium">Output {o.stockVariantId.slice(0, 8)}</p>
              {o.changes.map((c, ix) => (
                <DiffRow key={ix} field={c.field} before={c.before} after={c.after} />
              ))}
            </div>
          ))}
        </DiffSection>
      )}
    </div>
  );
}

function DiffSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-1">
        {title}
      </p>
      <div className="space-y-0.5 pl-2">{children}</div>
    </div>
  );
}

function DiffRow({
  field,
  before,
  after,
}: {
  field: string;
  before?: string | null;
  after?: string | null;
}) {
  return (
    <p className="text-xs font-mono">
      <span className="text-muted-foreground">{field}:</span>{" "}
      <span className="text-red-600 line-through">{before ?? "—"}</span>{" "}
      <span className="text-muted-foreground">→</span>{" "}
      <span className="text-emerald-700">{after ?? "—"}</span>
    </p>
  );
}
