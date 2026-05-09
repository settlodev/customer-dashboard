"use client";

import { useEffect, useState, useTransition } from "react";
import { CalendarOff, Lock, Unlock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { SettingsSection } from "../shared/settings-section";
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
  const [isPending, startTransition] = useTransition();

  const reload = async () => {
    setLoading(true);
    const data = await listAccountingPeriods();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

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

  return (
    <SettingsSection
      title="Accounting periods"
      description="Close month-end to lock journal posting for that period. Reopen requires a reason."
    >
      <Card className="border-line">
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
            <div>
              <p className="font-medium">
                {MONTHS[previousMonth - 1]} {previousYear}
              </p>
              <p className="text-xs text-muted-foreground">
                {isClosed(previousYear, previousMonth)
                  ? "Closed — no further postings allowed"
                  : "Open — close to prevent backdated postings"}
              </p>
            </div>
            {isClosed(previousYear, previousMonth) ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => reopenMonth(previousYear, previousMonth)}
              >
                <Unlock className="mr-1.5 h-3.5 w-3.5" />
                Reopen
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => closeMonth(previousYear, previousMonth)}
              >
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Close month
              </Button>
            )}
          </div>

          <h4 className="pt-4 text-xs font-medium uppercase text-muted-foreground tracking-wider">
            All periods
          </h4>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No periods on file. Close the previous month to start.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Closed at</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 font-medium">
                      {MONTHS[p.month - 1]} {p.year}
                    </td>
                    <td className="px-4 py-2">
                      {p.status === "CLOSED" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <CalendarOff className="h-3 w-3" />
                          Closed
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">Open</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {p.closedAt
                        ? new Date(p.closedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {p.status === "CLOSED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => reopenMonth(p.year, p.month)}
                        >
                          Reopen
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </SettingsSection>
  );
}
