"use client";

import { useEffect, useState, useTransition } from "react";
import { CalendarRange, Loader2, Lock, RefreshCw, Unlock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { SettingsSection } from "../shared/settings-section";
import {
  SettingsTableCard,
  tableHeadRowClass,
  tdActionsClass,
  tdClass,
  thClass,
  trClass,
} from "../shared/settings-table";
import {
  closeAccountingPeriod,
  listAccountingPeriods,
  reopenAccountingPeriod,
} from "@/lib/actions/accounting-period-actions";
import type { AccountingPeriod } from "@/types/accounting-period/type";

interface Props {
  businessId: string;
  locationId: string;
  userId: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function AccountingPeriodsPanel({
  businessId,
  locationId,
  userId,
}: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reload = async () => {
    setLoading(true);
    const result = await listAccountingPeriods(locationId);
    if (result.responseType === "success") {
      setItems(result.data ?? []);
      setLoadError(null);
    } else {
      setItems([]);
      setLoadError(result.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [locationId]);

  const closeMonth = (year: number, month: number) =>
    startTransition(async () => {
      const result = await closeAccountingPeriod({
        businessId,
        locationId,
        year,
        month,
        closedBy: userId,
      });
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Closed" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") await reload();
    });

  const reopenMonth = (year: number, month: number) =>
    startTransition(async () => {
      const result = await reopenAccountingPeriod({
        locationId,
        year,
        month,
        reopenedBy: userId,
        reason: "Reopened from settings",
      });
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Reopened" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") await reload();
    });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const isClosed = (year: number, month: number) =>
    items.some(
      (p) =>
        p.year === year &&
        p.month === month &&
        p.status === "CLOSED",
    );

  const previousClosed = isClosed(previousYear, previousMonth);

  return (
    <SettingsSection
      title="Accounting periods"
      description="Close month-end to lock journal posting for that period. Reopen requires a reason."
      icon={<CalendarRange className="h-4 w-4" />}
      footer={
        <Button
          size="sm"
          variant="ghost"
          onClick={() => reload()}
          disabled={loading || isPending}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
    >
      {/* Month-end shortcut: the period a merchant is most likely to act on. */}
      <div className="flex flex-col gap-3 rounded-[10px] border border-line bg-canvas px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border ${
              previousClosed
                ? "border-neg/30 bg-neg-tint text-neg"
                : "border-line bg-card text-ink-2"
            }`}
          >
            {previousClosed ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">
              {MONTHS[previousMonth - 1]} {previousYear}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
              {previousClosed
                ? "Closed — no further postings allowed"
                : "Open — close to prevent backdated postings"}
            </p>
          </div>
        </div>
        {previousClosed ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => reopenMonth(previousYear, previousMonth)}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
            {isPending ? "Reopening…" : "Reopen"}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => closeMonth(previousYear, previousMonth)}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            {isPending ? "Closing…" : "Close month"}
          </Button>
        )}
      </div>

      <h4 className="pt-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
        All periods
      </h4>
      {loadError && !loading ? (
        <div className="rounded-xl border border-neg/40 bg-neg-tint px-4 py-8 text-center text-[13px] text-neg">
          {loadError}
        </div>
      ) : (
        <SettingsTableCard
          loading={loading}
          isEmpty={items.length === 0}
          emptyLabel="No periods on file. Close the previous month to start."
        >
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Period</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Closed at</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className={trClass}>
                  <td className={`${tdClass} font-medium`}>
                    {MONTHS[p.month - 1]} {p.year}
                  </td>
                  <td className={tdClass}>
                    {p.status === "CLOSED" ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neg">
                        <Lock className="h-3.5 w-3.5" />
                        Closed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-pos">
                        <Unlock className="h-3.5 w-3.5" />
                        Open
                      </span>
                    )}
                  </td>
                  <td
                    className={`${tdClass} font-mono text-[12px] tabular-nums text-ink-2`}
                  >
                    {p.closedAt ? new Date(p.closedAt).toLocaleString() : "—"}
                  </td>
                  <td className={tdActionsClass}>
                    {p.status === "CLOSED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => reopenMonth(p.year, p.month)}
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Reopen
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SettingsTableCard>
      )}
    </SettingsSection>
  );
}
