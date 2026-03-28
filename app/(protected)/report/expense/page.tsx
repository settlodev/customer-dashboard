"use client";
import { useEffect, useRef, useState } from "react";
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
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Location } from "@/types/location/type";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}
interface FormValues {
  startDate: Date;
  endDate: Date;
}

const PRIMARY = "#EB7F44";
const SECONDARY = "#EAEAE5";
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
  const printRef = useRef<HTMLDivElement>(null);

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
        if (location.phoneNumber) csv += `Phone,${esc(location.phoneNumber)}\n`;
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
    const el = printRef.current;
    if (!el || !expenses) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    setDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const saved = {
        width: el.style.width,
        maxWidth: el.style.maxWidth,
        margin: el.style.margin,
        boxShadow: el.style.boxShadow,
        position: el.style.position,
      };
      Object.assign(el.style, {
        width: "794px",
        maxWidth: "794px",
        margin: "0",
        boxShadow: "none",
        position: "relative",
        backgroundColor: "#ffffff",
      });
      await new Promise((r) => setTimeout(r, 150));
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: el.scrollHeight,
        windowWidth: 1200,
        windowHeight: el.scrollHeight + 100,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        onclone: (_doc, clone) => {
          Object.assign(clone.style, {
            width: "794px",
            maxWidth: "794px",
            margin: "0",
            backgroundColor: "#ffffff",
          });
          clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.visibility = "visible";
            node.style.opacity = "1";
            (node.style as any).printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";
          });
        },
      });
      Object.assign(el.style, saved);
      const A4_W = 210,
        A4_H = 297,
        MARGIN = 10;
      const printW = A4_W - MARGIN * 2;
      const contentH = (canvas.height * printW) / canvas.width;
      const pageH = A4_H - MARGIN * 2;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      if (contentH <= pageH) {
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 1.0),
          "JPEG",
          MARGIN,
          MARGIN,
          printW,
          contentH,
          undefined,
          "FAST",
        );
      } else {
        const totalPages = Math.ceil(contentH / pageH);
        const pageHeightPx = (pageH * canvas.width) / printW;
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();
          const srcY = page * pageHeightPx;
          const srcH = Math.min(pageHeightPx, canvas.height - srcY);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = srcH;
          const ctx = slice.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            srcH,
            0,
            0,
            canvas.width,
            srcH,
          );
          pdf.addImage(
            slice.toDataURL("image/jpeg", 1.0),
            "JPEG",
            MARGIN,
            MARGIN,
            printW,
            (srcH * printW) / canvas.width,
            undefined,
            "FAST",
          );
        }
      }
      const filename = `expense-report-${format(formValues.startDate, "yyyy-MM-dd")}-to-${format(formValues.endDate, "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);
      toast({ title: "PDF Downloaded", description: `Saved as ${filename}` });
    } catch (e) {
      console.error(e);
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

  // Max bar width for distribution column
  const maxAmount = expenses
    ? Math.max(...expenses.categorySummaries.map((c) => c.amount), 1)
    : 1;

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

      {/* ── Metric cards ── */}
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

      {/* ── Hidden print template (html2canvas target) ── */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <div
          ref={printRef}
          style={{
            width: 794,
            backgroundColor: "#ffffff",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#111827",
          }}
        >
          {/* Header */}
          <div
            style={{ borderTop: "3px solid #111827", padding: "24px 32px 0" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              {/* Left: location */}
              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {location?.name ?? ""}
                </div>
                {location?.address && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {location.address}
                  </div>
                )}
                {location?.phoneNumber && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Tel: {location.phoneNumber}
                  </div>
                )}
                {location?.email && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {location.email}
                  </div>
                )}
              </div>
              {/* Right: title */}
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 300,
                    color: PRIMARY,
                    letterSpacing: "0.04em",
                  }}
                >
                  EXPENSE
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>REPORT</div>
              </div>
            </div>

            {/* Period bar */}
            <div
              style={{
                marginTop: 20,
                padding: "10px 0",
                borderTop: `1px solid ${SECONDARY}`,
                borderBottom: `1px solid ${SECONDARY}`,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              <span>
                Period:{" "}
                <strong style={{ color: "#111827" }}>
                  {format(formValues.startDate, "MMM dd, yyyy HH:mm")} —{" "}
                  {format(formValues.endDate, "MMM dd, yyyy HH:mm")}
                </strong>
              </span>
              <span>
                Generated:{" "}
                <strong style={{ color: "#111827" }}>
                  {format(new Date(), "MMM dd, yyyy HH:mm")}
                </strong>
              </span>
            </div>
          </div>

          {expenses && (
            <>
              {/* Total expenses strip */}
              <div
                style={{
                  margin: "24px 32px",
                  border: `1px solid ${SECONDARY}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderTop: "3px solid #111827",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                    }}
                  >
                    Total expenses
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#111827",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    TZS {fmt(expenses.totalExpenses)}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {expenses.categorySummaries.length} categories
                  </div>
                </div>
              </div>

              {/* Category breakdown table */}
              <div
                style={{
                  margin: "0 32px 32px",
                  border: `1px solid ${SECONDARY}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 80px 120px",
                    backgroundColor: "#111827",
                    padding: "10px 16px",
                  }}
                >
                  {["Category", "Amount", "Share", "Distribution"].map((h) => (
                    <div
                      key={h}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#ffffff",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        textAlign: h === "Category" ? "left" : "right",
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {expenses.categorySummaries.map((c, i) => (
                  <div
                    key={c.categoryName}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 160px 80px 120px",
                      padding: "11px 16px",
                      borderBottom:
                        i < expenses.categorySummaries.length - 1
                          ? `1px solid ${SECONDARY}`
                          : "none",
                      backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {c.categoryName}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      TZS {fmt(c.amount)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {c.percentage}%
                    </div>
                    {/* Bar */}
                    <div style={{ textAlign: "right", paddingLeft: 16 }}>
                      <div
                        style={{
                          height: 6,
                          backgroundColor: "#e5e7eb",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(c.percentage, 100)}%`,
                            backgroundColor: "#374151",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 80px 120px",
                    padding: "12px 16px",
                    backgroundColor: "#f3f4f6",
                    borderTop: "2px solid #111827",
                  }}
                >
                  <div
                    style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}
                  >
                    Total
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#111827",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    TZS {fmt(expenses.totalExpenses)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      textAlign: "right",
                    }}
                  >
                    100%
                  </div>
                  <div />
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div
            style={{
              borderTop: `1px solid ${SECONDARY}`,
              margin: "0 32px",
              padding: "16px 0",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.6 }}>
              This report was generated automatically by Settlo. Any
              discrepancies should be reported to support@settlo.co.tz.
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#d1d5db",
                marginTop: 6,
              }}
            >
              Powered by Settlo
            </div>
          </div>
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
}
