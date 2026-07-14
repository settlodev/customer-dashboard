"use client";

import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  DownloadIcon,
  FileTextIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ArrowRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { z } from "zod";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SubmitButton from "@/components/widgets/submit-button";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Location } from "@/types/location/type";
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EfdStatus, ZReports } from "@/lib/actions/efd-action";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

interface EfdStatusResponse {
  isOnboarded?: boolean;
  isVerified?: boolean;
  completelyValid?: boolean;
  responseType?: string;
  message?: string;
  [key: string]: any;
}

interface ZReportRow {
  zrDate: string;
  zrTime: string;
  totalReceipt: number;
  totalTax: number;
  totalSales: number;
  totalSalesVatInc: number;
  totalSalesVatExc: number;
  totalNetAmount: number;
  totalDiscount: number;
  gross: number;
  status: string;
}

const FormSchema = z.object({
  startDate: z.date({ required_error: "Start date and time are required." }),
  endDate: z.date({ required_error: "End date and time are required." }),
});

const fmt2 = (v: number | null | undefined) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v ?? 0);

/* Map EFD status codes → human label */
const statusLabel = (code: string | number | null | undefined) => {
  const s = String(code ?? "").trim();
  switch (s) {
    case "0":
      return "Pending";
    case "1":
      return "Submitted";
    case "2":
      return "Acknowledged";
    case "3":
      return "Failed";
    default:
      return s || "—";
  }
};

