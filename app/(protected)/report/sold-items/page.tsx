"use client";
import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DownloadIcon,
  PackageIcon,
  TrendingUpIcon,
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
import Loading from "@/app/loading";

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [paginatedItems, setPaginatedItems] = useState<SoldItem[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [location, setLocation] = useState<Location>();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      const location = await getCurrentLocation();
      setLocation(location);
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    const fetchingSoldItems = async () => {
      try {
        const response = await SoldItemsReports(startDate, endDate);
        setSoldData(response);
      } catch (error) {
        console.error("Error fetching sold items report:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchingSoldItems();
  }, [startDate, endDate]);

  useEffect(() => {
    if (soldData && soldData.items) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setPaginatedItems(soldData.items.slice(startIndex, endIndex));
    }
  }, [soldData, currentPage, itemsPerPage]);

  const totalPages = soldData
    ? Math.ceil(soldData.items.length / itemsPerPage)
    : 0;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
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
        description: "Please generate a report first before downloading CSV.",
      });
      return;
    }

    setDownloadingCsv(true);

    try {
      const csvContent = convertToCSV(soldData);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const startDateFormatted = format(
        form.getValues("startDate"),
        "yyyy-MM-dd",
      );
      const endDateFormatted = format(form.getValues("endDate"), "yyyy-MM-dd");
      const filename = `sold-items-report-${startDateFormatted}-to-${endDateFormatted}.csv`;

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
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast({
        variant: "destructive",
        title: "CSV Generation Failed",
        description: "There was an error generating the CSV. Please try again.",
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
        description: "Please generate a report first before downloading PDF.",
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

      doc.setFontSize(10);
      doc.setFont("Arial", "normal");
      const startDateFormatted = format(
        form.getValues("startDate"),
        "MMM dd, yyyy HH:mm",
      );
      const endDateFormatted = format(
        form.getValues("endDate"),
        "MMM dd, yyyy HH:mm",
      );
      const dateRange = `${startDateFormatted} - ${endDateFormatted}`;
      doc.text(`Period: ${dateRange}`, margin, 40);
      doc.text(
        `Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`,
        margin,
        45,
      );

      if (location) {
        doc.setFontSize(10);
        doc.setFont("Arial", "normal");
        const rightMargin = pageWidth - margin;
        let yPos = 30;

        doc.setFont("Arial", "bold");
        doc.text(location.name, rightMargin, yPos, { align: "right" });
        yPos += 5;

        doc.setFont("Arial", "normal");
        const addressLines = doc.splitTextToSize(location.address || "", 150);
        addressLines.forEach((line: string) => {
          doc.text(line, rightMargin, yPos, { align: "right" });
          yPos += 5;
        });

        if (location.phone) {
          doc.text(`Phone: ${location.phone}`, rightMargin, yPos, {
            align: "right",
          });
          yPos += 5;
        }

        if (location.email) {
          doc.text(`Email: ${location.email}`, rightMargin, yPos, {
            align: "right",
          });
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

      const profitColor =
        soldData.totalProfit >= 0 ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
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

      const tableData = soldData.items.map((item) => [
        item.productName,
        item.variantName || "N/A",
        item.categoryName || "N/A",
        `${item.netQuantity}`,
        formatCurrency(item.netPrice),
        formatCurrency(item.netCost),
        formatCurrency(item.profit),
      ]);

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
        body: tableData,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [20, 184, 166],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [240, 253, 250],
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 18, halign: "center" },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 22, halign: "right" },
          6: { cellWidth: 25, halign: "right" },
        },
        didParseCell: function (data: any) {
          if (data.column.index === 6 && data.section === "body") {
            const profitValue = soldData.items[data.row.index]?.profit || 0;
            if (profitValue < 0) {
              data.cell.styles.textColor = [239, 68, 68];
            } else {
              data.cell.styles.textColor = [34, 197, 94];
            }
          }
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;
      const pageHeight = doc.internal.pageSize.height;
      const footerY = pageHeight - 20;

      if (finalY > pageHeight - 60) {
        doc.addPage();
      }

      doc.setFontSize(8);
      doc.setTextColor(32, 32, 32);
      const disclaimerText =
        "This report is confidential and intended solely for the recipient. Any discrepancies must be reported to support@setllo.co.tz within 14 days of issuance";

      const maxWidth = pageWidth - 2 * margin;
      const disclaimerLines = doc.splitTextToSize(disclaimerText, maxWidth);

      const lineHeight = 3;
      const disclaimerHeight = disclaimerLines.length * lineHeight;
      const poweredByHeight = lineHeight;
      const totalFooterHeight = disclaimerHeight + poweredByHeight + 2;

      const disclaimerStartY = footerY - totalFooterHeight + lineHeight;

      const borderPadding = 3;
      const borderX = margin - borderPadding;
      const borderY = disclaimerStartY - lineHeight - borderPadding;
      const borderWidth = pageWidth - 2 * margin + 2 * borderPadding;
      const borderHeight = totalFooterHeight + 2 * borderPadding;

      doc.setDrawColor(32, 32, 32);
      doc.setLineWidth(0.3);
      doc.rect(borderX, borderY, borderWidth, borderHeight, "S");

      disclaimerLines.forEach((line: string, index: number) => {
        const textWidth = doc.getTextWidth(line);
        const centerX = (pageWidth - textWidth) / 2;
        doc.text(line, centerX, disclaimerStartY + index * lineHeight);
      });

      const poweredByText = "Powered by Settlo";
      const poweredByWidth = doc.getTextWidth(poweredByText);
      const poweredByCenterX = (pageWidth - poweredByWidth) / 2;
      const poweredByY = disclaimerStartY + disclaimerHeight + 2;

      doc.text(poweredByText, poweredByCenterX, poweredByY);

      const filename = `sold-items-report-${format(form.getValues("startDate"), "yyyy-MM-dd")}-to-${format(form.getValues("endDate"), "yyyy-MM-dd")}.pdf`;

      doc.save(filename);

      toast({
        title: "PDF Downloaded",
        description: `Report saved as ${filename}`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
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
      limit: limit,
    },
  });

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.log("Errors during form submission:", errors);
    toast({
      variant: "destructive",
      title: "Uh oh! something went wrong",
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
    } catch (error) {
      console.error("Error fetching stock history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat().format(value) || 0;
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
      if (type === "hour") {
        newDate.setHours(parseInt(val, 10));
      } else if (type === "minute") {
        newDate.setMinutes(parseInt(val, 10));
      }
      onChange(newDate);
    }

    return (
      <div className="flex flex-col space-y-2">
        <span className="text-sm font-medium">{label}</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? (
                format(value, "MM/dd/yyyy HH:mm")
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
                            value && value.getHours() === hour
                              ? "default"
                              : "ghost"
                          }
                          className="sm:w-full shrink-0 aspect-square"
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
                            value && value.getMinutes() === minute
                              ? "default"
                              : "ghost"
                          }
                          className="sm:w-full shrink-0 aspect-square"
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen mt-16">
        <div className="w-full flex justify-end mb-4">
          <div className="w-full md:w-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col w-full md:w-auto">
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          label="Start Date"
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col w-full md:w-auto">
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          label="End Date"
                        />
                      </FormItem>
                    )}
                  />
                  <div className="w-full md:w-auto">
                    <SubmitButton
                      isPending={form.formState.isSubmitting}
                      label="Filter"
                      margin={6}
                      className="w-full md:w-auto"
                    />
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Updated Summary Card with Grouped Metrics */}
        <Card className="shadow-md w-full">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex flex-col lg:flex-row items-center justify-between">
              <div className="flex items-center">
                <TrendingUpIcon className="mr-2 h-5 w-5 text-teal-600" />
                Sold Items Summary
              </div>
              <div className="flex gap-2 mt-2 lg:mt-0">
                <Button
                  onClick={downloadCSV}
                  disabled={downloadingCsv || !soldData}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {downloadingCsv ? "Generating..." : "CSV"}
                </Button>
                <Button
                  onClick={generatePDF}
                  disabled={downloadingPdf || !soldData}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {downloadingPdf ? "Generating..." : "PDF"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {/* Key Metrics - Always Visible */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Net Quantity
                  </p>
                  <PackageIcon className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {soldData?.totalQuantity || 0}
                  <span className="text-sm font-normal text-slate-500 ml-1">
                    units
                  </span>
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Total Revenue
                  </p>
                  <TrendingUpIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 mt-2">
                  {formatCurrency(soldData?.totalRevenue ?? 0)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    {(soldData?.totalProfit ?? 0) < 0
                      ? "Total Loss"
                      : "Total Profit"}
                  </p>
                  <div
                    className={`h-4 w-4 rounded-full ${(soldData?.totalProfit ?? 0) < 0 ? "bg-red-500" : "bg-emerald-500"}`}
                  />
                </div>
                <p
                  className={`text-2xl font-bold mt-2 ${(soldData?.totalProfit ?? 0) < 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {formatCurrency(soldData?.totalProfit ?? 0)}
                </p>
              </div>
            </div>

            {/* Expandable Detailed Metrics */}
            <div className="border-t pt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMetrics(!showAllMetrics)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
              >
                <span>
                  {showAllMetrics
                    ? "Hide Detailed Metrics"
                    : "Show Detailed Metrics"}
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${showAllMetrics ? "rotate-180" : ""}`}
                />
              </Button>

              {showAllMetrics && (
                <div className="space-y-6">
                  {/* Quantity Metrics Group */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 border-b pb-2">
                      Quantity Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-slate-600">Items Sold</p>
                        <p className="font-medium">
                          {soldData?.totalQuantity || 0} units
                        </p>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-slate-600">Net Quantity</p>
                        <p className="font-medium">
                          {soldData?.totalQuantity || 0} units
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cost Metrics Group */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 border-b pb-2">
                      Cost Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-slate-600">
                          Total Cost of Goods
                        </p>
                        <p className="font-medium text-red-600">
                          {formatCurrency(soldData?.totalCost ?? 0)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-slate-600">
                          Average Unit Cost
                        </p>
                        <p className="font-medium text-red-600">
                          {soldData?.totalQuantity
                            ? formatCurrency(
                                (soldData.totalCost ?? 0) /
                                  soldData.totalQuantity,
                              )
                            : 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Metrics Group */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 border-b pb-2">
                      Revenue Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-slate-600">Total Revenue</p>
                        <p className="font-medium text-emerald-600">
                          {formatCurrency(soldData?.totalRevenue ?? 0)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-slate-600">
                          Average Unit Price
                        </p>
                        <p className="font-medium text-emerald-600">
                          {soldData?.totalQuantity
                            ? formatCurrency(
                                (soldData.totalRevenue ?? 0) /
                                  soldData.totalQuantity,
                              )
                            : 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center">
              <PackageIcon className="mr-2 h-5 w-5 text-teal-600" />
              List of Sold Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 divide-y">
                {paginatedItems.map((item: SoldItem, index: number) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    {/* Mobile: Compact view with expand */}
                    <div className="md:hidden">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-16 w-16 min-w-16 bg-slate-200 rounded-md flex items-center justify-center">
                          {!item.imageUrl && (
                            <PackageIcon className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">
                            {item.productName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {item.variantName}
                          </p>
                          <p className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded inline-block mt-1">
                            {item.categoryName}
                          </p>
                        </div>
                      </div>

                      {/* Key metrics always visible on mobile */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Net Qty</p>
                          <p className="font-semibold text-sm">
                            {item.netQuantity || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Revenue</p>
                          <p className="font-semibold text-sm text-emerald-600">
                            {formatCurrency(item.netPrice)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">
                            {item.profit < 0 ? "Loss" : "Profit"}
                          </p>
                          <p
                            className={`font-semibold text-sm ${
                              (item?.profit ?? 0) < 0
                                ? "text-red-600"
                                : "text-purple-600"
                            }`}
                          >
                            {formatCurrency(item.profit)}
                          </p>
                        </div>
                      </div>

                      {/* Expandable details */}
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 py-2"
                      >
                        <span>
                          {expandedItems.has(index)
                            ? "Hide Details"
                            : "Show Details"}
                        </span>
                        <ChevronDownIcon
                          className={`h-4 w-4 transition-transform ${
                            expandedItems.has(index) ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expandedItems.has(index) && (
                        <div className="mt-3 space-y-3 border-t pt-3">
                          {/* Quantity Section */}
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-blue-900 mb-2">
                              Quantity Details
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <p className="text-xs text-slate-600">Sold</p>
                                <p className="font-semibold text-sm">
                                  {item.quantity || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">
                                  Returned
                                </p>
                                <p className="font-semibold text-sm">
                                  {item.refundedQuantity || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">
                                  Net Qty
                                </p>
                                <p className="font-semibold text-sm">
                                  {item.netQuantity || 0}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Cost Section */}
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-orange-900 mb-2">
                              Cost Details
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-slate-600">
                                  Unit Cost
                                </p>
                                <p className="font-semibold text-sm text-red-600">
                                  {formatCurrency(item.cost || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">
                                  Net Cost
                                </p>
                                <p className="font-semibold text-sm text-red-600">
                                  {formatCurrency(item.netCost)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Revenue Section */}
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-green-900 mb-2">
                              Revenue Details
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-slate-600">Price</p>
                                <p className="font-semibold text-sm text-emerald-600">
                                  {formatCurrency(item.price || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">
                                  Net Price
                                </p>
                                <p className="font-semibold text-sm text-emerald-600">
                                  {formatCurrency(item.netPrice)}
                                </p>
                              </div>
                            </div>
                            {item.refundedPrice > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-600">
                                  Refunded Amount
                                </p>
                                <p className="font-semibold text-sm text-amber-600">
                                  {formatCurrency(item.refundedPrice)}
                                </p>
                              </div>
                            )}
                            {item.discountIncludingOrderDiscountPortion > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-600">
                                  Discount Amount
                                </p>
                                <p className="font-semibold text-sm text-amber-600">
                                  {formatCurrency(
                                    item.discountIncludingOrderDiscountPortion,
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Desktop: Full table view */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-slate-200 rounded-md flex items-center justify-center">
                            {!item.imageUrl && (
                              <PackageIcon className="h-6 w-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">
                              {item.productName}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {item.variantName}
                            </p>
                            <p className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded inline-block mt-1">
                              {item.categoryName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Metrics */}
                      <div className="md:col-span-2">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Sold</p>
                            <p className="font-semibold text-sm">
                              {item.quantity || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">
                              Returned
                            </p>
                            <p className="font-semibold text-sm">
                              {item.refundedQuantity || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">
                              Net Qty
                            </p>
                            <p className="font-semibold text-sm">
                              {item.netQuantity || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cost Metrics */}
                      <div className="md:col-span-2">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">Cost:</p>
                            <p className="font-semibold text-sm text-red-600">
                              {formatCurrency(item.cost || 0)}
                            </p>
                          </div>
                          {item.refundedCost > 0 && (
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-slate-500">
                                Refunded Amount:
                              </p>
                              <p className="font-semibold text-sm text-red-600">
                                {formatCurrency(item.refundedCost)}
                              </p>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">Net Cost:</p>
                            <p className="font-semibold text-sm text-emerald-600">
                              {formatCurrency(item.netCost)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Revenue Metrics */}
                      <div className="md:col-span-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">Price:</p>
                            <p className="font-semibold text-sm text-emerald-600">
                              {formatCurrency(item.price || 0)}
                            </p>
                          </div>

                          {item.refundedPrice > 0 && (
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-slate-500">
                                Refunded Amount:
                              </p>
                              <p className="font-semibold text-sm text-amber-600">
                                {formatCurrency(item.refundedPrice)}
                              </p>
                            </div>
                          )}
                          {item.discountIncludingOrderDiscountPortion > 0 && (
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-slate-500">
                                Discount Amount:
                              </p>
                              <p className="font-semibold text-sm text-amber-600">
                                {formatCurrency(
                                  item.discountIncludingOrderDiscountPortion,
                                )}
                              </p>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">
                              Net Prices:
                            </p>
                            <p className="font-semibold text-sm text-emerald-600">
                              {formatCurrency(item.netPrice)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Profit Summary */}
                      <div className="md:col-span-2 text-right">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">
                              {(item.profit || 0) >= 0 ? "Profit:" : "Loss:"}
                            </p>
                            <p
                              className={`font-semibold text-sm ${
                                (item.profit || 0) >= 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(item.profit || 0)}
                            </p>
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">
                              {(item.netProfit || 0) >= 0
                                ? "Net Profit:"
                                : "Net Loss:"}
                            </p>
                            <p
                              className={`font-semibold text-sm ${
                                (item.netProfit || 0) >= 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(item.netProfit || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {soldData && soldData.items.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t">
                <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                  <span className="text-sm text-slate-700">Items per page</span>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default SoldItemsDashboard;
