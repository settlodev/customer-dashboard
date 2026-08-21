"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Loader2, RadioTower, RefreshCw, Timer } from "lucide-react";

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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  BACKFILLS,
  type Backfill,
} from "@/components/admin/bulk-republish-button";
import {
  recomputeSignupCohorts,
  resyncOrders,
  sweepStaleInventoryCurrent,
} from "@/lib/actions/admin/data-repair-backfill";
import type { FormResponse } from "@/types/types";

/**
 * The full analytics backfill from one screen — the eleven one-shot event
 * republishes plus the three parameterized legs that used to require curl:
 * the OMS order resync (date-ranged), the inventory stale-row sweep (waits on
 * the balance drain), and the signup-cohort recompute (date-ranged).
 *
 * Event-sourced analytics only ever learn about an entity from its Kafka
 * events; entities predating the consumers — or from the legacy-system
 * migration, which emitted none — are invisible until re-emitted. Everything
 * here is idempotent and safe to repeat, and none of it sends email.
 */

const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};
const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  /** Whether the signed-in staff hold internal:repair:execute. */
  canExecute: boolean;
}

export function EventBackfillView({ canExecute }: Props) {
  const { toast } = useToast();

  // one-shot republish dialog state
  const [selected, setSelected] = useState<Backfill | null>(null);
  const [error, setError] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // parameterized inputs
  const [resyncFrom, setResyncFrom] = useState(firstOfMonth());
  const [resyncTo, setResyncTo] = useState(today());
  const [sweepMinutes, setSweepMinutes] = useState("30");
  const [cohortFrom, setCohortFrom] = useState("");
  const [cohortTo, setCohortTo] = useState(today());

  // which parameterized op the confirm dialog is for (null = none)
  const [confirmOp, setConfirmOp] = useState<
    "resync" | "sweep" | "cohorts" | null
  >(null);

  const finish = (label: string, result: FormResponse<unknown>) => {
    if (result.responseType === "error") {
      setError(result.message);
      return;
    }
    toast({ title: label, description: result.message });
    setSelected(null);
    setConfirmOp(null);
    setError("");
  };

  const runBackfill = (backfill: Backfill) => {
    setError("");
    setPendingKey(backfill.key);
    startTransition(async () => {
      finish(`${backfill.label} backfilled`, await runSafely(backfill.action));
      setPendingKey(null);
    });
  };

  const runConfirmedOp = () => {
    if (!confirmOp) return;
    setError("");
    startTransition(async () => {
      if (confirmOp === "resync") {
        finish("Orders resynced", await runSafely(() => resyncOrders(resyncFrom, resyncTo)));
      } else if (confirmOp === "sweep") {
        finish(
          "Inventory swept",
          await runSafely(() => sweepStaleInventoryCurrent(Number(sweepMinutes) || 30)),
        );
      } else {
        finish(
          "Cohorts recomputed",
          await runSafely(() => recomputeSignupCohorts(cohortFrom, cohortTo)),
        );
      }
    });
  };

  const confirmCopy: Record<
    NonNullable<typeof confirmOp>,
    { title: string; body: React.ReactNode }
  > = {
    resync: {
      title: `Resync orders ${resyncFrom} – ${resyncTo}?`,
      body: (
        <>
          Re-broadcasts every non-deleted order in the range on{" "}
          <strong>ORDER_RESYNC</strong> — consumed by analytics alone, so no
          stock is re-deducted and no receipts are sent. Sales facts converge
          as the events drain. For a long history run month-sized slices,
          oldest first. Safe to repeat.
        </>
      ),
    },
    sweep: {
      title: `Sweep inventory rows older than ${sweepMinutes} minutes?`,
      body: (
        <>
          Run this only <strong>after</strong> the Inventory balances backfill
          has drained (~15 minutes). Rows the republish did not refresh are no
          longer live in the Inventory Service and get archived; a later
          balance event revives a row if it was swept by mistake.
        </>
      ),
    },
    cohorts: {
      title: `Recompute signup cohorts ${cohortFrom || "…"} – ${cohortTo}?`,
      body: (
        <>
          Rebuilds the daily signup-cohort rows from the healed account data.
          Run after the Accounts backfill has drained — the nightly job only
          computes yesterday, so historical rows need this once. Safe to
          repeat.
        </>
      ),
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RadioTower className="h-5 w-5" />
          Analytics event backfills
        </CardTitle>
        <CardDescription>
          Re-emits entities&apos; current state so event-sourced analytics
          pick up records that predate the consumers or arrived via the legacy
          migration. Run the entity backfills first (they let the sales resync
          enrich with correct names), then balances → sweep, then the order
          resync, then the cohort recompute.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── the eleven one-shot republishes ── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {BACKFILLS.map((backfill) => (
            <Button
              key={backfill.key}
              type="button"
              variant="outline"
              size="sm"
              disabled={!canExecute || isPending}
              onClick={() => setSelected(backfill)}
              className="justify-start"
            >
              {pendingKey === backfill.key && isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-4 w-4" />
              )}
              {backfill.label}
            </Button>
          ))}
        </div>

        {/* ── order resync ── */}
        <div className="rounded-lg border p-4">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <CalendarClock className="h-4 w-4" />
            Order resync (sales values)
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Re-broadcasts orders&apos; current state for a business-date range
            on the analytics-only channel. Month-sized slices, oldest first.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={resyncFrom}
              onChange={(e) => setResyncFrom(e.target.value)}
              className="w-40"
              aria-label="Resync from"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={resyncTo}
              onChange={(e) => setResyncTo(e.target.value)}
              className="w-40"
              aria-label="Resync to"
            />
            <Button
              type="button"
              size="sm"
              disabled={!canExecute || isPending || !resyncFrom || !resyncTo}
              onClick={() => setConfirmOp("resync")}
            >
              Resync orders
            </Button>
          </div>
        </div>

        {/* ── inventory sweep ── */}
        <div className="rounded-lg border p-4">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <Timer className="h-4 w-4" />
            Inventory stale-row sweep
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Step 2 of the balance reconciliation — run ~15 minutes after the
            Inventory balances backfill. Archives rows the republish did not
            refresh (no longer live in the Inventory Service).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={5}
              value={sweepMinutes}
              onChange={(e) => setSweepMinutes(e.target.value)}
              className="w-28"
              aria-label="Older than minutes"
            />
            <span className="text-sm text-muted-foreground">
              minutes since the balance backfill started
            </span>
            <Button
              type="button"
              size="sm"
              disabled={!canExecute || isPending}
              onClick={() => setConfirmOp("sweep")}
            >
              Sweep stale rows
            </Button>
          </div>
        </div>

        {/* ── cohort recompute ── */}
        <div className="rounded-lg border p-4">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <RefreshCw className="h-4 w-4" />
            Signup-cohort recompute
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Rebuilds the &quot;+30d&quot; signup figures from healed account
            data. Run after the Accounts backfill drains; pick a range that
            covers the oldest backfilled account.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={cohortFrom}
              onChange={(e) => setCohortFrom(e.target.value)}
              className="w-40"
              aria-label="Cohorts from"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={cohortTo}
              onChange={(e) => setCohortTo(e.target.value)}
              className="w-40"
              aria-label="Cohorts to"
            />
            <Button
              type="button"
              size="sm"
              disabled={!canExecute || isPending || !cohortFrom || !cohortTo}
              onClick={() => setConfirmOp("cohorts")}
            >
              Recompute cohorts
            </Button>
          </div>
        </div>

        {!canExecute && (
          <p className="text-sm text-muted-foreground">
            You need the repair-execute permission to run these.
          </p>
        )}
      </CardContent>

      {/* one-shot backfill confirm */}
      <AlertDialog
        open={selected !== null}
        onOpenChange={(next) => {
          if (isPending) return;
          if (!next) {
            setSelected(null);
            setError("");
          }
        }}
      >
        <AlertDialogContent tone="success">
          <AlertDialogIcon>
            <RefreshCw className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>{selected?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (selected) runBackfill(selected);
              }}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working…
                </span>
              ) : (
                `Backfill ${selected?.label.toLowerCase() ?? ""}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* parameterized op confirm */}
      <AlertDialog
        open={confirmOp !== null}
        onOpenChange={(next) => {
          if (isPending) return;
          if (!next) {
            setConfirmOp(null);
            setError("");
          }
        }}
      >
        <AlertDialogContent tone="success">
          <AlertDialogIcon>
            <RefreshCw className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmOp ? confirmCopy[confirmOp].title : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmOp ? confirmCopy[confirmOp].body : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                runConfirmedOp();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working…
                </span>
              ) : (
                "Run"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

async function runSafely(
  action: () => Promise<FormResponse<unknown>>,
): Promise<FormResponse<unknown>> {
  try {
    return await action();
  } catch (e: any) {
    return {
      responseType: "error",
      message: e?.message || "The operation failed",
    } as FormResponse<unknown>;
  }
}
