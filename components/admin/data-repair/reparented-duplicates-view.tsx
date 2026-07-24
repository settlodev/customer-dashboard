"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, DatabaseZap, Loader2, ShieldCheck } from "lucide-react";

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
  purgeReparentedDuplicates,
  scanReparentedDuplicates,
  type DedupReport,
  type DedupScope,
} from "@/lib/actions/admin/reparented-duplicates";
import type { PlatformLocationRow } from "@/types/admin/platform-metrics";

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

interface Props {
  locations: PlatformLocationRow[];
  /** Whether the signed-in staff hold internal:repair:execute — gates the purge. */
  canExecute: boolean;
}

export function ReparentedDuplicatesView({ locations, canExecute }: Props) {
  const { toast } = useToast();

  const [locationId, setLocationId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // The dry-run result. Drives the purge button's enabled state and the token
  // the confirm modal requires. Reset to null whenever the scope changes, so a
  // purge can never fire against a count from a stale scope.
  const [scan, setScan] = useState<DedupReport | null>(null);
  const [purged, setPurged] = useState<DedupReport | null>(null);

  const [scanning, startScan] = useTransition();
  const [purging, startPurge] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const scope = (): DedupScope => ({
    locationId,
    from: from || null,
    to: to || null,
  });

  const onScopeChange = () => {
    setScan(null);
    setPurged(null);
  };

  const runScan = () =>
    startScan(async () => {
      try {
        setPurged(null);
        const report = await scanReparentedDuplicates(scope());
        setScan(report);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Scan failed",
          description: e instanceof Error ? e.message : "Please try again.",
        });
      }
    });

  const runPurge = () =>
    startPurge(async () => {
      try {
        const report = await purgeReparentedDuplicates(scope());
        setPurged(report);
        setScan(null); // force a re-scan before any further purge
        setConfirmOpen(false);
        toast({
          title: "Purge complete",
          description: `Removed ${fmt(report.staleRows)} stale row${
            report.staleRows === 1 ? "" : "s"
          }.`,
        });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Purge failed",
          description: e instanceof Error ? e.message : "Please try again.",
        });
      }
    });

  const purgeReady = !!scan && scan.staleRows > 0 && canExecute;
  const scopeLabel = locationId
    ? locations.find((l) => l.locationId === locationId)?.locationName ??
      "selected location"
    : "all locations";

  return (
    <div className="space-y-6">
      {/* Scope + scan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseZap className="h-4 w-4 text-muted-foreground" />
            Re-parented order-item duplicates
          </CardTitle>
          <CardDescription>
            A merge, or a full-quantity split or transfer, moved an order line
            onto another order and left a stale copy behind in{" "}
            <code>fact_order_items</code> — so the sales report counts it twice.
            Scan to see how many stale rows exist, then purge to remove them
            (the current-owner row is always kept). Start with a scan; it changes
            nothing.
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
              <Label htmlFor="from">From (optional)</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  onScopeChange();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To (optional)</Label>
              <Input
                id="to"
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
              {scanning ? "Scanning…" : "Scan"}
            </Button>
            <span className="text-sm text-muted-foreground">
              Scope: {scopeLabel}
              {from || to ? ` · ${from || "…"} → ${to || "…"}` : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Scan result */}
      {scan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {scan.staleRows > 0 ? (
                <AlertTriangle className="h-4 w-4 text-warn" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-pos" />
              )}
              {scan.staleRows > 0
                ? "Stale duplicate rows found"
                : "No duplicates — nothing to purge"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Stale rows" value={fmt(scan.staleRows)} />
              <Stat label="Lines affected" value={fmt(scan.itemsAffected)} />
              <Stat label="Value over-counted" value={`${fmt(scan.valueReclaimed)} TZS`} />
              <Stat label="Locations scanned" value={fmt(scan.locationsScanned)} />
            </div>

            {scan.staleRows > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="destructive"
                  disabled={!purgeReady || purging}
                  onClick={() => setConfirmOpen(true)}
                >
                  {purging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Purge {fmt(scan.staleRows)} row{scan.staleRows === 1 ? "" : "s"}
                </Button>
                {!canExecute && (
                  <span className="text-sm text-muted-foreground">
                    You need the repair-execute permission to purge.
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purge result */}
      {purged && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-pos" />
              Purged {fmt(purged.staleRows)} stale row
              {purged.staleRows === 1 ? "" : "s"}
            </CardTitle>
            <CardDescription>
              Removed {fmt(purged.valueReclaimed)} TZS of double-counted line
              value across {fmt(purged.locationsScanned)} location
              {purged.locationsScanned === 1 ? "" : "s"}. Scan again to confirm
              the count is now zero.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Type-to-confirm modal */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          tone="danger"
          requireText={scan ? String(scan.staleRows) : undefined}
        >
          <AlertDialogIcon>
            <AlertTriangle className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {scan ? fmt(scan.staleRows) : ""} stale rows?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the duplicate copies from{" "}
              <code>fact_order_items</code> for {scopeLabel}. The current-owner
              row for each line is kept. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogRequireText />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purging}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // keep the dialog open until the action resolves
                runPurge();
              }}
              disabled={purging}
            >
              {purging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Purge
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
