"use client";

import { useState, useTransition } from "react";
import { Loader2, ScaleIcon, ShieldCheck } from "lucide-react";

import { LocationCombobox } from "@/components/admin/shared/location-combobox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  scanDeductionReconciliation,
  type DeductionReconciliationReport,
} from "@/lib/actions/admin/deduction-reconciliation";
import type { PlatformLocationRow } from "@/types/admin/platform-metrics";

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);

interface Props {
  locations: PlatformLocationRow[];
}

export function DeductionReconciliationView({ locations }: Props) {
  const { toast } = useToast();

  const [locationId, setLocationId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [scan, setScan] = useState<DeductionReconciliationReport | null>(null);
  const [scanning, startScan] = useTransition();

  const onScopeChange = () => setScan(null);

  // Unlike the other tools on this page, location and dates are REQUIRED: the
  // comparison reaches into Order Management per location, so there is no
  // meaningful "all locations, all time" scan to offer.
  const canScan = !!locationId && !!from && !!to;

  const runScan = () =>
    startScan(async () => {
      try {
        setScan(await scanDeductionReconciliation(locationId!, from, to));
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

  const locationLabel = locationId
    ? locations.find((l) => l.locationId === locationId)?.locationName ??
      "selected location"
    : "no location selected";

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
            the books. Read-only: this reports, it never corrects.
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
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recon-from">From (business day)</Label>
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
              <Label htmlFor="recon-to">To (business day)</Label>
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
            <Button onClick={runScan} disabled={scanning || !canScan}>
              {scanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {scanning ? "Comparing…" : "Compare"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {canScan
                ? `Scope: ${locationLabel} · ${from} → ${to}`
                : "Pick a location and both dates."}
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
              Checked {fmt(scan.ordersChecked)} order
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

          {scan.discrepancyCount > 0 && (
            <CardContent>
              {/* Wide table scrolls inside its own container rather than the page. */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b">
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
                    {scan.discrepancies.map((d) => (
                      <tr
                        key={`${d.orderId}-${d.orderItemId}`}
                        className="border-b last:border-0"
                      >
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
                            d.shortfall > 0
                              ? "text-amber-600"
                              : "text-sky-600"
                          }`}
                        >
                          {d.shortfall > 0 ? "+" : ""}
                          {fmt(d.shortfall)}
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {d.orderStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                A positive shortfall means on-hand reads high by that many units
                — correct it with a stock modification at that location. A
                negative shortfall means the line was deducted more than once.
                Lines whose product is untracked or unlimited are not listed:
                they deduct nothing by design.
              </p>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
