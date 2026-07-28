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
  SearchIcon,
  XIcon,
  ReceiptIcon,
  PercentIcon,
  RotateCcwIcon,
  TagIcon,
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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

const FormSchema = z.object({
  startDate: z.date({ required_error: "Start date and time are required." }),
  endDate: z.date({ required_error: "End date and time are required." }),
});

type SortKey =
  | "productName"
  | "quantity"
  | "netQuantity"
  | "netPrice"
  | "netCost"
  | "profit"
  | "margin"
  | "orderCount";
type SortDir = "asc" | "desc";

const PRIMARY = "#EB7F44";
const PRIMARY_SOFT = "#FDE9D9";

const fmt = (v: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v ?? 0);

const fmt2 = (v: number | null | undefined) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v ?? 0);

/* ── small row helper used in expanded panels ── */
const Row = ({
  l,
  v,
  cls,
  border,
}: {
  l: string;
  v: React.ReactNode;
  cls?: string;
  border?: boolean;
}) => (
  <div className={cn("flex justify-between", border && "border-t pt-1.5 mt-1")}>
    <span className="text-muted-foreground">{l}</span>
    <span className={cn("tabular-nums font-medium", cls)}>{v}</span>
  </div>
);

const SoldItemsDashboard = () => {
  const [startDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate] = useState(new Date());
  const [soldData, setSoldData] = useState<SoldItemsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [location, setLocation] = useState<Location>();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Search + sort
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("profit");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  // Filter + sort items
  const processedItems = useMemo(() => {
    if (!soldData?.items) return [];
    const term = searchTerm.trim().toLowerCase();

    let filtered = soldData.items;
    if (term) {
      filtered = filtered.filter(
        (i) =>
          i.productName?.toLowerCase().includes(term) ||
          i.variantName?.toLowerCase().includes(term) ||
          i.categoryName?.toLowerCase().includes(term),
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const av = (a[sortKey as keyof SoldItem] ?? 0) as any;
      const bv = (b[sortKey as keyof SoldItem] ?? 0) as any;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return sorted;
  }, [soldData, searchTerm, sortKey, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(processedItems.length / itemsPerPage),
  );
  const paginatedItems = useMemo(() => {
    const s = (currentPage - 1) * itemsPerPage;
    return processedItems.slice(s, s + itemsPerPage);
  }, [processedItems, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRows(new Set());
  }, [searchTerm, sortKey, sortDir, itemsPerPage]);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setExpandedRows(new Set());
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleRow = (i: number) => {
    setExpandedRows((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const convertToCSV = (data: SoldItemsReport) => {
    const headers = [
      "S/N",
      "Product Name",
      "Variant Name",
      "Category",
      "Orders",
      "Sold Qty",
      "Refunded Qty",
      "Net Quantity",
      "Avg Selling Price",
      "Unit Cost",
      "Gross Revenue",
      "Discount",
      "Net Revenue",
      "Net Cost",
      "Profit/Loss",
      "Margin %",
    ];
    return [
      headers.join(","),
      ...processedItems.map((item, idx) =>
        [
          idx + 1,
          `"${(item.productName || "").replace(/"/g, '""')}"`,
          `"${(item.variantName || "N/A").replace(/"/g, '""')}"`,
          `"${(item.categoryName || "N/A").replace(/"/g, '""')}"`,
          item.orderCount ?? 0,
          item.quantity ?? 0,
          item.refundedQuantity ?? 0,
          item.netQuantity ?? 0,
          item.averageSellingPrice ?? item.price ?? 0,
          item.cost ?? 0,
          item.grossRevenue ?? 0,
          item.discountIncludingOrderDiscountPortion ?? 0,
          item.netPrice ?? 0,
          item.netCost ?? 0,
          item.profit ?? 0,
          item.margin ?? 0,
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

      const A4_W = 210;
      const A4_H = 297;
      // Template handles its own padding — page margin can be 0
      const MARGIN = 0;
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

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );

  const totalProfit = soldData?.totalProfit ?? 0;
  const isProfit = totalProfit >= 0;
  const totalGross = soldData?.totalGrossRevenue ?? 0;
  const totalDiscount = soldData?.totalDiscount ?? 0;
  const totalRefunded = soldData?.totalRefundedAmount ?? 0;
  const averageMargin = soldData?.averageMargin ?? 0;
  const netQuantity = soldData?.netQuantity ?? soldData?.totalQuantity ?? 0;

  const SortHeader = ({
    label,
    sortableKey,
    align = "left",
  }: {
    label: string;
    sortableKey?: SortKey;
    align?: "left" | "right" | "center";
  }) => {
    const active = sortableKey && sortKey === sortableKey;
    return (
      <th
        className={cn(
          "px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground",
          `text-${align}`,
          sortableKey &&
            "cursor-pointer select-none hover:text-foreground transition-colors",
        )}
        onClick={() => sortableKey && toggleSort(sortableKey)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (
            <ChevronDownIcon
              className={cn(
                "h-3 w-3 transition-transform",
                sortDir === "asc" && "rotate-180",
              )}
            />
          )}
        </span>
      </th>
    );
  };

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
              {format(form.getValues("startDate"), "dd MMM yyyy HH:mm")} —{" "}
              {format(form.getValues("endDate"), "dd MMM yyyy HH:mm")}
              {soldData?.locationName && (
                <>
                  {" "}
                  <span className="mx-1">·</span> {soldData.locationName}
                </>
              )}
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

        {/* ── Top KPI cards (5 across) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Gross revenue */}
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-sky-500 rounded-l-xl" />
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Gross revenue
              </p>
              <ReceiptIcon className="h-3.5 w-3.5 text-sky-500" />
            </div>
            <p className="text-xl font-semibold tabular-nums text-sky-600 dark:text-sky-400">
              TZS {fmt(totalGross)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Before refunds/discounts
            </p>
          </div>

          {/* Net revenue */}
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 rounded-l-xl" />
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Net revenue
              </p>
              <TrendingUpIcon className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              TZS {fmt(soldData?.totalRevenue ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              After deductions
            </p>
          </div>

          {/* Profit / Loss */}
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl",
                isProfit ? "bg-emerald-500" : "bg-red-500",
              )}
            />
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {isProfit ? "Net profit" : "Net loss"}
              </p>
              {isProfit ? (
                <TrendingUpIcon className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDownIcon className="h-3.5 w-3.5 text-red-500" />
              )}
            </div>
            <p
              className={cn(
                "text-xl font-semibold tabular-nums",
                isProfit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              TZS {fmt(totalProfit)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Avg margin {fmt2(averageMargin)}%
            </p>
          </div>

          {/* Units */}
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-l-xl" />
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Net units
              </p>
              <PackageIcon className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <p className="text-xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
              {fmt(netQuantity)}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                units
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {soldData?.items?.length ?? 0} products
            </p>
          </div>

          {/* Refunds + discounts */}
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-xl" />
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Deductions
              </p>
              <PercentIcon className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <p className="text-xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              TZS {fmt(totalDiscount + totalRefunded)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5">
                <TagIcon className="h-2.5 w-2.5" /> {fmt(totalDiscount)}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <RotateCcwIcon className="h-2.5 w-2.5" /> {fmt(totalRefunded)}
              </span>
            </p>
          </div>
        </div>

        {/* ── Search + sort toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search product, variant, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-9 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
                aria-label="Clear search"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Sort by</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="border rounded-md px-2 py-1.5 text-xs bg-background"
            >
              <option value="productName">Name</option>
              <option value="netQuantity">Net qty</option>
              <option value="quantity">Sold qty</option>
              <option value="orderCount">Orders</option>
              <option value="netPrice">Net revenue</option>
              <option value="netCost">Net cost</option>
              <option value="profit">Profit</option>
              <option value="margin">Margin %</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as SortDir)}
              className="border rounded-md px-2 py-1.5 text-xs bg-background"
            >
              <option value="desc">Highest</option>
              <option value="asc">Lowest</option>
            </select>
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
                {processedItems.length} of {soldData.items.length} items
              </span>
            )}
          </div>
          <div className="bg-background border rounded-xl overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="px-3 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground text-center w-12">
                      S/N
                    </th>
                    <SortHeader label="Product" sortableKey="productName" />
                    <SortHeader
                      label="Orders"
                      sortableKey="orderCount"
                      align="center"
                    />
                    <SortHeader
                      label="Sold"
                      sortableKey="quantity"
                      align="center"
                    />
                    <SortHeader label="Refunded" align="center" />
                    <SortHeader
                      label="Net qty"
                      sortableKey="netQuantity"
                      align="center"
                    />
                    <SortHeader
                      label="Net cost"
                      sortableKey="netCost"
                      align="right"
                    />
                    <SortHeader
                      label="Net revenue"
                      sortableKey="netPrice"
                      align="right"
                    />
                    <SortHeader
                      label="Profit"
                      sortableKey="profit"
                      align="right"
                    />
                    <SortHeader
                      label="Margin"
                      sortableKey="margin"
                      align="right"
                    />
                    <th className="w-10 px-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedItems.map((item, index) => {
                    const gi = (currentPage - 1) * itemsPerPage + index;
                    const isOpen = expandedRows.has(gi);
                    const itemProfit = item.profit ?? 0;
                    const margin = item.margin ?? 0;
                    return (
                      <React.Fragment
                        key={`${item.productId ?? item.productName}-${gi}`}
                      >
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-3 text-center tabular-nums text-xs text-muted-foreground">
                            {gi + 1}
                          </td>
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
                            {item.orderCount ?? "—"}
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
                          <td className="px-4 py-3 text-right tabular-nums text-sm">
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium",
                                margin >= 50
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                  : margin >= 20
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                    : margin >= 0
                                      ? "bg-muted text-muted-foreground"
                                      : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                              )}
                            >
                              {fmt2(margin)}%
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <button
                              onClick={() => toggleRow(gi)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              aria-label="Toggle details"
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
                            <td colSpan={11} className="bg-muted/20 px-4 py-3">
                              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                                {/* Quantity */}
                                <div className="bg-background border rounded-lg p-3">
                                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                    Quantity
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <Row l="Orders" v={item.orderCount ?? 0} />
                                    <Row l="Sold" v={item.quantity ?? 0} />
                                    <Row
                                      l="Returned"
                                      v={item.refundedQuantity ?? 0}
                                      cls={
                                        item.refundedQuantity > 0
                                          ? "text-red-600"
                                          : ""
                                      }
                                    />
                                    <Row
                                      l="Net qty"
                                      v={item.netQuantity ?? 0}
                                      border
                                    />
                                  </div>
                                </div>
                                {/* Revenue */}
                                <div className="bg-background border rounded-lg p-3">
                                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                    Revenue
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <Row
                                      l="Avg selling price"
                                      v={`TZS ${fmt(item.averageSellingPrice ?? item.price ?? 0)}`}
                                    />
                                    <Row
                                      l="Gross revenue"
                                      v={`TZS ${fmt(item.grossRevenue ?? 0)}`}
                                    />
                                    {item.refundedPrice > 0 && (
                                      <Row
                                        l="Refunded"
                                        v={`TZS ${fmt(item.refundedPrice)}`}
                                        cls="text-red-600"
                                      />
                                    )}
                                    {item.discountIncludingOrderDiscountPortion >
                                      0 && (
                                      <Row
                                        l="Discount"
                                        v={`TZS ${fmt(item.discountIncludingOrderDiscountPortion)}`}
                                        cls="text-amber-600"
                                      />
                                    )}
                                    <Row
                                      l="Net revenue"
                                      v={`TZS ${fmt(item.netPrice ?? 0)}`}
                                      cls="text-emerald-600"
                                      border
                                    />
                                  </div>
                                </div>
                                {/* Cost */}
                                <div className="bg-background border rounded-lg p-3">
                                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                    Cost
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <Row
                                      l="Unit cost"
                                      v={`TZS ${fmt(item.cost ?? 0)}`}
                                    />
                                    {item.refundedCost > 0 && (
                                      <Row
                                        l="Refunded cost"
                                        v={`TZS ${fmt(item.refundedCost)}`}
                                        cls="text-amber-600"
                                      />
                                    )}
                                    <Row
                                      l="Net cost"
                                      v={`TZS ${fmt(item.netCost ?? 0)}`}
                                      cls="text-red-600"
                                      border
                                    />
                                  </div>
                                </div>
                                {/* Profitability */}
                                <div className="bg-background border rounded-lg p-3">
                                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                    Profitability
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <Row
                                      l={itemProfit >= 0 ? "Profit" : "Loss"}
                                      v={`TZS ${fmt(itemProfit)}`}
                                      cls={
                                        itemProfit >= 0
                                          ? "text-emerald-600"
                                          : "text-red-600"
                                      }
                                    />
                                    <Row
                                      l="Net profit"
                                      v={`TZS ${fmt(item.netProfit ?? 0)}`}
                                      cls={
                                        (item.netProfit ?? 0) >= 0
                                          ? "text-emerald-600"
                                          : "text-red-600"
                                      }
                                    />
                                    <Row
                                      l="Margin"
                                      v={`${fmt2(margin)}%`}
                                      cls={
                                        margin >= 20
                                          ? "text-emerald-600"
                                          : margin >= 0
                                            ? ""
                                            : "text-red-600"
                                      }
                                      border
                                    />
                                  </div>
                                </div>
                              </div>
                              {(item.earliestSoldDate ||
                                item.latestSoldDate) && (
                                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                  {item.earliestSoldDate && (
                                    <span>
                                      First sold:{" "}
                                      <strong className="text-foreground">
                                        {item.earliestSoldDate}
                                      </strong>
                                    </span>
                                  )}
                                  {item.latestSoldDate && (
                                    <span>
                                      Last sold:{" "}
                                      <strong className="text-foreground">
                                        {item.latestSoldDate}
                                      </strong>
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        <PackageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                        {searchTerm
                          ? "No items match your search."
                          : "No sold items found for this period."}
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* Totals footer (desktop) */}
                {soldData && processedItems.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/40 border-t-2 font-semibold">
                      <td className="px-3 py-3" />
                      <td className="px-4 py-3 text-xs uppercase tracking-widest">
                        Total ({processedItems.length})
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-sm">
                        {processedItems.reduce(
                          (a, i) => a + (i.orderCount ?? 0),
                          0,
                        )}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-sm">
                        {fmt(
                          processedItems.reduce(
                            (a, i) => a + (i.quantity ?? 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-sm">
                        {fmt(
                          processedItems.reduce(
                            (a, i) => a + (i.refundedQuantity ?? 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-sm">
                        {fmt(
                          processedItems.reduce(
                            (a, i) => a + (i.netQuantity ?? 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm text-red-600">
                        TZS{" "}
                        {fmt(
                          processedItems.reduce(
                            (a, i) => a + (i.netCost ?? 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm text-emerald-600">
                        TZS{" "}
                        {fmt(
                          processedItems.reduce(
                            (a, i) => a + (i.netPrice ?? 0),
                            0,
                          ),
                        )}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right tabular-nums text-sm",
                          processedItems.reduce(
                            (a, i) => a + (i.profit ?? 0),
                            0,
                          ) >= 0
                            ? "text-emerald-600"
                            : "text-red-600",
                        )}
                      >
                        TZS{" "}
                        {fmt(
                          processedItems.reduce(
                            (a, i) => a + (i.profit ?? 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">
                        avg {fmt2(averageMargin)}%
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y">
              {paginatedItems.map((item, index) => {
                const gi = (currentPage - 1) * itemsPerPage + index;
                const isOpen = expandedRows.has(gi);
                const itemProfit = item.profit ?? 0;
                const margin = item.margin ?? 0;
                return (
                  <div key={gi} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                            #{gi + 1}
                          </span>
                          <p className="font-medium text-sm truncate">
                            {item.productName}
                          </p>
                        </div>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.variantName}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {item.categoryName && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {item.categoryName}
                            </span>
                          )}
                          {item.orderCount != null && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {item.orderCount} order
                              {item.orderCount === 1 ? "" : "s"}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-[10px] font-medium px-2 py-0.5 rounded-full",
                              margin >= 50
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                : margin >= 20
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                  : margin >= 0
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                            )}
                          >
                            {fmt2(margin)}%
                          </span>
                        </div>
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
                        <Row
                          l="Sold / Returned"
                          v={`${item.quantity ?? 0} / ${item.refundedQuantity ?? 0}`}
                        />
                        <Row
                          l="Avg selling price"
                          v={`TZS ${fmt(item.averageSellingPrice ?? item.price ?? 0)}`}
                        />
                        <Row l="Unit cost" v={`TZS ${fmt(item.cost ?? 0)}`} />
                        <Row
                          l="Gross revenue"
                          v={`TZS ${fmt(item.grossRevenue ?? 0)}`}
                        />
                        <Row
                          l="Net cost"
                          v={`TZS ${fmt(item.netCost ?? 0)}`}
                          cls="text-red-600"
                        />
                        {item.refundedPrice > 0 && (
                          <Row
                            l="Refunded"
                            v={`TZS ${fmt(item.refundedPrice)}`}
                            cls="text-amber-600"
                          />
                        )}
                        {item.discountIncludingOrderDiscountPortion > 0 && (
                          <Row
                            l="Discount"
                            v={`TZS ${fmt(item.discountIncludingOrderDiscountPortion)}`}
                            cls="text-amber-600"
                          />
                        )}
                        {item.earliestSoldDate && (
                          <Row l="First sold" v={item.earliestSoldDate} />
                        )}
                        {item.latestSoldDate && (
                          <Row l="Last sold" v={item.latestSoldDate} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {paginatedItems.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <PackageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  {searchTerm
                    ? "No items match your search."
                    : "No sold items found."}
                </div>
              )}
            </div>

            {/* Pagination */}
            {soldData && processedItems.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Rows per page</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border rounded-md px-2 py-1 text-xs bg-background"
                  >
                    {[5, 10, 20, 50, 100].map((n) => (
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
                      processedItems.length,
                    )}{" "}
                    of {processedItems.length}
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
                  <span className="px-1">
                    {currentPage} / {totalPages}
                  </span>
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

        {/* ── Hidden print template — receipt-inspired design ── */}
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
              color: "#1f2937",
              padding: "44px 56px 32px",
            }}
          >
            {/* HEADER: title + business details right-aligned */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: PRIMARY,
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  SOLD ITEMS
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: 2,
                  }}
                >
                  {location?.name ?? soldData?.locationName ?? ""}
                </div>
                {location?.address && (
                  <div
                    style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}
                  >
                    {location.address}
                  </div>
                )}
                {location?.phone && (
                  <div
                    style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}
                  >
                    Mobile: {location.phone}
                  </div>
                )}
                {location?.email && (
                  <div
                    style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}
                  >
                    {location.email}
                  </div>
                )}
              </div>
            </div>

            {/* Thin divider */}
            <div
              style={{
                borderTop: "1px solid #d1d5db",
                margin: "24px 0 28px",
              }}
            />

            {/* META BLOCK: right-aligned key/value pairs */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ minWidth: 320 }}>
                {[
                  {
                    label: "Report Type:",
                    value: "Sold Items Summary",
                    bold: true,
                  },
                  {
                    label: "Period From:",
                    value: format(form.getValues("startDate"), "MMM d, yyyy"),
                  },
                  {
                    label: "Period To:",
                    value: format(form.getValues("endDate"), "MMM d, yyyy"),
                  },
                  {
                    label: "Generated:",
                    value: format(new Date(), "MMM d, yyyy"),
                  },
                  {
                    label: "Total Items:",
                    value: `${soldData?.items?.length ?? 0} products`,
                    bold: true,
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "5px 0",
                      fontSize: 11,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#1f2937" }}>
                      {row.label}
                    </span>
                    <span
                      style={{
                        color: "#1f2937",
                        fontWeight: row.bold ? 700 : 400,
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {soldData && (
              <>
                {/* ITEMS TABLE */}
                <div style={{ marginTop: 28 }}>
                  {/* Orange header band — with S/N column */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "36px 2.4fr 50px 50px 60px 90px 90px 90px",
                      backgroundColor: PRIMARY,
                      padding: "11px 16px",
                      gap: 8,
                      borderRadius: 2,
                    }}
                  >
                    {[
                      { label: "S/N", align: "center" },
                      { label: "ITEMS", align: "left" },
                      { label: "QTY", align: "center" },
                      { label: "RET", align: "center" },
                      { label: "NET QTY", align: "center" },
                      { label: "NET COST", align: "right" },
                      { label: "REVENUE", align: "right" },
                      { label: "PROFIT", align: "right" },
                    ].map((h) => (
                      <div
                        key={h.label}
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#ffffff",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          textAlign: h.align as any,
                        }}
                      >
                        {h.label}
                      </div>
                    ))}
                  </div>

                  {/* Rows — with S/N column */}
                  {soldData.items.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "36px 2.4fr 50px 50px 60px 90px 90px 90px",
                        padding: "12px 16px",
                        gap: 8,
                        borderBottom: "1px solid #f3f4f6",
                        alignItems: "center",
                      }}
                    >
                      {/* S/N column */}
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          fontWeight: 500,
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {i + 1}
                      </div>

                      {/* Product name + meta */}
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#1f2937",
                            fontWeight: 500,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.productName}
                          {item.variantName ? ` - ${item.variantName}` : ""}
                        </div>
                        {(item.categoryName || item.orderCount != null) && (
                          <div
                            style={{
                              fontSize: 9,
                              color: "#9ca3af",
                              marginTop: 2,
                            }}
                          >
                            {item.categoryName ?? ""}
                            {item.categoryName && item.orderCount != null
                              ? " · "
                              : ""}
                            {item.orderCount != null
                              ? `${item.orderCount} order${item.orderCount === 1 ? "" : "s"}`
                              : ""}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#4b5563",
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {item.quantity ?? 0}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color:
                            (item.refundedQuantity ?? 0) > 0
                              ? "#dc2626"
                              : "#d1d5db",
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {(item.refundedQuantity ?? 0) > 0
                          ? item.refundedQuantity
                          : "—"}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {item.netQuantity ?? 0}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#4b5563",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        TSh {fmt(item.netCost ?? 0)}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#4b5563",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        TSh {fmt(item.netPrice ?? 0)}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color:
                            (item.profit ?? 0) >= 0 ? "#1f2937" : "#dc2626",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        TSh {fmt(item.profit ?? 0)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* TOTALS STACK — right-aligned, receipt style */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 20,
                  }}
                >
                  <div style={{ minWidth: 320 }}>
                    {/* Gross revenue */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 16px",
                        fontSize: 11,
                        color: "#4b5563",
                      }}
                    >
                      <span>Gross Revenue:</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        TSh {fmt(totalGross)}
                      </span>
                    </div>
                    {/* Discounts */}
                    {totalDiscount > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "7px 16px",
                          fontSize: 11,
                          color: "#4b5563",
                        }}
                      >
                        <span>Less Discounts:</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          −TSh {fmt(totalDiscount)}
                        </span>
                      </div>
                    )}
                    {/* Refunds */}
                    {totalRefunded > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "7px 16px",
                          fontSize: 11,
                          color: "#4b5563",
                        }}
                      >
                        <span>Less Refunds:</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          −TSh {fmt(totalRefunded)}
                        </span>
                      </div>
                    )}
                    {/* Net revenue — bold */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "9px 16px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#1f2937",
                        borderTop: "1px solid #e5e7eb",
                        borderBottom: "1px solid #e5e7eb",
                        marginTop: 4,
                      }}
                    >
                      <span>Net Revenue:</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        TSh {fmt(soldData.totalRevenue ?? 0)}
                      </span>
                    </div>
                    {/* Cost of goods */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 16px",
                        fontSize: 11,
                        color: "#4b5563",
                      }}
                    >
                      <span>Cost of Goods Sold:</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        TSh {fmt(soldData.totalCost ?? soldData.netCost ?? 0)}
                      </span>
                    </div>
                    {/* Average margin */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 16px",
                        fontSize: 11,
                        color: "#4b5563",
                      }}
                    >
                      <span>Average Margin:</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {fmt2(averageMargin)}%
                      </span>
                    </div>
                    {/* Final highlight band — peach */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#1f2937",
                        backgroundColor: PRIMARY_SOFT,
                        marginTop: 8,
                        borderRadius: 2,
                      }}
                    >
                      <span>
                        {isProfit ? "Net Profit (TZS):" : "Net Loss (TZS):"}
                      </span>
                      <span
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          color: isProfit ? "#1f2937" : "#dc2626",
                        }}
                      >
                        TSh {fmt(totalProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* NOTES section */}
                <div style={{ marginTop: 32 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#1f2937",
                      marginBottom: 5,
                    }}
                  >
                    Notes / Terms
                  </div>
                  <div
                    style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.6 }}
                  >
                    Report generated on{" "}
                    {format(new Date(), "MMMM d, yyyy, h:mm a")}. Figures are
                    calculated from completed orders within the selected period,
                    net of returns and discounts.
                  </div>
                </div>
              </>
            )}

            {/* FOOTER */}
            <div
              style={{
                marginTop: 44,
                paddingTop: 20,
                borderTop: "1px solid #e5e7eb",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: 3,
                }}
              >
                Thank you for your business and continued support
              </div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>
                Powered by Settlo Technologies
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SoldItemsDashboard;
