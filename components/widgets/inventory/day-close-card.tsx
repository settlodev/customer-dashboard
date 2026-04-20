"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Money } from "@/components/widgets/money";
import {
  closeBusinessDay,
  generateSnapshotForDate,
} from "@/lib/actions/inventory-snapshot-actions";
import type { DailySnapshotSummary } from "@/types/inventory-snapshot/type";

interface Props {
  /** Today's snapshot if already closed, otherwise null. */
  todaySnapshot: DailySnapshotSummary | null;
  /** Location's base currency for formatting the summary numbers. */
  currency: string;
}

/**
 * Close / regenerate end-of-day snapshot. Sitting on the stock report so
 * operators have a single place to see whether today's data is captured and
 * act if it isn't.
 */
export function DayCloseCard({ todaySnapshot, currency }: Props) {
  const [isPending, startTransition] = useTransition();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateDate, setGenerateDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });
  const { toast } = useToast();
  const router = useRouter();

  const isClosed = !!todaySnapshot;

  const onClose = () => {
    startTransition(async () => {
      const res = await closeBusinessDay();
      if (res.responseType === "success") {
        toast({
          variant: "success",
          title: "Day closed",
          description: "Today's snapshot has been captured.",
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Failed",
          description: res.message,
        });
      }
    });
  };

  const onGenerate = () => {
    if (!generateDate) return;
    startTransition(async () => {
      const res = await generateSnapshotForDate(generateDate);
      if (res.responseType === "success") {
        toast({
          variant: "success",
          title: "Snapshot generated",
          description: res.message,
        });
        setGenerateOpen(false);
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Failed",
          description: res.message,
        });
      }
    });
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 flex flex-wrap items-start gap-4 justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                isClosed
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
              }`}
            >
              {isClosed ? (
                <CalendarCheck className="h-5 w-5" />
              ) : (
                <CalendarClock className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {isClosed ? "Today's day is closed" : "Today's day is still open"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isClosed ? (
                  <>
                    {todaySnapshot!.totalVariants} variants captured ·{" "}
                    <Money
                      amount={todaySnapshot!.totalClosingValue}
                      currency={todaySnapshot?.currency || currency}
                    />{" "}
                    closing value
                  </>
                ) : (
                  "Close the day to refresh snapshots and keep the charts above up to date."
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGenerateOpen(true)}
              disabled={isPending}
            >
              <CalendarPlus className="h-4 w-4 mr-1.5" />
              Backfill a date
            </Button>
            {!isClosed && (
              <Button size="sm" onClick={onClose} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1.5" />
                )}
                Close today
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate snapshot</DialogTitle>
            <DialogDescription>
              Runs the end-of-day calculation for a past date. Existing
              snapshot rows for that date are overwritten — useful after data
              corrections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium">Date</label>
            <Input
              type="date"
              value={generateDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setGenerateDate(e.target.value)}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setGenerateOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={onGenerate} disabled={isPending || !generateDate}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
