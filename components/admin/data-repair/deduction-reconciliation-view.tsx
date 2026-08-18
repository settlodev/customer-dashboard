"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, ScaleIcon, ShieldCheck } from "lucide-react";

import { LocationCombobox } from "@/components/admin/shared/location-combobox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  repairDeductionDiscrepancies,
  scanDeductionReconciliation,
  type DeductionDiscrepancy,
  type DeductionReconciliationReport,
  type RepairResult,
} from "@/lib/actions/admin/deduction-reconciliation";
import type { PlatformLocationRow } from "@/types/admin/platform-metrics";

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);

const keyOf = (d: DeductionDiscrepancy) => `${d.orderId}:${d.orderItemId}`;

interface Props {
  locations: PlatformLocationRow[];
  /** Whether the signed-in staff hold internal:repair:execute. */
  canExecute: boolean;
}

export function DeductionReconciliationView({ locations, canExecute }: Props) {
  const { toast } = useToast();

  const [locationId, setLocationId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [scan, setScan] = useState<DeductionReconciliationReport | null>(null);
  const [repaired, setRepaired] = useState<RepairResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [scanning, startScan] = useTransition();
  const [repairing, startRepair] = useTransition();

  const onScopeChange = () => {
    setScan(null);
    setRepaired(null);
    setSelected(new Set());
  };

  const runScan = () =>
    startScan(async () => {
      try {
        setRepaired(null);
        setSelected(new Set());
        setScan(
          await scanDeductionReconciliation(locationId, from || null, to || null),
        );
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Scan failed",
          description:
            e instanceof Error
              ? e.message
              : "Could not reach Order Management. Please try again.",
        });
      }
    });

  // Only under-deductions are correctable. An over-deduction means stock came
  // off twice; putting it back automatically is how a repair tool becomes the
  // next data bug, so those rows are shown but never selectable.
  const fixable = (scan?.discrepancies ?? []).filter((d) => d.shortfall > 0);
  const selectedRows = fixable.filter((d) => selected.has(keyOf(d)));
  const selectedUnits = selectedRows.reduce((s, d) => s + d.shortfall, 0);

  const toggle = (d: DeductionDiscrepancy) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyOf(d);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === fixable.length
        ? new Set()
        : new Set(fixable.map(keyOf)),
    );

  const runRepair = () =>
    startRepair(async () => {
      try {
        const result = await repairDeductionDiscrepancies(
          selectedRows.map((d) => ({
            orderId: d.orderId,
            orderItemId: d.orderItemId,
            soldQuantity: d.soldQuantity,
          })),
        );
        setRepaired(result);
        setScan(null); // force a fresh scan before any further repair
        setSelected(new Set());
        setConfirmOpen(false);
        toast({
          title: "Corrections posted",
          description: `${fmt(result.linesCorrected)} line${
            result.linesCorrected === 1 ? "" : "s"
          } corrected · ${fmt(result.correctedQuantity)} unit${
            result.correctedQuantity === 1 ? "" : "s"
          } taken off stock.`,
        });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Repair failed",
          description: e instanceof Error ? e.message : "Please try again.",
        });
      }
    });

  const scopeLabel = locationId
    ? locations.find((l) => l.locationId === locationId)?.locationName ??
      "selected location"
    : "all active locations";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScaleIcon className="h-4 w-4 text-muted-foreground" />
            Sale vs stock deduction
          </CardTitle>
          <CardDescription>
            Compares what each order line <strong>sold</strong> (Order
            Management) against what Inventory actually{" "}
            <strong>deducted</strong>. Neither service can see this alone —
            Inventory keeps no record of the quantity it was supposed to deduct,
            so a line that under-deducted is invisible from either side. A
            positive shortfall means stock left the building without coming off
            the books. Leave location and dates empty to sweep every active
            location over the default lookback; the sweep walks one
            location-month at a time, so a wide scan is slow but safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <LocationCombobox
                locations={locations}
                value={locationId}
                onChange={(v) => {
                  setLocationId(v);
                  onScopeChange();
                }}
                allLabel="All locations"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recon-from">From (optional)</Label>
              <Input
                id="recon-from"
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  onScopeChange();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recon-to">To (optional)</Label>
              <Input
                id="recon-to"
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  onScopeChange();
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={runScan} disabled={scanning}>
              {scanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {scanning ? "Comparing…" : "Compare"}
            </Button>
            <span className="text-sm text-muted-foreground">
              Scope: {scopeLabel}
              {from || to ? ` · ${from || "…"} → ${to || "…"}` : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {scan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scan.discrepancyCount === 0 ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              ) : (
                <ScaleIcon className="h-4 w-4 text-amber-600" />
              )}
              {scan.discrepancyCount === 0
                ? "Every line matches"
                : `${fmt(scan.discrepancyCount)} discrepant line${
                    scan.discrepancyCount === 1 ? "" : "s"
                  }`}
            </CardTitle>
            <CardDescription>
              {fmt(scan.locationsScanned)} location
              {scan.locationsScanned === 1 ? "" : "s"} · {scan.from} → {scan.to}{" "}
              · {fmt(scan.ordersChecked)} order
              {scan.ordersChecked === 1 ? "" : "s"} · {fmt(scan.linesChecked)}{" "}
              line{scan.linesChecked === 1 ? "" : "s"}
              {scan.discrepancyCount > 0 && (
                <>
                  {" · net shortfall "}
                  <strong>{fmt(scan.netShortfall)}</strong> unit
                  {scan.netShortfall === 1 ? "" : "s"}
                </>
              )}
            </CardDescription>
          </CardHeader>

          {scan.truncated && (
            <CardContent className="pt-0">
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This scan hit its result cap, so these findings are{" "}
                  <strong>partial</strong> — there may be more. Narrow the
                  location or date range to see the rest.
                </span>
              </div>
            </CardContent>
          )}

          {scan.discrepancyCount > 0 && (
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b">
                      <th className="w-8 py-2 pr-2">
                        {canExecute && fixable.length > 0 && (
                          <Checkbox
                            checked={
                              selected.size === fixable.length &&
                              fixable.length > 0
                            }
                            onCheckedChange={toggleAll}
                            aria-label="Select all correctable lines"
                          />
                        )}
                      </th>
                      <th className="py-2 pr-4 font-medium">Order</th>
                      <th className="py-2 pr-4 font-medium">Business day</th>
                      <th className="py-2 pr-4 font-medium">Item</th>
                      <th className="py-2 pr-4 text-right font-medium">Sold</th>
                      <th className="py-2 pr-4 text-right font-medium">
                        Deducted
                      </th>
                      <th className="py-2 pr-4 text-right font-medium">
                        Shortfall
                      </th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scan.discrepancies.map((d) => {
                      const correctable = d.shortfall > 0;
                      return (
                        <tr key={keyOf(d)} className="border-b last:border-0">
                          <td className="py-2 pr-2">
                            {canExecute && correctable && (
                              <Checkbox
                                checked={selected.has(keyOf(d))}
                                onCheckedChange={() => toggle(d)}
                                aria-label={`Select ${d.itemName}`}
                              />
                            )}
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs">
                            {d.orderNumber}
                          </td>
                          <td className="py-2 pr-4">{d.businessDate}</td>
                          <td className="py-2 pr-4">
                            {d.itemName}
                            {d.removedLine && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (voided)
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {fmt(d.soldQuantity)}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {fmt(d.deductedQuantity)}
                          </td>
                          <td
                            className={`py-2 pr-4 text-right font-medium tabular-nums ${
                              correctable ? "text-amber-600" : "text-sky-600"
                            }`}
                          >
                            {d.shortfall > 0 ? "+" : ""}
                            {fmt(d.shortfall)}
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">
                            {d.orderStatus}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {canExecute && (
                  <Button
                    variant="destructive"
                    disabled={selectedRows.length === 0 || repairing}
                    onClick={() => setConfirmOpen(true)}
                  >
                    {repairing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Correct {selectedRows.length || ""} selected
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  {selectedRows.length > 0
                    ? `${fmt(selectedUnits)} unit${
                        selectedUnits === 1 ? "" : "s"
                      } will come off stock`
                    : canExecute
                      ? "Select the lines you want corrected."
                      : "Correcting needs internal:repair:execute."}
                </span>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Correcting posts a CORRECTION stock modification dated today
                (not backdated into a closed business day), so each fix carries
                a MOD- reference. It corrects on-hand only — the original
                order&apos;s reported margin is unaffected. Over-deductions
                (negative) are shown but not correctable here: returning stock
                automatically is unsafe. Lines whose product is untracked or
                unlimited are not listed; they deduct nothing by design.
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {repaired && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Corrected {fmt(repaired.linesCorrected)} of{" "}
              {fmt(repaired.linesRequested)} line
              {repaired.linesRequested === 1 ? "" : "s"}
            </CardTitle>
            <CardDescription>
              {fmt(repaired.correctedQuantity)} unit
              {repaired.correctedQuantity === 1 ? "" : "s"} taken off stock.
              Re-run the comparison to confirm nothing remains.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {repaired.lines.map((l) => (
                <li key={`${l.orderId}:${l.orderItemId}`}>
                  <span
                    className={
                      l.outcome === "CORRECTED"
                        ? "text-emerald-600"
                        : l.outcome === "FAILED"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }
                  >
                    {l.outcome}
                  </span>{" "}
                  — {l.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          tone="danger"
          requireText={String(selectedRows.length)}
        >
          <AlertDialogIcon>
            <AlertTriangle className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Correct {selectedRows.length} line
              {selectedRows.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This posts stock modifications that remove{" "}
              <strong>{fmt(selectedUnits)}</strong> unit
              {selectedUnits === 1 ? "" : "s"} from on-hand across{" "}
              {selectedRows.length} line
              {selectedRows.length === 1 ? "" : "s"}. Each shortfall is
              re-checked against live data first, so anything already corrected
              is skipped. This cannot be undone automatically — reversing it
              means posting another modification by hand.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogRequireText />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runRepair} disabled={repairing}>
              {repairing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Correct stock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
