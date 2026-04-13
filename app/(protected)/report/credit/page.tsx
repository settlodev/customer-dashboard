"use client";
import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon, DownloadIcon, ReceiptIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SubmitButton from "@/components/widgets/submit-button";
import { toast } from "@/hooks/use-toast";
import { creditReport } from "@/lib/actions/order-actions";
import { Credit } from "@/types/orders/type";
import { useRouter } from "next/navigation";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Location } from "@/types/location/type";
import Loading from "@/components/ui/loading";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

const FormSchema = z.object({
  startDate: z.date({ required_error: "Start date and time are required." }),
  endDate: z.date({ required_error: "End date and time are required." }),
});

const PRIMARY = "#EB7F44";
const SECONDARY = "#EAEAE5";
const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

const CreditReportDashboard = () => {
  const [creditData, setCreditData] = useState<Credit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [location, setLocation] = useState<Location>();
  const printRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const form = useForm({
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

  useEffect(() => {
    getCurrentLocation().then(setLocation);
  }, []);

  const fetchCreditReport = async (startDate: Date, endDate: Date) => {
    setIsLoading(true);
    try {
      const response = await creditReport(startDate, endDate);
      setCreditData(response);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch credit report",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditReport(form.getValues("startDate"), form.getValues("endDate"));
  }, [form]);

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    await fetchCreditReport(values.startDate, values.endDate);
  };

  const downloadCSV = () => {
    if (!creditData) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    setDownloadingCsv(true);
    try {
      const headers = [
        "Order Number",
        "Order Name",
        "Date",
        "Customer",
        "Paid Amount",
        "Unpaid Amount",
        "Status",
      ];
      const rows = creditData.unpaidOrders.map((o) =>
        [
          `"${o.orderNumber.replace(/"/g, '""')}"`,
          `"${(o.orderName || "N/A").replace(/"/g, '""')}"`,
          format(new Date(o.openedDate), "yyyy-MM-dd"),
          `"${(o.customerName || "N/A").replace(/"/g, '""')}"`,
          o.paidAmount,
          o.unpaidAmount,
          "Unpaid",
        ].join(","),
      );
      const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const filename = `credit-report-${format(new Date(creditData.startDate), "yyyy-MM-dd")}-to-${format(new Date(creditData.endDate), "yyyy-MM-dd")}.csv`;
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
    if (!el || !creditData) {
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
      const filename = `credit-report-${format(new Date(creditData.startDate), "yyyy-MM-dd")}-to-${format(new Date(creditData.endDate), "yyyy-MM-dd")}.pdf`;
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

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 space-y-5 min-h-screen">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Debtors report
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {creditData
              ? `${format(new Date(creditData.startDate), "dd MMM yyyy")} — ${format(new Date(creditData.endDate), "dd MMM yyyy, HH:mm")}`
              : "Select a date range to generate a report"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={downloadCSV}
            disabled={downloadingCsv || !creditData}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            {downloadingCsv ? "Exporting…" : "CSV"}
          </Button>
          <Button
            onClick={generatePDF}
            disabled={downloadingPdf || !creditData}
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
            onSubmit={form.handleSubmit(onSubmit)}
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
              isPending={form.formState.isSubmitting}
              label="Apply filter"
              className="h-9 text-sm sm:w-auto w-full"
            />
          </form>
        </Form>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Total unpaid orders
          </p>
          <p className="text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {creditData?.total ?? 0}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              orders
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Outstanding balances
          </p>
        </div>
        <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Total unpaid amount
          </p>
          <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            TZS {fmt(creditData?.totalUnpaidAmount ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Amount yet to be collected
          </p>
        </div>
        <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Total paid amount
          </p>
          <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            TZS {fmt(creditData?.totalPaidAmount ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Partially collected payments
          </p>
        </div>
      </div>

      {/* ── Orders table ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Unpaid orders
          </p>
          {creditData && (
            <span className="text-xs text-muted-foreground">
              {creditData.unpaidOrders.length} orders
            </span>
          )}
        </div>
        <div className="bg-background border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b">
                  {[
                    "Order #",
                    "Order name",
                    "Date",
                    "Customer",
                    "Paid",
                    "Unpaid",
                    "Status",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap",
                        i >= 4 && i <= 5 ? "text-right" : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {creditData?.unpaidOrders &&
                creditData.unpaidOrders.length > 0 ? (
                  creditData.unpaidOrders.map((order) => (
                    <tr
                      key={order.orderId}
                      onClick={() => router.push(`/orders/${order.orderId}`)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium tabular-nums whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {order.orderName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {format(new Date(order.openedDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {order.customerName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        TZS {fmt(order.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                        TZS {fmt(order.unpaidAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                          Unpaid
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <ReceiptIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        No unpaid orders found for this period
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Hidden print template ── */}
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
                {location?.phone && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Tel: {location.phone}
                  </div>
                )}
                {location?.email && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {location.email}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 300,
                    color: PRIMARY,
                    letterSpacing: "0.04em",
                  }}
                >
                  CREDIT
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>REPORT</div>
              </div>
            </div>
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
              {creditData && (
                <>
                  <span>
                    Period:{" "}
                    <strong style={{ color: "#111827" }}>
                      {format(
                        new Date(creditData.startDate),
                        "MMM dd, yyyy HH:mm",
                      )}{" "}
                      —{" "}
                      {format(
                        new Date(creditData.endDate),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </strong>
                  </span>
                  <span>
                    Generated:{" "}
                    <strong style={{ color: "#111827" }}>
                      {format(new Date(), "MMM dd, yyyy HH:mm")}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {creditData && (
            <>
              {/* Summary strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 0,
                  margin: "24px 32px",
                  border: `1px solid ${SECONDARY}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {[
                  {
                    label: "Total unpaid orders",
                    value: `${creditData.total} orders`,
                    sub: "Outstanding balances",
                  },
                  {
                    label: "Total unpaid amount",
                    value: `TZS ${fmt(creditData.totalUnpaidAmount)}`,
                    sub: "Yet to be collected",
                  },
                  {
                    label: "Total paid amount",
                    value: `TZS ${fmt(creditData.totalPaidAmount)}`,
                    sub: "Partially collected",
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      borderLeft: i > 0 ? `1px solid ${SECONDARY}` : "none",
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
                      {c.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#111827",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {c.value}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}
                    >
                      {c.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Orders table */}
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
                    gridTemplateColumns: "140px 1fr 100px 1fr 120px 120px 80px",
                    backgroundColor: "#111827",
                    padding: "10px 16px",
                    gap: 8,
                  }}
                >
                  {[
                    "Order #",
                    "Order Name",
                    "Date",
                    "Customer",
                    "Paid",
                    "Unpaid",
                    "Status",
                  ].map((h, i) => (
                    <div
                      key={h}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#ffffff",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        textAlign: i >= 4 && i <= 5 ? "right" : "left",
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {creditData.unpaidOrders.map((order, i) => (
                  <div
                    key={order.orderId}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "140px 1fr 100px 1fr 120px 120px 80px",
                      padding: "10px 16px",
                      gap: 8,
                      borderBottom:
                        i < creditData.unpaidOrders.length - 1
                          ? `1px solid ${SECONDARY}`
                          : "none",
                      backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {order.orderNumber}
                    </div>
                    <div style={{ fontSize: 12, color: "#374151" }}>
                      {order.orderName || "—"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {format(new Date(order.openedDate), "dd MMM yyyy")}
                    </div>
                    <div style={{ fontSize: 12, color: "#374151" }}>
                      {order.customerName || "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#059669",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      TZS {fmt(order.paidAmount)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#dc2626",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      TZS {fmt(order.unpaidAmount)}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#92400e",
                          backgroundColor: "#fef3c7",
                          padding: "2px 7px",
                          borderRadius: 20,
                          border: "1px solid #fcd34d",
                        }}
                      >
                        Unpaid
                      </span>
                    </div>
                  </div>
                ))}
                {/* Totals row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 100px 1fr 120px 120px 80px",
                    padding: "12px 16px",
                    gap: 8,
                    backgroundColor: "#f3f4f6",
                    borderTop: "2px solid #111827",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#111827",
                      gridColumn: "span 4",
                    }}
                  >
                    Total ({creditData.unpaidOrders.length} orders)
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#059669",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    TZS {fmt(creditData.totalPaidAmount)}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#dc2626",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    TZS {fmt(creditData.totalUnpaidAmount)}
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
              This report is confidential and intended solely for the recipient.
              Any discrepancies must be reported to support@settlo.co.tz within
              14 days of issuance.
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
};

export default CreditReportDashboard;