const statusToneClasses = (code: string | number | null | undefined) => {
  const s = String(code ?? "").trim();
  switch (s) {
    case "2":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
    case "1":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400";
    case "3":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

/* ── EFD Status gate component ── */
const EfdStatusGate = ({ status }: { status: EfdStatusResponse | null }) => {
  const checks = [
    {
      key: "isOnboarded",
      label: "EFD Onboarding",
      description: "Your business is registered with the EFD system",
      passed: !!status?.isOnboarded,
    },
    {
      key: "isVerified",
      label: "Verification",
      description: "Your EFD credentials have been verified",
      passed: !!status?.isVerified,
    },
    {
      key: "completelyValid",
      label: "Validation Complete",
      description: "All required EFD details have been validated",
      passed: !!status?.completelyValid,
    },
  ];

  const completedCount = checks.filter((c) => c.passed).length;
  const progressPct = Math.round((completedCount / checks.length) * 100);

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 space-y-5 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Z Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            End-of-day fiscal summary from your EFD device
          </p>
        </div>
      </div>

      <div className="bg-background border rounded-xl overflow-hidden">
        <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <ShieldAlertIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">
                EFD setup incomplete
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Z Reports are only available once your Electronic Fiscal Device
                (EFD) setup is fully completed and verified. Please complete the
                steps below to access this report.
              </p>

              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">
                    Setup progress
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {completedCount} of {checks.length} complete
                  </span>
                </div>
                <div className="h-2 rounded-full bg-amber-100 dark:bg-amber-950/60 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {checks.map((c) => (
            <div
              key={c.key}
              className="flex items-start gap-3 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="shrink-0 mt-0.5">
                {c.passed ? (
                  <CheckCircle2Icon className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      c.passed ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {c.label}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider",
                      c.passed
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {c.passed ? "Done" : "Pending"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Need help? Contact support or visit your EFD settings to continue
            setup.
          </p>
          <Link href="/settings">
            <Button size="sm" className="h-8 text-xs gap-1.5">
              Complete EFD setup
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-background border rounded-xl p-5 flex gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
          <FileTextIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <p className="text-sm font-medium">What is a Z Report?</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            A Z Report is an official end-of-day fiscal summary generated by
            your EFD device. It records the day&apos;s total sales, taxes
            collected, and refunds for tax authority reporting. It can only be
            generated after your EFD device is fully onboarded and verified.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Receipt body — shows per-day rows plus aggregated totals ── */
const ZReceiptBody = ({
  reportData,
  location,
  startDate,
  endDate,
}: {
  reportData: ZReportRow[];
  location?: Location;
  startDate: Date;
  endDate: Date;
}) => {
  // Aggregate totals across the period
  const totals = reportData.reduce(
    (acc, r) => {
      acc.totalReceipt += r.totalReceipt ?? 0;
      acc.totalSales += r.totalSales ?? 0;
      acc.totalSalesVatInc += r.totalSalesVatInc ?? 0;
      acc.totalSalesVatExc += r.totalSalesVatExc ?? 0;
      acc.totalTax += r.totalTax ?? 0;
      acc.totalDiscount += r.totalDiscount ?? 0;
      acc.totalNetAmount += r.totalNetAmount ?? 0;
      return acc;
    },
    {
      totalReceipt: 0,
      totalSales: 0,
      totalSalesVatInc: 0,
      totalSalesVatExc: 0,
      totalTax: 0,
      totalDiscount: 0,
      totalNetAmount: 0,
    },
  );

  // Gross is a cumulative counter from the EFD — use the latest row's value
  const sorted = [...reportData].sort((a, b) =>
    a.zrDate.localeCompare(b.zrDate),
  );
  const firstRow = sorted[0];
  const lastRow = sorted[sorted.length - 1];
  const cumulativeGross = lastRow?.gross ?? 0;

  const startStr = format(startDate, "dd-MM-yyyy");
  const endStr = format(endDate, "dd-MM-yyyy");
  const timeStr = format(new Date(), "HH:mm");
  const efdSerial =
    (location as any)?.efdSerialNumber ??
    (location as any)?.serialNumber ??
    "—";
  const zNoStart = firstRow?.zrDate
    ? `Z-${firstRow.zrDate.replace(/-/g, "").slice(-7)}`
    : "—";
  const zNoEnd = lastRow?.zrDate
    ? `Z-${lastRow.zrDate.replace(/-/g, "").slice(-7)}`
    : "—";

  // VAT bucket mapping (backend exposes only a single tax bucket)
  const totalSalesIncVat = totals.totalSalesVatInc;
  const vat18Amount = totals.totalTax;
  const vat0Amount = 0;
  const vatExemptAmount = 0;
  const vat18Nett = totals.totalSalesVatExc;
  const totalVatPayable = totals.totalTax;
  const totalInvoices = totals.totalReceipt;
  const cancelledReceipts = 0;

  const line = (label: string, value: string, opts?: { bold?: boolean }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 4,
        fontWeight: opts?.bold ? 700 : 400,
      }}
    >
      <span>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );

  const divider = (
    <div
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        letterSpacing: "0.05em",
        margin: "10px 0",
      }}
    >
      ────────────────────────────────
    </div>
  );

  return (
    <div
      style={{
        fontFamily:
          "'Courier New', 'Courier', 'Liberation Mono', 'DejaVu Sans Mono', monospace",
        fontSize: 13,
        lineHeight: 1.6,
        color: "inherit",
      }}
    >
      {/* COMPANY HEADER */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div
          style={{
            fontWeight: 700,
            letterSpacing: "0.05em",
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          {location?.name ?? "[COMPANY NAME]"}
        </div>
        {location?.address && <div>{location.address}</div>}
        {(location as any)?.city && <div>{(location as any).city}</div>}
        {(location as any)?.tin && <div>TIN: {(location as any).tin}</div>}
        {(location as any)?.vrn && <div>VRN: {(location as any).vrn}</div>}
      </div>

      {/* TITLE */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          letterSpacing: "0.08em",
          marginTop: 8,
          marginBottom: 6,
        }}
      >
        FISCAL CLOSING (Z REPORT)
      </div>
      {divider}

      {/* DATE / TIME / SERIAL */}
      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span>FROM: {startStr}</span>
          <span>TIME: {timeStr}</span>
        </div>
        {startStr !== endStr && (
          <div style={{ marginBottom: 4 }}>TO: {endStr}</div>
        )}
        <div style={{ marginBottom: 4 }}>
          Z-NO RANGE: {zNoStart}
          {zNoStart !== zNoEnd ? ` → ${zNoEnd}` : ""}
        </div>
        <div>EFD SERIAL NO: {efdSerial}</div>
      </div>

      {divider}

      {/* PER-DAY BREAKDOWN */}
      {reportData.length > 1 && (
        <>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            --- DAILY BREAKDOWN ---
          </div>
          <div style={{ marginBottom: 8 }}>
            {sorted.map((row, idx) => {
              let dateLabel = row.zrDate;
              try {
                dateLabel = format(parseISO(row.zrDate), "dd MMM");
              } catch {
                /* keep raw */
              }
              return (
                <div key={`${row.zrDate}-${idx}`} style={{ marginBottom: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 600,
                    }}
                  >
                    <span>{dateLabel}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                      {fmt2(row.totalSalesVatInc)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      opacity: 0.7,
                    }}
                  >
                    <span>
                      {row.totalReceipt} rcpt · status {statusLabel(row.status)}
                    </span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                      VAT {fmt2(row.totalTax)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {divider}
        </>
      )}

      {/* SUMMARY */}
      <div style={{ fontWeight: 700, marginBottom: 8 }}>--- SUMMARY ---</div>

      <div style={{ marginBottom: 8 }}>
        {line("TOTAL SALES (TSh)", fmt2(totalSalesIncVat), { bold: true })}
        {line("VAT 18% (18% RATE)", fmt2(vat18Amount))}
        {line("VAT 2 (0% RATE)", fmt2(vat0Amount))}
        {line("VAT 3 (EXEMPT)", fmt2(vatExemptAmount))}
        <div style={{ height: 10 }} />
        {line("VAT18% NETT", fmt2(vat18Nett))}
        {line("TOTAL VAT PAYABLE", fmt2(totalVatPayable), { bold: true })}
        <div style={{ height: 10 }} />
        {line("TOTAL DISCOUNT", fmt2(totals.totalDiscount))}
        {line("TOTAL NET AMOUNT", fmt2(totals.totalNetAmount))}
        <div style={{ height: 10 }} />
        {line("TOTAL INVOICES", String(totalInvoices))}
        {line("CANCELLED RECEIPTS", String(cancelledReceipts))}
      </div>

      {divider}

      {/* GRAND TOTAL (cumulative EFD counter) */}
      <div style={{ marginBottom: 8 }}>
        {line("GRAND TOTAL (Cumulative)", fmt2(cumulativeGross), {
          bold: true,
        })}
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
          Lifetime gross reported by EFD device
        </div>
      </div>

      {divider}

      {/* FOOTER */}
      <div className=" flex flex-col items-center justify-center mt-3">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          THANK YOU FOR YOUR BUSINESS
        </div>
        <div>Powered by Settlo Technologies</div>
      </div>
    </div>
  );
};

const ZReport = () => {
  const [reportData, setReportData] = useState<ZReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // EFD status gating
  const [efdStatus, setEfdStatus] = useState<EfdStatusResponse | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [location, setLocation] = useState<Location>();

  const printRef = useRef<HTMLDivElement>(null);

  // Check EFD status first
  useEffect(() => {
    EfdStatus()
      .then((res: EfdStatusResponse) => setEfdStatus(res))
      .catch((err) => {
        console.error("EFD status check failed:", err);
        setEfdStatus(null);
      })
      .finally(() => setCheckingStatus(false));
  }, []);

  const canAccessReport = useMemo(() => {
    return (
      !!efdStatus?.isOnboarded &&
      !!efdStatus?.isVerified &&
      !!efdStatus?.completelyValid
    );
  }, [efdStatus]);

  useEffect(() => {
    getCurrentLocation().then(setLocation);
  }, []);

  // Aggregated totals for the header strip
  const aggregates = useMemo(() => {
    return reportData.reduce(
      (acc, r) => {
        acc.receipts += r.totalReceipt ?? 0;
        acc.salesInc += r.totalSalesVatInc ?? 0;
        acc.tax += r.totalTax ?? 0;
        acc.discount += r.totalDiscount ?? 0;
        return acc;
      },
      { receipts: 0, salesInc: 0, tax: 0, discount: 0 },
    );
  }, [reportData]);

  // Normalise API response: array, or wrapped in { content/data/items }
  const normaliseRows = (res: any): ZReportRow[] => {
    if (Array.isArray(res)) return res;
    return res?.content ?? res?.data ?? res?.items ?? [];
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      startDate: (() => {
        const now = new Date();
        now.setHours(0, 0, 0, 1);
        return now;
      })(),
      endDate: new Date(),
    },
  });

  const onInvalid = useCallback((errors: FieldErrors) => {
    toast({
      variant: "destructive",
      title: "Validation error",
      description:
        typeof errors.message === "string"
          ? errors.message
          : "Please check all fields.",
    });
  }, []);

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      const response = await ZReports(values.startDate, values.endDate);
      setReportData(normaliseRows(response));
      setHasFetched(true);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Failed to load Z Report",
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertToCSV = (data: ZReportRow[]) => {
    if (!data.length) return "";
    const headers = [
      "Date",
      "Time",
      "Receipt Count",
      "Sales (VAT Inc)",
      "Sales (VAT Exc)",
      "Tax",
      "Discount",
      "Net Amount",
      "Cumulative Gross",
      "Status",
    ];
    const rows = data.map((row) => [
      row.zrDate,
      row.zrTime,
      row.totalReceipt,
      row.totalSalesVatInc,
      row.totalSalesVatExc,
      row.totalTax,
      row.totalDiscount,
      row.totalNetAmount,
      row.gross,
      statusLabel(row.status),
    ]);
    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const downloadCSV = () => {
    if (!reportData.length) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    setDownloadingCsv(true);
    try {
      const blob = new Blob([convertToCSV(reportData)], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const s = format(form.getValues("startDate"), "yyyy-MM-dd");
      const e = format(form.getValues("endDate"), "yyyy-MM-dd");
      const filename = `z-report-${s}-to-${e}.csv`;
      link.href = URL.createObjectURL(blob);
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
    if (!el || !reportData.length) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    setDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      await new Promise((r) => setTimeout(r, 100));
      // For the PDF capture we temporarily force a white background
      // and dark text so the saved file is always readable in print.
      const prevBg = el.style.background;
      const prevColor = el.style.color;
      el.style.background = "#ffffff";
      el.style.color = "#111827";

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      el.style.background = prevBg;
      el.style.color = prevColor;

      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 10;
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
        const totalPg = Math.ceil(contentH / pageH);
        const pageHpx = (pageH * canvas.width) / printW;
        for (let p = 0; p < totalPg; p++) {
          if (p > 0) pdf.addPage();
          const srcY = p * pageHpx;
          const srcH = Math.min(pageHpx, canvas.height - srcY);
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
      const filename = `z-report-${format(form.getValues("startDate"), "yyyy-MM-dd")}-to-${format(form.getValues("endDate"), "yyyy-MM-dd")}.pdf`;
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
      if (type === "hour") d.setHours(parseInt(val, 10));
      else d.setMinutes(parseInt(val, 10));
      onChange(d);
    };
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
          <PopoverContent className="w-auto p-0">
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

  // 1) While checking EFD status — always show loader
  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  // 2) EFD not fully set up — show gate
  if (!canAccessReport) {
    return <EfdStatusGate status={efdStatus} />;
  }

  // 3) EFD valid — render page
  return (
    <TooltipProvider>
      <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 space-y-5 min-h-screen">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">Z Report</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <ShieldCheckIcon className="h-2.5 w-2.5" /> EFD Verified
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              End-of-day fiscal summary from your EFD device
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={downloadCSV}
              disabled={downloadingCsv || !reportData.length}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              {downloadingCsv ? "Exporting…" : "CSV"}
            </Button>
            <Button
              onClick={generatePDF}
              disabled={downloadingPdf || !reportData.length}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              {downloadingPdf ? "Exporting…" : "PDF"}
            </Button>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 bg-background border rounded-xl">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onInvalid)}
              className="flex flex-col sm:flex-row sm:items-end gap-3 w-full"
            >
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col flex-1">
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      label="Start date"
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col flex-1">
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      label="End date"
                    />
                  </FormItem>
                )}
              />
              <SubmitButton
                isPending={form.formState.isSubmitting || isLoading}
                label="Apply filter"
                className="h-9 text-sm sm:w-auto w-full"
              />
            </form>
          </Form>
        </div>

        {/* ── KPI strip (visible only after fetch) ── */}
        {hasFetched && !isLoading && reportData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-background border rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Total sales (VAT inc)
              </p>
              <p className="text-base font-semibold tabular-nums mt-1">
                TSh {fmt2(aggregates.salesInc)}
              </p>
            </div>
            <div className="bg-background border rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                VAT collected
              </p>
              <p className="text-base font-semibold tabular-nums mt-1">
                TSh {fmt2(aggregates.tax)}
              </p>
            </div>
            <div className="bg-background border rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Receipts
              </p>
              <p className="text-base font-semibold tabular-nums mt-1">
                {aggregates.receipts.toLocaleString()}
              </p>
            </div>
            <div className="bg-background border rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Days in range
              </p>
              <p className="text-base font-semibold tabular-nums mt-1">
                {reportData.length}
              </p>
            </div>
          </div>
        )}

        {/* ── Daily rows table (visible only when multiple days) ── */}
        {hasFetched && !isLoading && reportData.length > 1 && (
          <div className="bg-background border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-medium">Daily breakdown</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each row is one closed fiscal day reported by the EFD
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b bg-muted/30">
                    <th className="text-left font-medium px-4 py-2.5">Date</th>
                    <th className="text-right font-medium px-4 py-2.5">
                      Receipts
                    </th>
                    <th className="text-right font-medium px-4 py-2.5">
                      Sales (VAT inc)
                    </th>
                    <th className="text-right font-medium px-4 py-2.5">VAT</th>
                    <th className="text-right font-medium px-4 py-2.5">
                      Discount
                    </th>
                    <th className="text-center font-medium px-4 py-2.5">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...reportData]
                    .sort((a, b) => a.zrDate.localeCompare(b.zrDate))
                    .map((row, idx) => {
                      let label = row.zrDate;
                      try {
                        label = format(parseISO(row.zrDate), "dd MMM yyyy");
                      } catch {
                        /* keep raw */
                      }
                      return (
                        <tr
                          key={`${row.zrDate}-${idx}`}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-medium">{label}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {row.totalReceipt.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {fmt2(row.totalSalesVatInc)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {fmt2(row.totalTax)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {fmt2(row.totalDiscount)}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={cn(
                                "inline-block text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider",
                                statusToneClasses(row.status),
                              )}
                            >
                              {statusLabel(row.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30 text-xs font-semibold">
                    <td className="px-4 py-2.5 uppercase tracking-wider">
                      Total
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {aggregates.receipts.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {fmt2(aggregates.salesInc)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {fmt2(aggregates.tax)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {fmt2(aggregates.discount)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── Receipt area (no white background; uses theme surface) ── */}
        <div className="bg-background border rounded-xl overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loading />
            </div>
          )}

          {!hasFetched && !isLoading && (
            <div className="py-16 text-center">
              <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a date range and click Apply filter to view the Z Report
              </p>
            </div>
          )}

          {hasFetched && !isLoading && reportData.length === 0 && (
            <div className="py-16 text-center">
              <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No Z Report data found for the selected period
              </p>
            </div>
          )}

          {hasFetched && !isLoading && reportData.length > 0 && (
            <div className="flex justify-center py-8 px-4">
              {/* Receipt card — uses theme background, dashed border, no harsh white */}
              <div
                ref={printRef}
                className="bg-muted/20 text-foreground border border-dashed border-border rounded-md"
                style={{
                  width: "100%",
                  maxWidth: 520,
                  padding: "32px 36px",
                }}
              >
                <ZReceiptBody
                  reportData={reportData}
                  location={location}
                  startDate={form.getValues("startDate")}
                  endDate={form.getValues("endDate")}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ZReport;
