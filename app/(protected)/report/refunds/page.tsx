"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  DownloadIcon,
  PackageIcon,
  RotateCcwIcon,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import SubmitButton from "@/components/widgets/submit-button";
import { cn } from "@/lib/utils";
import { ItemRefunds, RefundReport } from "@/types/refunds/type";
import { GetRefundReport } from "@/lib/actions/refund-actions";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

interface FormValues {
  startDate: Date;
  endDate: Date;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export default function RefundReportPage() {
  const [refunds, setRefunds] = useState<RefundReport>();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dateError, setDateError] = useState<string>();

  const { start, end } = getTodayRange();
  const [formValues, setFormValues] = useState<FormValues>({
    startDate: start,
    endDate: end,
  });

  useEffect(() => {
    const { start, end } = getTodayRange();
    setLoading(true);
    GetRefundReport(start.toISOString(), end.toISOString())
      .then(setRefunds)
      .catch(() =>
        toast({
          variant: "destructive",
          title: "Error loading today's report",
        }),
      )
      .finally(() => {
        setLoading(false);
        setInitialLoad(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formValues.startDate > formValues.endDate) {
      setDateError("Start date must be before end date");
      return;
    }
    setDateError(undefined);
    setLoading(true);
    try {
      const data = await GetRefundReport(
        formValues.startDate.toISOString(),
        formValues.endDate.toISOString(),
      );
      setRefunds(data);
    } catch {
      toast({
        variant: "destructive",
        title: "Error loading report",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const DateTimePicker = ({ value, onChange, label }: DatePickerProps) => {
    const handleDateSelect = (date: Date | undefined) => {
      if (date) {
        const d = new Date(date);
        d.setHours(value.getHours());
        d.setMinutes(value.getMinutes());
        onChange(d);
      }
    };
    const handleTimeChange = (type: "hour" | "minute", val: string) => {
      const d = new Date(value);
      type === "hour"
        ? d.setHours(parseInt(val, 10))
        : d.setMinutes(parseInt(val, 10));
      onChange(d);
    };
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-9 text-sm",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              {value ? (
                format(value, "dd MMM yyyy, HH:mm")
              ) : (
                <span>Pick date and time</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="sm:flex">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleDateSelect}
                initialFocus
              />
              <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex sm:flex-col p-2">
                    {Array.from({ length: 24 }, (_, i) => i)
                      .reverse()
                      .map((h) => (
                        <Button
                          key={h}
                          size="icon"
                          variant={
                            value?.getHours() === h ? "default" : "ghost"
                          }
                          className="sm:w-full shrink-0 aspect-square text-xs"
                          onClick={() => handleTimeChange("hour", h.toString())}
                        >
                          {h}
                        </Button>
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex sm:flex-col p-2">
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                      <Button
                        key={m}
                        size="icon"
                        variant={
                          value?.getMinutes() === m ? "default" : "ghost"
                        }
                        className="sm:w-full shrink-0 aspect-square text-xs"
                        onClick={() => handleTimeChange("minute", m.toString())}
                      >
                        {m.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 space-y-5 min-h-screen">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Refund report
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {refunds
              ? `${format(formValues.startDate, "dd MMM yyyy")} — ${format(formValues.endDate, "dd MMM yyyy, HH:mm")}`
              : "Select a date range to load report"}
          </p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="p-4 bg-background border rounded-xl">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="flex flex-col flex-1">
            <DateTimePicker
              value={formValues.startDate}
              onChange={(d) => setFormValues((p) => ({ ...p, startDate: d }))}
              label="Start date"
            />
          </div>
          <div className="flex flex-col flex-1">
            <DateTimePicker
              value={formValues.endDate}
              onChange={(d) => setFormValues((p) => ({ ...p, endDate: d }))}
              label="End date"
            />
          </div>
          <SubmitButton
            isPending={loading && !initialLoad}
            label="Apply filter"
            className="h-9 text-sm sm:w-auto w-full"
          />
        </form>
        {dateError && <p className="text-xs text-red-500 mt-2">{dateError}</p>}
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Total refunds
          </p>
          <p className="text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {refunds?.totalRefunds ?? 0}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              transactions
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Refund count in period
          </p>
        </div>

        <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Total refunded amount
          </p>
          <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            TZS {formatCurrency(refunds?.totalRefundsAmount ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Revenue reversed to customers
          </p>
        </div>

        <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Total returned cost
          </p>
          <p className="text-2xl font-semibold tabular-nums text-purple-600 dark:text-purple-400">
            TZS {formatCurrency(refunds?.totalReturnedCost ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cost of goods returned to stock
          </p>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
          <span className="text-sm">
            {initialLoad ? "Loading today's report…" : "Loading report…"}
          </span>
        </div>
      )}

      {/* ── Refunded items table ── */}
      {!loading &&
        refunds &&
        refunds.refundedItems &&
        refunds.refundedItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Refunded items
              </p>
              <span className="text-xs text-muted-foreground">
                {refunds.refundedItems.length} items
              </span>
            </div>

            <div className="bg-background border rounded-xl overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      {[
                        "Item",
                        "Qty",
                        "Refund amount",
                        "Returned cost",
                        "Earliest",
                        "Latest",
                        "Processed by",
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap",
                            i >= 1 && i <= 3 ? "text-right" : "text-left",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {refunds.refundedItems.map(
                      (item: ItemRefunds, index: number) => (
                        <tr
                          key={index}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm">
                              {item.orderItemName}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">
                            {item.quantity}
                            <span className="text-muted-foreground font-normal ml-1">
                              units
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-red-600 dark:text-red-400">
                            TZS {formatCurrency(item.refundAmount)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-purple-600 dark:text-purple-400">
                            TZS {formatCurrency(item.returnedCost)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            {format(
                              new Date(item.earliestRefunded),
                              "dd MMM, HH:mm",
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            {format(
                              new Date(item.latestRefunded),
                              "dd MMM, HH:mm",
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 shrink-0" />
                              {item.staffName || "—"}
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y">
                {refunds.refundedItems.map(
                  (item: ItemRefunds, index: number) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <p className="font-medium text-sm">
                          {item.orderItemName}
                        </p>
                        <span className="text-xs tabular-nums font-medium text-muted-foreground whitespace-nowrap">
                          {item.quantity} units
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted/40 rounded-lg p-2.5">
                          <p className="text-muted-foreground mb-0.5">
                            Refund amount
                          </p>
                          <p className="font-semibold tabular-nums text-red-600">
                            TZS {formatCurrency(item.refundAmount)}
                          </p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5">
                          <p className="text-muted-foreground mb-0.5">
                            Returned cost
                          </p>
                          <p className="font-semibold tabular-nums text-purple-600">
                            TZS {formatCurrency(item.returnedCost)}
                          </p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5">
                          <p className="text-muted-foreground mb-0.5">
                            Earliest
                          </p>
                          <p className="font-medium">
                            {format(
                              new Date(item.earliestRefunded),
                              "dd MMM, HH:mm",
                            )}
                          </p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5">
                          <p className="text-muted-foreground mb-0.5">Latest</p>
                          <p className="font-medium">
                            {format(
                              new Date(item.latestRefunded),
                              "dd MMM, HH:mm",
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{item.staffName || "—"}</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

      {/* ── Empty state ── */}
      {!loading &&
        refunds &&
        (!refunds.refundedItems || refunds.refundedItems.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <RotateCcwIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No refunds in this period</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try selecting a different date range
            </p>
          </div>
        )}
    </div>
  );
}
