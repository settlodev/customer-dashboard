"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, ReceiptText, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { reconcileMigratedPayments } from "@/lib/actions/admin/billing";
import type {
  ReconcileMigratedPaymentsResult,
  ReconcileMigratedPaymentsRow,
} from "@/types/admin/billing";

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

/** Dates come back as LocalDateTime strings; show the day, drop the clock. */
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");

interface Props {
  /** Whether the signed-in staff hold internal:repair:execute — gates the apply. */
  canExecute: boolean;
}

export function MigratedPaymentsView({ canExecute }: Props) {
  const { toast } = useToast();

  // The dry-run projection. Drives the apply button and the token the confirm
  // modal requires; cleared after an apply so a second apply always re-previews.
  const [preview, setPreview] = useState<ReconcileMigratedPaymentsResult | null>(
    null,
  );
  const [applied, setApplied] = useState<ReconcileMigratedPaymentsResult | null>(
    null,
  );
  const [includeCancelled, setIncludeCancelled] = useState(false);

  const [previewing, startPreview] = useTransition();
  const [applying, startApply] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const run = (dryRun: boolean) => async () => {
    const result = await reconcileMigratedPayments({ dryRun, includeCancelled });
    if (result.responseType === "error") {
      toast({
        variant: "destructive",
        title: dryRun ? "Preview failed" : "Reconcile failed",
        description: result.message,
      });
      return null;
    }
    return result.data ?? null;
  };

  const runPreview = () =>
    startPreview(async () => {
      const data = await run(true)();
      if (!data) return;
      setApplied(null);
      setPreview(data);
    });

  const runApply = () =>
    startApply(async () => {
      const data = await run(false)();
      if (!data) return;
      setApplied(data);
      setPreview(null); // force a re-preview before any further apply
      setConfirmOpen(false);
      toast({
        title: "Reconcile complete",
        description: `Advanced ${fmt(data.subscriptionsReconciled)} subscription${
          data.subscriptionsReconciled === 1 ? "" : "s"
        } and stamped ${fmt(data.itemsStamped)} entit${
          data.itemsStamped === 1 ? "y" : "ies"
        }.`,
      });
    });

  const applyReady =
    !!preview && preview.subscriptionsReconciled > 0 && canExecute;

  return (
    <div className="space-y-6">
      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
            Migrated payments not reflected in subscriptions
          </CardTitle>
          <CardDescription>
            Invoices imported at the monolith cutover were written straight into
            the database as PAID, so they never passed through the payment
            handler — the only code that advances <code>paid_through</code> and
            revives a lapsed entity. Merchants who paid a year in the old system
            therefore read Expired here, and the daily scheduler walks them on to
            Suspended. This re-derives each subscription&apos;s coverage from its
            own paid invoices. Start with a preview; it changes nothing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="include-cancelled"
              checked={includeCancelled}
              onCheckedChange={(v) => {
                setIncludeCancelled(v === true);
                setPreview(null); // the flag changes the projection — re-preview
              }}
            />
            <div className="grid gap-1">
              <Label htmlFor="include-cancelled" className="font-normal">
                Also revive cancelled subscriptions
              </Label>
              <p className="text-xs text-muted-foreground">
                Cancelling is only reachable from the API, so a CANCELLED
                subscription may be a deliberate churn rather than repair damage.
                Left off, they are listed but not touched.
              </p>
            </div>
          </div>
          <Button onClick={runPreview} disabled={previewing}>
            {previewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {previewing ? "Previewing…" : "Preview"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview result */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {preview.subscriptions.length > 0 ? (
                <AlertTriangle className="h-4 w-4 text-warn" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-pos" />
              )}
              {preview.subscriptions.length > 0
                ? `${fmt(preview.subscriptionsReconciled)} of ${fmt(
                    preview.subscriptionsScanned,
                  )} subscriptions would be reconciled`
                : "Nothing to reconcile — every paid invoice is already reflected"}
            </CardTitle>
            {preview.itemsUnmatched > 0 && (
              <CardDescription>
                {fmt(preview.itemsUnmatched)} lapsed entit
                {preview.itemsUnmatched === 1 ? "y" : "ies"} could not be matched
                to any paid invoice — by line link, by the invoice&apos;s
                location, or as the business&apos;s only entity. Those are
                reported rather than guessed at, and need a look by hand.
              </CardDescription>
            )}
          </CardHeader>
          {preview.subscriptions.length > 0 && (
            <CardContent className="space-y-4">
              <RowTable rows={preview.subscriptions} />
              <div className="flex flex-wrap items-center gap-3">
                {preview.subscriptionsReconciled > 0 ? (
                  <Button
                    variant="destructive"
                    disabled={!applyReady || applying}
                    onClick={() => setConfirmOpen(true)}
                  >
                    {applying && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Reconcile {fmt(preview.subscriptionsReconciled)} subscription
                    {preview.subscriptionsReconciled === 1 ? "" : "s"}
                  </Button>
                ) : (
                  // Every row is a held-back cancellation: an apply would be a
                  // no-op, so point at the checkbox instead of offering one.
                  <span className="text-sm text-muted-foreground">
                    Every subscription above is cancelled and held back. Tick
                    &ldquo;Also revive cancelled subscriptions&rdquo; and preview
                    again to include them.
                  </span>
                )}
                {preview.subscriptionsReconciled > 0 && !canExecute && (
                  <span className="text-sm text-muted-foreground">
                    You need the repair-execute permission to apply.
                  </span>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Apply result */}
      {applied && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-pos" />
              Reconcile applied
            </CardTitle>
            <CardDescription>
              Advanced {fmt(applied.subscriptionsReconciled)} subscription
              {applied.subscriptionsReconciled === 1 ? "" : "s"} and stamped{" "}
              {fmt(applied.itemsStamped)} entit
              {applied.itemsStamped === 1 ? "y" : "ies"}
              {applied.subscriptionsSkipped > 0
                ? `; ${fmt(applied.subscriptionsSkipped)} cancelled subscription${
                    applied.subscriptionsSkipped === 1 ? " was" : "s were"
                  } left untouched`
                : ""}
              . Preview again to confirm nothing is left.
            </CardDescription>
          </CardHeader>
          {applied.subscriptions.length > 0 && (
            <CardContent>
              <RowTable rows={applied.subscriptions} />
            </CardContent>
          )}
        </Card>
      )}

      {/* Type-to-confirm modal */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          tone="danger"
          requireText={
            preview ? String(preview.subscriptionsReconciled) : undefined
          }
        >
          <AlertDialogIcon>
            <AlertTriangle className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reconcile {preview ? fmt(preview.subscriptionsReconciled) : ""}{" "}
              subscriptions?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This grants access the merchants have already paid for: each
              subscription&apos;s <code>paid_through</code> and billing cycle
              advance to its latest running paid invoice, and every entity that
              invoice covers is reactivated.
              {includeCancelled
                ? " Cancelled subscriptions are included — they will be set ACTIVE and auto-renew turned back on."
                : " Cancelled subscriptions are left untouched."}
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
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RowTable({ rows }: { rows: ReconcileMigratedPaymentsRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paid through</TableHead>
            <TableHead>Anchor invoice</TableHead>
            <TableHead className="text-right">Entities</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.subscriptionId}>
              <TableCell className="font-mono text-xs">
                <a
                  className="hover:underline"
                  href={`/admin/businesses/${row.businessId}/billing`}
                >
                  {row.businessId.slice(0, 8)}…
                </a>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.action === "SKIPPED_CANCELLED" ? (
                  <Badge variant="outline">{row.oldStatus} · held back</Badge>
                ) : (
                  <span className="text-sm">
                    {row.oldStatus} → {row.newStatus}
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm tabular-nums">
                {day(row.oldPaidThrough)} → {day(row.newPaidThrough)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {row.anchorInvoiceNumber ?? "—"}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {row.itemsStamped}
                {row.itemsUnmatched > 0 && (
                  <span className="ml-2 text-warn">
                    {row.itemsUnmatched} unmatched
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
