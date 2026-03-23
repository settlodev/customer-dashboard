"use client";
import { useEffect, useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  CalendarIcon,
  DownloadIcon,
  ReceiptIcon,
  RotateCcwIcon,
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
import { ExpenseReport } from "@/types/expense/type";
import { GetExpenseReport } from "@/lib/actions/expense-actions";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Location } from "@/types/location/type";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}
interface FormValues {
  startDate: Date;
  endDate: Date;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

export default function ExpenseReportPage() {
  const [expenses, setExpenses] = useState<ExpenseReport>();
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [location, setLocation] = useState<Location>();
  const [dateError, setDateError] = useState<string>();
  const [formValues, setFormValues] = useState<FormValues>({
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date()),
  });

  useEffect(() => {
    getCurrentLocation().then(setLocation);
  }, []);

  useEffect(() => {
    setLoading(true);
    GetExpenseReport(
      startOfDay(new Date()).toISOString(),
      endOfDay(new Date()).toISOString(),
    )
      .then(setExpenses)
      .catch(() =>
        toast({
          variant: "destructive",
          title: "Error loading today's expenses",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const fetchReport = (start: Date, end: Date) => {
    setLoading(true);
    GetExpenseReport(start.toISOString(), end.toISOString())
      .then(setExpenses)
      .catch(() =>
        toast({ variant: "destructive", title: "Error loading report" }),
      )
      .finally(() => setLoading(false));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formValues.startDate > formValues.endDate) {
      setDateError("Start date must be before end date");
      return;
    }
    setDateError(undefined);
    fetchReport(formValues.startDate, formValues.endDate);
  };

  const handleResetToToday = () => {
    const s = startOfDay(new Date());
    const e = endOfDay(new Date());
    setFormValues({ startDate: s, endDate: e });
    setDateError(undefined);
    fetchReport(s, e);
  };

  const generateCSV = () => {
    if (!expenses) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    setDownloadingCsv(true);
    try {
      const esc = (v: string) =>
        v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      let csv = "Expense Report\n\n";
      if (location) {
        csv += `Location,${esc(location.name)}\n`;
        if (location.address) csv += `Address,${esc(location.address)}\n`;
        if (location.phone) csv += `Phone,${esc(location.phone)}\n`;
        if (location.email) csv += `Email,${esc(location.email)}\n`;
        csv += "\n";
      }
      csv += `Period Start,${format(formValues.startDate, "MMM dd, yyyy HH:mm")}\n`;
      csv += `Period End,${format(formValues.endDate, "MMM dd, yyyy HH:mm")}\n`;
      csv += `Report Generated,${format(new Date(), "MMM dd, yyyy HH:mm")}\n\n`;
      csv += `SUMMARY\nTotal Expenses,${fmt(expenses.totalExpenses)}\n\n`;
      csv += "CATEGORY BREAKDOWN\nCategory,Amount,Percentage\n";
      expenses.categorySummaries.forEach((c) => {
        csv += `${esc(c.categoryName)},${fmt(c.amount)},${c.percentage}%\n`;
      });
      csv +=
        "\nDisclaimer,This report was generated automatically by Settlo.\nPowered By,Settlo";
      const filename = `expense-report-${format(formValues.startDate, "yyyy-MM-dd")}-to-${format(formValues.endDate, "yyyy-MM-dd")}.csv`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
      );
      link.download = filename;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded", description: `Saved as ${filename}` });
    } catch {
      toast({ variant: "destructive", title: "CSV Generation Failed" });
    } finally {
      setDownloadingCsv(false);
    }
  };

  const generatePDF = async () => {
    if (!expenses) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      doc.setFontSize(10);
      doc.setFont("Arial", "bold");
      doc.text("EXPENSE REPORT", margin, 30);
      doc.setFont("Arial", "normal");
      doc.text(
        `Period: ${format(formValues.startDate, "MMM dd, yyyy HH:mm")} - ${format(formValues.endDate, "MMM dd, yyyy HH:mm")}`,
        margin,
        40,
      );
      doc.text(
        `Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`,
        margin,
        45,
      );
      if (location) {
        let y = 30;
        const right = pageWidth - margin;
        doc.setFont("Arial", "bold");
        doc.text(location.name, right, y, { align: "right" });
        y += 5;
        doc.setFont("Arial", "normal");
        doc
          .splitTextToSize(location.address || "", 150)
          .forEach((l: string) => {
            doc.text(l, right, y, { align: "right" });
            y += 5;
          });
        if (location.phone) {
          doc.text(`Phone: ${location.phone}`, right, y, { align: "right" });
          y += 5;
        }
        if (location.email) {
          doc.text(`Email: ${location.email}`, right, y, { align: "right" });
        }
      }
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, 55, pageWidth - 2 * margin, 20, "F");
      doc.setFontSize(11);
      doc.setFont("Arial", "bold");
      doc.text("Summary", margin + 5, 66);
      doc.setFontSize(10);
      doc.setFont("Arial", "normal");
      doc.text(
        `Total Expenses: TZS ${fmt(expenses.totalExpenses)}`,
        margin + 5,
        72,
      );
      let yPos = 90;
      doc.setFontSize(11);
      doc.setFont("Arial", "bold");
      doc.text("Expense Categories", margin, yPos);
      yPos += 5;
      doc.autoTable({
        startY: yPos,
        head: [["Category", "Amount", "Percentage"]],
        body: expenses.categorySummaries.map((c) => [
          c.categoryName,
          `TZS ${fmt(c.amount)}`,
          `${c.percentage}%`,
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: {
          fillColor: [5, 150, 105],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } },
      });
      const pageHeight = doc.internal.pageSize.height;
      if (((doc as any).lastAutoTable?.finalY || 0) > pageHeight - 60)
        doc.addPage();
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(32, 32, 32);
      const disclaimer =
        "This report was generated automatically by Settlo. Any discrepancies should be reported to support@settlo.co.tz.";
      const lines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
      const lh = 3;
      const startY = footerY - lines.length * lh - lh;
      doc.setDrawColor(32, 32, 32);
      doc.setLineWidth(0.3);
      doc.rect(
        margin - 3,
        startY - lh - 3,
        pageWidth - 2 * margin + 6,
        lines.length * lh + lh + 8,
        "S",
      );
      lines.forEach((l: string, i: number) => {
        doc.text(l, (pageWidth - doc.getTextWidth(l)) / 2, startY + i * lh);
      });
      const pw = "Powered by Settlo";
      doc.text(
        pw,
        (pageWidth - doc.getTextWidth(pw)) / 2,
        startY + lines.length * lh + 2,
      );
      const filename = `expense-report-${format(formValues.startDate, "yyyy-MM-dd")}-to-${format(formValues.endDate, "yyyy-MM-dd")}.pdf`;
      doc.save(filename);
      toast({ title: "PDF Downloaded", description: `Saved as ${filename}` });
    } catch {
      toast({ variant: "destructive", title: "PDF Generation Failed" });
    } finally {
      setDownloadingPdf(false);
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
            Expense report
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(formValues.startDate, "dd MMM yyyy")} —{" "}
            {format(formValues.endDate, "dd MMM yyyy, HH:mm")}
          </p>
        </div>
        {expenses && (
          <div className="flex gap-2">
            <Button
              onClick={generateCSV}
              disabled={downloadingCsv}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              {downloadingCsv ? "Exporting…" : "CSV"}
            </Button>
            <Button
              onClick={generatePDF}
              disabled={downloadingPdf}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              {downloadingPdf ? "Exporting…" : "PDF"}
            </Button>
          </div>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="p-4 bg-background border rounded-xl">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="flex-1">
            <DateTimePicker
              value={formValues.startDate}
              onChange={(d) => setFormValues((p) => ({ ...p, startDate: d }))}
              label="Start date"
            />
          </div>
          <div className="flex-1">
            <DateTimePicker
              value={formValues.endDate}
              onChange={(d) => setFormValues((p) => ({ ...p, endDate: d }))}
              label="End date"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetToToday}
              disabled={loading}
              className="h-9 text-sm gap-1.5"
            >
              <RotateCcwIcon className="h-3.5 w-3.5" />
              Today
            </Button>
            <SubmitButton
              isPending={loading}
              label="Apply filter"
              className="h-9 text-sm"
            />
          </div>
        </form>
        {dateError && <p className="text-xs text-red-500 mt-2">{dateError}</p>}
      </div>

      {/* ── Metric card ── */}
      {expenses && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Total expenses
            </p>
            <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
              TZS {fmt(expenses.totalExpenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.categorySummaries.length} categories
            </p>
          </div>
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden sm:col-span-2">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-muted-foreground/30 rounded-l-xl" />
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Category split
            </p>
            <div className="flex flex-wrap gap-2">
              {expenses.categorySummaries.map((c) => (
                <div
                  key={c.categoryName}
                  className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg px-2.5 py-1.5"
                >
                  <span className="font-medium">{c.categoryName}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {c.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
          <span className="text-sm">Loading report…</span>
        </div>
      )}

      {/* ── Category breakdown table ── */}
      {!loading && expenses && expenses.categorySummaries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Category breakdown
            </p>
            <span className="text-xs text-muted-foreground">
              {expenses.categorySummaries.length} categories
            </span>
          </div>
          <div className="bg-background border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Share
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground w-40 hidden sm:table-cell">
                    Distribution
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.categorySummaries.map((c) => (
                  <tr
                    key={c.categoryName}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{c.categoryName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600 dark:text-red-400">
                      TZS {fmt(c.amount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {c.percentage}%
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${Math.min(c.percentage, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && (!expenses || expenses.categorySummaries.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <ReceiptIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No expense data</p>
          <p className="text-xs text-muted-foreground mt-1">
            Select a date range to view expenses
          </p>
        </div>
      )}
    </div>
  );
}
