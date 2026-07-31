"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, PackageX, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogRequireText,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  applyArchivedStockBackfill,
  scanArchivedStockBackfill,
  type ArchivedStockBackfillReport,
} from "@/lib/actions/admin/archived-stock-backfill";

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

interface Props {
  /** Whether the signed-in staff hold internal:repair:execute — gates the apply. */
  canExecute: boolean;
}

export function ArchivedStockBackfillView({ canExecute }: Props) {
  const { toast } = useToast();

  // The dry-run result. Drives the apply button's enabled state and the token
  // the confirm modal requires; cleared after an apply so a second apply always
  // re-scans first.
  const [scan, setScan] = useState<ArchivedStockBackfillReport | null>(null);
  const [applied, setApplied] = useState<ArchivedStockBackfillReport | null>(null);

  const [scanning, startScan] = useTransition();
  const [applying, startApply] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const total = (r: ArchivedStockBackfillReport) =>
    r.variantDimsArchived + r.factRowsFlagged;

  const runScan = () =>
    startScan(async () => {
      try {
        setApplied(null);
        setScan(await scanArchivedStockBackfill());
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Scan failed",
          description: e instanceof Error ? e.message : "Please try again.",
        });
      }
    });

  const runApply = () =>
    startApply(async () => {
      try {
        const report = await applyArchivedStockBackfill();
        setApplied(report);
        setScan(null); // force a re-scan before any further apply
        setConfirmOpen(false);
        toast({
          title: "Backfill complete",
          description: `Archived ${fmt(report.variantDimsArchived)} SKU${
            report.variantDimsArchived === 1 ? "" : "s"
          } and flagged ${fmt(report.factRowsFlagged)} live-value row${
            report.factRowsFlagged === 1 ? "" : "s"
          }.`,
        });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Backfill failed",
          description: e instanceof Error ? e.message : "Please try again.",
        });
      }
    });

  const applyReady = !!scan && total(scan) > 0 && canExecute;

  return (
    <div className="space-y-6">
      {/* Scan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageX className="h-4 w-4 text-muted-foreground" />
            Deleted stock still counted in inventory reports
          </CardTitle>
          <CardDescription>
            Stock deleted or archived before the July 2026 propagation fix left
            its variant SKUs and <code>fact_inventory_current</code> rows
            active, so inventory dashboards keep counting the retired stock&apos;s
            value and units. Scan to see the size of the gap, then apply to
            archive the orphaned SKUs and flag their live-value rows. The
            backfill is platform-wide and idempotent; a genuine new balance
            event for a variant automatically un-archives its row. Start with a
            scan; it changes nothing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runScan} disabled={scanning}>
            {scanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {scanning ? "Scanning…" : "Scan"}
          </Button>
        </CardContent>
      </Card>

      {/* Scan result */}
      {scan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {total(scan) > 0 ? (
                <AlertTriangle className="h-4 w-4 text-warn" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-pos" />
              )}
              {total(scan) > 0
                ? "Historical gap found"
                : "No gap — nothing to backfill"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:max-w-md">
              <Stat
                label="Orphaned SKUs to archive"
                value={fmt(scan.variantDimsArchived)}
              />
              <Stat
                label="Live-value rows to flag"
                value={fmt(scan.factRowsFlagged)}
              />
            </div>

            {total(scan) > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="destructive"
                  disabled={!applyReady || applying}
                  onClick={() => setConfirmOpen(true)}
                >
                  {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Backfill {fmt(total(scan))} row{total(scan) === 1 ? "" : "s"}
                </Button>
                {!canExecute && (
                  <span className="text-sm text-muted-foreground">
                    You need the repair-execute permission to apply.
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Apply result */}
      {applied && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-pos" />
              Backfill applied
            </CardTitle>
            <CardDescription>
              Archived {fmt(applied.variantDimsArchived)} orphaned SKU
              {applied.variantDimsArchived === 1 ? "" : "s"} and flagged{" "}
              {fmt(applied.factRowsFlagged)} live-value row
              {applied.factRowsFlagged === 1 ? "" : "s"}. Retired stock no
              longer counts toward inventory totals. Scan again to confirm the
              counts are now zero.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Type-to-confirm modal */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          tone="danger"
          requireText={scan ? String(total(scan)) : undefined}
        >
          <AlertDialogIcon>
            <AlertTriangle className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Backfill {scan ? fmt(total(scan)) : ""} rows?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This archives the orphaned variant SKUs and flags their{" "}
              <code>fact_inventory_current</code> rows platform-wide, removing
              historically deleted stock from inventory totals. Rows only
              return if the stock sees genuine new balance activity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogRequireText />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // keep the dialog open until the action resolves
                runApply();
              }}
              disabled={applying}
            >
              {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply backfill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-muted/30 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
