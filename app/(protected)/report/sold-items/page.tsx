"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DownloadIcon,
  PackageIcon,
  TrendingUpIcon,
  TrendingDownIcon,
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
import { SoldItemsReports } from "@/lib/actions/product-actions";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { z } from "zod";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SoldItem, SoldItemsReport } from "@/types/product/type";
import SubmitButton from "@/components/widgets/submit-button";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Location } from "@/types/location/type";
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

const FormSchema = z.object({
  startDate: z.date({ required_error: "Start date and time are required." }),
  endDate: z.date({ required_error: "End date and time are required." }),
  limit: z.number().optional(),
});

const PRIMARY = "#EB7F44";
const SECONDARY = "#EAEAE5";
const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

const SoldItemsDashboard = () => {
  const [startDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate] = useState(new Date());
  const [soldData, setSoldData] = useState<SoldItemsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 5;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedItems, setPaginatedItems] = useState<SoldItem[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [location, setLocation] = useState<Location>();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentLocation().then(setLocation);
  }, []);

  useEffect(() => {
    SoldItemsReports(startDate, endDate)
      .then(setSoldData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [startDate, endDate]);

  useEffect(() => {
    if (soldData?.items) {
      const s = (currentPage - 1) * itemsPerPage;
      setPaginatedItems(soldData.items.slice(s, s + itemsPerPage));
    }
  }, [soldData, currentPage, itemsPerPage]);

  const totalPages = soldData
    ? Math.ceil(soldData.items.length / itemsPerPage)
    : 0;

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setExpandedRows(new Set());
    }
  };

  const toggleRow = (i: number) => {
    setExpandedRows((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const convertToCSV = (data: SoldItemsReport) => {
    const headers = [
      "Product Name",
      "Variant Name",
      "Category",
      "Net Quantity Sold",
      "Total Revenue",
      "Net Cost",
      "Profit/Loss",
    ];
    return [
      headers.join(","),
      ...data.items.map((item) =>
        [
          `"${item.productName.replace(/"/g, '""')}"`,
          `"${(item.variantName || "N/A").replace(/"/g, '""')}"`,
          `"${(item.categoryName || "N/A").replace(/"/g, '""')}"`,
          item.netQuantity,
          item.netPrice,
          item.netCost,
          item.profit,
        ].join(","),
      ),
    ].join("\n");
  };

  const downloadCSV = () => {
    if (!soldData) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    setDownloadingCsv(true);
    try {
      const blob = new Blob([convertToCSV(soldData)], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const s = format(form.getValues("startDate"), "yyyy-MM-dd");
      const e = format(form.getValues("endDate"), "yyyy-MM-dd");
      const filename = `sold-items-report-${s}-to-${e}.csv`;
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
    if (!el || !soldData) {
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
      const filename = `sold-items-report-${format(form.getValues("startDate"), "yyyy-MM-dd")}-to-${format(form.getValues("endDate"), "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);
      toast({ title: "PDF Downloaded", description: `Saved as ${filename}` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "PDF Generation Failed" });
    } finally {
      setDownloadingPdf(false);
    }
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
      limit,
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
      const response = await SoldItemsReports(values.startDate, values.endDate);
      setSoldData(response);
      setCurrentPage(1);
      setExpandedRows(new Set());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
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

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );

  const totalProfit = soldData?.netProfit ?? 0;
  const isProfit = totalProfit >= 0;

  return (
    <TooltipProvider>
      <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 space-y-5 min-h-screen">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Sold items report
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(form.getValues("startDate"), "dd MMM yyyy")} —{" "}
              {format(form.getValues("endDate"), "dd MMM yyyy HH:mm")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={downloadCSV}
              disabled={downloadingCsv || !soldData}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              {downloadingCsv ? "Exporting…" : "CSV"}
            </Button>
            <Button
              onClick={generatePDF}
              disabled={downloadingPdf || !soldData}
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
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-l-xl" />
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Net units sold
            </p>
            <p className="text-2xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
              {soldData?.totalQuantity ?? 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                units
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {soldData?.items?.length ?? 0} products
            </p>
          </div>
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 rounded-l-xl" />
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Total revenue
            </p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              TZS {fmt(soldData?.totalRevenue ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Net of returns & discounts
            </p>
          </div>
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl",
                isProfit ? "bg-emerald-500" : "bg-red-500",
              )}
            />
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              {isProfit ? "Total profit" : "Total loss"}
            </p>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                isProfit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              TZS {fmt(totalProfit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {isProfit ? (
                <>
                  <TrendingUpIcon className="h-3 w-3 text-emerald-500" />
                  Revenue minus cost of goods
                </>
              ) : (
                <>
                  <TrendingDownIcon className="h-3 w-3 text-red-500" />
                  Revenue minus cost of goods
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── Items table ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Items breakdown
            </p>
            {soldData && (
              <span className="text-xs text-muted-foreground">
                {soldData.items.length} items total
              </span>
            )}
          </div>
          <div className="bg-background border rounded-xl overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    {[
                      ["Product", "left"],
                      ["Sold", "center"],
                      ["Returned", "center"],
                      ["Net qty", "center"],
                      ["Net cost", "right"],
                      ["Revenue", "right"],
                      ["Profit / loss", "right"],
                      ["", ""],
                    ].map(([h, align]) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground",
                          h ? `text-${align}` : "w-10",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedItems.map((item, index) => {
                    const gi = (currentPage - 1) * itemsPerPage + index;
                    const isOpen = expandedRows.has(gi);
                    const itemProfit = item.netProfit ?? 0;
                    return (
                      <React.Fragment key={gi}>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm leading-tight">
                              {item.productName}
                            </p>
                            {item.variantName && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.variantName}
                              </p>
                            )}
                            {item.categoryName && (
                              <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {item.categoryName}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums text-sm">
                            {item.quantity ?? 0}
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums text-sm">
                            {(item.refundedQuantity ?? 0) > 0 ? (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {item.refundedQuantity}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums text-sm font-medium">
                            {item.netQuantity ?? 0}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-red-600 dark:text-red-400">
                            TZS {fmt(item.netCost ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-emerald-600 dark:text-emerald-400">
                            TZS {fmt(item.netPrice ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">
                            <span
                              className={cn(
                                itemProfit >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              TZS {fmt(itemProfit)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleRow(gi)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <ChevronDownIcon
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  isOpen && "rotate-180",
                                )}
                              />
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={8} className="bg-muted/20 px-4 py-3">
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  {
                                    title: "Quantity",
                                    rows: [
                                      { l: "Sold", v: item.quantity ?? 0 },
                                      {
                                        l: "Returned",
                                        v: item.refundedQuantity ?? 0,
                                        cls: "text-red-600",
                                      },
                                      {
                                        l: "Net qty",
                                        v: item.netQuantity ?? 0,
                                        border: true,
                                      },
                                    ],
                                  },
                                  {
                                    title: "Revenue",
                                    rows: [
                                      {
                                        l: "Unit price",
                                        v: `TZS ${fmt(item.price ?? 0)}`,
                                      },
                                      ...(item.refundedPrice > 0
                                        ? [
                                            {
                                              l: "Refunded",
                                              v: `TZS ${fmt(item.refundedPrice)}`,
                                              cls: "text-amber-600",
                                            },
                                          ]
                                        : []),
                                      ...(item.discountIncludingOrderDiscountPortion >
                                      0
                                        ? [
                                            {
                                              l: "Discount",
                                              v: `TZS ${fmt(item.discountIncludingOrderDiscountPortion)}`,
                                              cls: "text-amber-600",
                                            },
                                          ]
                                        : []),
                                      {
                                        l: "Net revenue",
                                        v: `TZS ${fmt(item.netPrice ?? 0)}`,
                                        cls: "text-emerald-600",
                                        border: true,
                                      },
                                    ],
                                  },
                                  {
                                    title: "Profitability",
                                    rows: [
                                      {
                                        l: "Unit cost",
                                        v: `TZS ${fmt(item.cost ?? 0)}`,
                                      },
                                      {
                                        l: "Net cost",
                                        v: `TZS ${fmt(item.netCost ?? 0)}`,
                                        cls: "text-red-600",
                                      },
                                      {
                                        l: itemProfit >= 0 ? "Profit" : "Loss",
                                        v: `TZS ${fmt(itemProfit)}`,
                                        cls:
                                          itemProfit >= 0
                                            ? "text-emerald-600"
                                            : "text-red-600",
                                        border: true,
                                      },
                                    ],
                                  },
                                ].map((section) => (
                                  <div
                                    key={section.title}
                                    className="bg-background border rounded-lg p-3"
                                  >
                                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                      {section.title}
                                    </p>
                                    <div className="space-y-1.5 text-xs">
                                      {section.rows.map((row: any) => (
                                        <div
                                          key={row.l}
                                          className={cn(
                                            "flex justify-between",
                                            row.border && "border-t pt-1.5",
                                          )}
                                        >
                                          <span className="text-muted-foreground">
                                            {row.l}
                                          </span>
                                          <span
                                            className={cn(
                                              "tabular-nums font-medium",
                                              row.cls,
                                            )}
                                          >
                                            {row.v}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        <PackageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                        No sold items found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y">
              {paginatedItems.map((item, index) => {
                const gi = (currentPage - 1) * itemsPerPage + index;
                const isOpen = expandedRows.has(gi);
                const itemProfit = item.profit ?? 0;
                return (
                  <div key={gi} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.variantName}
                          </p>
                        )}
                        {item.categoryName && (
                          <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {item.categoryName}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleRow(gi)}
                        className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors shrink-0"
                      >
                        <ChevronDownIcon
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center bg-muted/40 rounded-lg p-2.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          Net qty
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {item.netQuantity ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          Revenue
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-emerald-600">
                          {fmt(item.netPrice ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          {itemProfit >= 0 ? "Profit" : "Loss"}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            itemProfit >= 0
                              ? "text-emerald-600"
                              : "text-red-600",
                          )}
                        >
                          {fmt(itemProfit)}
                        </p>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-3 bg-background border rounded-lg p-3 space-y-1.5 text-xs">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
                          Details
                        </p>
                        {[
                          {
                            l: "Sold / Returned",
                            v: `${item.quantity ?? 0} / ${item.refundedQuantity ?? 0}`,
                          },
                          { l: "Unit cost", v: `TZS ${fmt(item.cost ?? 0)}` },
                          {
                            l: "Net cost",
                            v: `TZS ${fmt(item.netCost ?? 0)}`,
                            cls: "text-red-600",
                          },
                          ...(item.refundedPrice > 0
                            ? [
                                {
                                  l: "Refunded",
                                  v: `TZS ${fmt(item.refundedPrice)}`,
                                  cls: "text-amber-600",
                                },
                              ]
                            : []),
                          ...(item.discountIncludingOrderDiscountPortion > 0
                            ? [
                                {
                                  l: "Discount",
                                  v: `TZS ${fmt(item.discountIncludingOrderDiscountPortion)}`,
                                  cls: "text-amber-600",
                                },
                              ]
                            : []),
                        ].map((row: any) => (
                          <div key={row.l} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {row.l}
                            </span>
                            <span className={cn("tabular-nums", row.cls)}>
                              {row.v}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {paginatedItems.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <PackageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  No sold items found.
                </div>
              )}
            </div>

            {/* Pagination */}
            {soldData && soldData.items.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Rows per page</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                      setExpandedRows(new Set());
                    }}
                    className="border rounded-md px-2 py-1 text-xs bg-background"
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {(currentPage - 1) * itemsPerPage + 1}–
                    {Math.min(
                      currentPage * itemsPerPage,
                      soldData.items.length,
                    )}{" "}
                    of {soldData.items.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
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
                    SOLD ITEMS
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
                <span>
                  Period:{" "}
                  <strong style={{ color: "#111827" }}>
                    {format(form.getValues("startDate"), "MMM dd, yyyy HH:mm")}{" "}
                    — {format(form.getValues("endDate"), "MMM dd, yyyy HH:mm")}
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

            {soldData && (
              <>
                {/* Summary strip */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    margin: "24px 32px",
                    border: `1px solid ${SECONDARY}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {[
                    {
                      label: "Net units sold",
                      value: `${soldData.totalQuantity} units`,
                      sub: `Across ${soldData.items.length} products`,
                    },
                    {
                      label: "Total revenue",
                      value: `TZS ${fmt(soldData.totalRevenue ?? 0)}`,
                      sub: "Net of returns & discounts",
                    },
                    {
                      label: isProfit ? "Total profit" : "Total loss",
                      value: `TZS ${fmt(totalProfit)}`,
                      sub: "Revenue minus cost of goods",
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

                {/* Items table */}
                <div
                  style={{
                    margin: "0 32px 32px",
                    border: `1px solid ${SECONDARY}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "2fr 60px 70px 60px 110px 110px 110px",
                      backgroundColor: "#111827",
                      padding: "10px 16px",
                      gap: 8,
                    }}
                  >
                    {[
                      "Product",
                      "Sold",
                      "Returned",
                      "Net Qty",
                      "Net Cost",
                      "Revenue",
                      "Profit/Loss",
                    ].map((h, i) => (
                      <div
                        key={h}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#ffffff",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          textAlign: i === 0 ? "left" : "right",
                        }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  {soldData.items.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "2fr 60px 70px 60px 110px 110px 110px",
                        padding: "10px 16px",
                        gap: 8,
                        borderBottom:
                          i < soldData.items.length - 1
                            ? `1px solid ${SECONDARY}`
                            : "none",
                        backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {item.productName}
                        </div>
                        {item.variantName && (
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
                            {item.variantName}
                          </div>
                        )}
                        {item.categoryName && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "#9ca3af",
                              marginTop: 2,
                            }}
                          >
                            {item.categoryName}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#374151",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {item.quantity ?? 0}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color:
                            item.refundedQuantity > 0 ? "#dc2626" : "#9ca3af",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {item.refundedQuantity > 0
                          ? item.refundedQuantity
                          : "—"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#111827",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {item.netQuantity ?? 0}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#dc2626",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        TZS {fmt(item.netCost ?? 0)}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#059669",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        TZS {fmt(item.netPrice ?? 0)}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            (item.profit ?? 0) >= 0 ? "#059669" : "#dc2626",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        TZS {fmt(item.profit ?? 0)}
                      </div>
                    </div>
                  ))}
                  {/* Totals row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "2fr 60px 70px 60px 110px 110px 110px",
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
                      }}
                    >
                      Total ({soldData.items.length} items)
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#111827",
                        textAlign: "right",
                      }}
                    >
                      {soldData.totalQuantity}
                    </div>
                    <div />
                    <div />
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#dc2626",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      TZS {fmt(soldData.totalCost ?? 0)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#059669",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      TZS {fmt(soldData.totalRevenue ?? 0)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isProfit ? "#059669" : "#dc2626",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      TZS {fmt(totalProfit)}
                    </div>
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
    </TooltipProvider>
  );
};

export default SoldItemsDashboard;
