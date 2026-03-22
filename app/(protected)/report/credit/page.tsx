"use client";
import React, { useEffect, useState } from "react";
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
import jsPDF from "jspdf";
import "jspdf-autotable";
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

const CreditReportDashboard = () => {
  const [creditData, setCreditData] = useState<Credit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [location, setLocation] = useState<Location>();
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

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
    if (!creditData) {
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
      doc.text("CREDIT REPORT", margin, 30);
      doc.setFont("Arial", "normal");
      doc.text(
        `Period: ${format(new Date(creditData.startDate), "MMM dd, yyyy HH:mm")} - ${format(new Date(creditData.endDate), "MMM dd, yyyy HH:mm")}`,
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
      doc.setFillColor(254, 242, 242);
      doc.rect(margin, 60, pageWidth - 2 * margin, 45, "F");
      doc.setFontSize(14);
      doc.setFont("Arial", "bold");
      doc.text("SUMMARY", margin + 5, 75);
      doc.setFontSize(12);
      doc.setFont("Arial", "normal");
      doc.text(`Total Unpaid Orders: ${creditData.total}`, margin + 5, 85);
      doc.text(
        `Total Unpaid Amount: TZS ${formatCurrency(creditData.totalUnpaidAmount)}`,
        margin + 5,
        92,
      );
      doc.text(
        `Total Paid Amount: TZS ${formatCurrency(creditData.totalPaidAmount)}`,
        margin + 5,
        99,
      );
      let yPos = 120;
      doc.setFontSize(10);
      doc.setFont("Arial", "bold");
      doc.text("Unpaid Orders", margin, yPos);
      yPos += 5;
      doc.autoTable({
        startY: yPos,
        head: [["Order #", "Order Name", "Date", "Customer", "Paid", "Unpaid"]],
        body: creditData.unpaidOrders.map((o) => [
          o.orderNumber,
          o.orderName || "N/A",
          format(new Date(o.openedDate), "MMM dd, yyyy"),
          o.customerName || "N/A",
          `TZS ${formatCurrency(o.paidAmount)}`,
          `TZS ${formatCurrency(o.unpaidAmount)}`,
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [254, 242, 242] },
        columnStyles: { 4: { halign: "right" }, 5: { halign: "right" } },
      });
      const pageHeight = doc.internal.pageSize.height;
      if (((doc as any).lastAutoTable?.finalY || 0) > pageHeight - 60)
        doc.addPage();
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(32, 32, 32);
      const disclaimer =
        "This report is confidential and intended solely for the recipient. Any discrepancies must be reported to support@setllo.co.tz within 14 days of issuance";
      const lines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
      const lh = 3,
        startY = footerY - lines.length * lh - lh;
      doc.setDrawColor(32, 32, 32);
      doc.setLineWidth(0.3);
      doc.rect(
        margin - 3,
        startY - lh - 3,
        pageWidth - 2 * margin + 6,
        lines.length * lh + lh + 8,
        "S",
      );
      lines.forEach((line: string, i: number) => {
        const cx = (pageWidth - doc.getTextWidth(line)) / 2;
        doc.text(line, cx, startY + i * lh);
      });
      const pw = "Powered by Settlo";
      doc.text(
        pw,
        (pageWidth - doc.getTextWidth(pw)) / 2,
        startY + lines.length * lh + 2,
      );
      const filename = `credit-report-${format(new Date(creditData.startDate), "yyyy-MM-dd")}-to-${format(new Date(creditData.endDate), "yyyy-MM-dd")}.pdf`;
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
            Credit report
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
            Outstanding credit balances
          </p>
        </div>

        <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Total unpaid amount
          </p>
          <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            TZS {formatCurrency(creditData?.totalUnpaidAmount ?? 0)}
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
            TZS {formatCurrency(creditData?.totalPaidAmount ?? 0)}
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
                      <td className="px-4 py-3 font-medium tabular-nums whitespace-nowrap text-sm">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {order.orderName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
                        {format(new Date(order.openedDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {order.customerName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        TZS {formatCurrency(order.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                        TZS {formatCurrency(order.unpaidAmount)}
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
    </div>
  );
};

export default CreditReportDashboard;
