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
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Location } from "@/types/location/type";
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";
import React, { useCallback, useEffect, useState } from "react";

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

const SoldItemsDashboard = () => {
  const [startDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
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

  useEffect(() => {
    getCurrentLocation().then(setLocation);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await SoldItemsReports(startDate, endDate);
        setSoldData(response);
      } catch (error) {
        console.error("Error fetching sold items report:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [startDate, endDate]);

  useEffect(() => {
    if (soldData?.items) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      setPaginatedItems(
        soldData.items.slice(startIndex, startIndex + itemsPerPage),
      );
    }
  }, [soldData, currentPage, itemsPerPage]);

  const totalPages = soldData
    ? Math.ceil(soldData.items.length / itemsPerPage)
    : 0;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setExpandedRows(new Set());
    }
  };

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

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
    const csvRows = [
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
    ];
    return csvRows.join("\n");
  };

  const downloadCSV = () => {
    if (!soldData) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "Please generate a report first.",
      });
      return;
    }
    setDownloadingCsv(true);
    try {
      const csvContent = convertToCSV(soldData);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const s = format(form.getValues("startDate"), "yyyy-MM-dd");
      const e = format(form.getValues("endDate"), "yyyy-MM-dd");
      const filename = `sold-items-report-${s}-to-${e}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "CSV Downloaded",
        description: `Report saved as ${filename}`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "CSV Generation Failed",
        description: "Please try again.",
      });
    } finally {
      setDownloadingCsv(false);
    }
  };

  const generatePDF = async () => {
    if (!soldData) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "Please generate a report first.",
      });
      return;
    }
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      doc.setFontSize(10);
      doc.setFont("Arial", "bold");
      doc.text("SOLD ITEMS REPORT", margin, 30);
      doc.setFont("Arial", "normal");
      const s = format(form.getValues("startDate"), "MMM dd, yyyy HH:mm");
      const e = format(form.getValues("endDate"), "MMM dd, yyyy HH:mm");
      doc.text(`Period: ${s} - ${e}`, margin, 40);
      doc.text(
        `Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`,
        margin,
        45,
      );
      if (location) {
        const right = pageWidth - margin;
        let y = 30;
        doc.setFont("Arial", "bold");
        doc.text(location.name, right, y, { align: "right" });
        y += 5;
        doc.setFont("Arial", "normal");
        doc
          .splitTextToSize(location.address || "", 150)
          .forEach((line: string) => {
            doc.text(line, right, y, { align: "right" });
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
      doc.rect(margin, 60, pageWidth - 2 * margin, 65, "F");
      doc.setFontSize(14);
      doc.setFont("Arial", "bold");
      doc.text("SUMMARY", margin + 5, 75);
      doc.setFontSize(12);
      doc.setFont("Arial", "normal");
      doc.text(
        `Total Items Sold: ${soldData.totalQuantity} units`,
        margin + 5,
        85,
      );
      doc.text(
        `Total Revenue: ${formatCurrency(soldData.totalRevenue || 0)}`,
        margin + 5,
        95,
      );
      doc.text(
        `Total Cost: ${formatCurrency(soldData.totalCost || 0)}`,
        margin + 5,
        105,
      );
      const pc = soldData.totalProfit >= 0 ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(pc[0], pc[1], pc[2]);
      doc.text(
        `Total ${soldData.totalProfit >= 0 ? "Profit" : "Loss"}: ${formatCurrency(soldData.totalProfit || 0)}`,
        margin + 5,
        115,
      );
      doc.setTextColor(0, 0, 0);
      let yPosition = 135;
      doc.setFontSize(12);
      doc.setFont("Arial", "bold");
      doc.text("Sold Items Details", margin, yPosition);
      yPosition += 10;
      doc.autoTable({
        startY: yPosition,
        head: [
          [
            "Product",
            "Variant",
            "Category",
            "Net Qty",
            "Revenue",
            "Cost",
            "Profit/Loss",
          ],
        ],
        body: soldData.items.map((item) => [
          item.productName,
          item.variantName || "N/A",
          item.categoryName || "N/A",
          `${item.netQuantity}`,
          formatCurrency(item.netPrice),
          formatCurrency(item.netCost),
          formatCurrency(item.profit),
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [235, 127, 68],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [253, 240, 232] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 18, halign: "center" },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 22, halign: "right" },
          6: { cellWidth: 25, halign: "right" },
        },
        didParseCell: (data: any) => {
          if (data.column.index === 6 && data.section === "body") {
            const pv = soldData.items[data.row.index]?.profit || 0;
            data.cell.styles.textColor = pv < 0 ? [239, 68, 68] : [34, 197, 94];
          }
        },
      });
      const filename = `sold-items-report-${format(form.getValues("startDate"), "yyyy-MM-dd")}-to-${format(form.getValues("endDate"), "yyyy-MM-dd")}.pdf`;
      doc.save(filename);
      toast({
        title: "PDF Downloaded",
        description: `Report saved as ${filename}`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "Please try again.",
      });
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
      title: "Uh oh! Something went wrong",
      description:
        typeof errors.message === "string" && errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
    });
  }, []);

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    try {
      setIsLoading(true);
      const response = await SoldItemsReports(values.startDate, values.endDate);
      setSoldData(response);
      setCurrentPage(1);
      setExpandedRows(new Set());
    } catch (error) {
      console.error("Error fetching sold items report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const DateTimePicker = ({ value, onChange, label }: DatePickerProps) => {
    function handleDateSelect(date: Date | undefined) {
      if (date) {
        const newDate = new Date(date);
        newDate.setHours(value.getHours());
        newDate.setMinutes(value.getMinutes());
        onChange(newDate);
      }
    }
    function handleTimeChange(type: "hour" | "minute", val: string) {
      const newDate = new Date(value);
      if (type === "hour") newDate.setHours(parseInt(val, 10));
      else newDate.setMinutes(parseInt(val, 10));
      onChange(newDate);
    }
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
                      .map((hour) => (
                        <Button
                          key={hour}
                          size="icon"
                          variant={
                            value?.getHours() === hour ? "default" : "ghost"
                          }
                          className="sm:w-full shrink-0 aspect-square text-xs"
                          onClick={() =>
                            handleTimeChange("hour", hour.toString())
                          }
                        >
                          {hour}
                        </Button>
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex sm:flex-col p-2">
                    {Array.from({ length: 12 }, (_, i) => i * 5).map(
                      (minute) => (
                        <Button
                          key={minute}
                          size="icon"
                          variant={
                            value?.getMinutes() === minute ? "default" : "ghost"
                          }
                          className="sm:w-full shrink-0 aspect-square text-xs"
                          onClick={() =>
                            handleTimeChange("minute", minute.toString())
                          }
                        >
                          {minute.toString().padStart(2, "0")}
                        </Button>
                      ),
                    )}
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  const totalProfit = soldData?.totalProfit ?? 0;
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
          {/* Net quantity */}
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
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

          {/* Total revenue */}
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Total revenue
            </p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              TZS {formatCurrency(soldData?.totalRevenue ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Net of returns & discounts
            </p>
          </div>

          {/* Profit / loss */}
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
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
              TZS {formatCurrency(totalProfit)}
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
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Sold
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Returned
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Net qty
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Net cost
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Profit / loss
                    </th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedItems.map((item, index) => {
                    const globalIndex =
                      (currentPage - 1) * itemsPerPage + index;
                    const isOpen = expandedRows.has(globalIndex);
                    const itemProfit = item.profit ?? 0;

                    return (
                      <React.Fragment key={globalIndex}>
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
                            TZS {formatCurrency(item.netCost ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-emerald-600 dark:text-emerald-400">
                            TZS {formatCurrency(item.netPrice ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">
                            <span
                              className={cn(
                                itemProfit >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              TZS {formatCurrency(itemProfit)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleRow(globalIndex)}
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

                        {/* Expanded detail row */}
                        {isOpen && (
                          <tr>
                            <td colSpan={8} className="bg-muted/20 px-4 py-3">
                              <div className="grid grid-cols-3 gap-3">
                                {/* Quantity details */}
                                <div className="bg-background border rounded-lg p-3">
                                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                    Quantity
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Sold
                                      </span>
                                      <span className="tabular-nums font-medium">
                                        {item.quantity ?? 0}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Returned
                                      </span>
                                      <span className="tabular-nums font-medium text-red-600">
                                        {item.refundedQuantity ?? 0}
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1.5">
                                      <span className="text-muted-foreground font-medium">
                                        Net qty
                                      </span>
                                      <span className="tabular-nums font-semibold">
                                        {item.netQuantity ?? 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Revenue details */}
                                <div className="bg-background border rounded-lg p-3">
                                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                    Revenue
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Unit price
                                      </span>
                                      <span className="tabular-nums font-medium">
                                        TZS {formatCurrency(item.price ?? 0)}
                                      </span>
                                    </div>
                                    {(item.refundedPrice ?? 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Refunded
                                        </span>
                                        <span className="tabular-nums font-medium text-amber-600">
                                          TZS{" "}
                                          {formatCurrency(item.refundedPrice)}
                                        </span>
                                      </div>
                                    )}
                                    {(item.discountIncludingOrderDiscountPortion ??
                                      0) > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Discount
                                        </span>
                                        <span className="tabular-nums font-medium text-amber-600">
                                          TZS{" "}
                                          {formatCurrency(
                                            item.discountIncludingOrderDiscountPortion,
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between border-t pt-1.5">
                                      <span className="text-muted-foreground font-medium">
                                        Net revenue
                                      </span>
                                      <span className="tabular-nums font-semibold text-emerald-600">
                                        TZS {formatCurrency(item.netPrice ?? 0)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Profitability details */}
                                <div className="bg-background border rounded-lg p-3">
                                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                    Profitability
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Unit cost
                                      </span>
                                      <span className="tabular-nums font-medium">
                                        TZS {formatCurrency(item.cost ?? 0)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Net cost
                                      </span>
                                      <span className="tabular-nums font-medium text-red-600">
                                        TZS {formatCurrency(item.netCost ?? 0)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1.5">
                                      <span className="text-muted-foreground font-medium">
                                        {itemProfit >= 0 ? "Profit" : "Loss"}
                                      </span>
                                      <span
                                        className={cn(
                                          "tabular-nums font-semibold",
                                          itemProfit >= 0
                                            ? "text-emerald-600"
                                            : "text-red-600",
                                        )}
                                      >
                                        TZS {formatCurrency(itemProfit)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
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
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                const isOpen = expandedRows.has(globalIndex);
                const itemProfit = item.profit ?? 0;

                return (
                  <div key={globalIndex} className="p-4">
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
                        onClick={() => toggleRow(globalIndex)}
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
                          {formatCurrency(item.netPrice ?? 0)}
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
                          {formatCurrency(itemProfit)}
                        </p>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 space-y-2">
                        <div className="bg-background border rounded-lg p-3 space-y-1.5 text-xs">
                          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
                            Details
                          </p>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Sold / Returned
                            </span>
                            <span className="tabular-nums">
                              {item.quantity ?? 0} /{" "}
                              <span className="text-red-500">
                                {item.refundedQuantity ?? 0}
                              </span>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Unit cost
                            </span>
                            <span className="tabular-nums">
                              TZS {formatCurrency(item.cost ?? 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Net cost
                            </span>
                            <span className="tabular-nums text-red-600">
                              TZS {formatCurrency(item.netCost ?? 0)}
                            </span>
                          </div>
                          {(item.refundedPrice ?? 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Refunded amount
                              </span>
                              <span className="tabular-nums text-amber-600">
                                TZS {formatCurrency(item.refundedPrice)}
                              </span>
                            </div>
                          )}
                          {(item.discountIncludingOrderDiscountPortion ?? 0) >
                            0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Discount
                              </span>
                              <span className="tabular-nums text-amber-600">
                                TZS{" "}
                                {formatCurrency(
                                  item.discountIncludingOrderDiscountPortion,
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {paginatedItems.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <PackageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  No sold items found for this period.
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
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
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
      </div>
    </TooltipProvider>
  );
};

export default SoldItemsDashboard;
