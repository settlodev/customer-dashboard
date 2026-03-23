"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  PackageIcon,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DepartmentReport,
  fectchAllDepartments,
} from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";
import { UUID } from "crypto";

interface TopItems {
  name: string;
  productName: string;
  variantName: string;
  categoryName: string;
  imageUrl: string | null;
  quantity: number;
  price: number;
  cost: number;
  grossProfit: number;
  latestSoldDate: string;
  earliestSoldDate: string;
  revenue?: number;
  percentageOfTotal?: number;
  staffName?: string;
  averagePrice?: number;
}

interface ExtendedReport {
  totalGrossProfit: number;
  totalNetAmount: number;
  totalGrossAmount: number;
  soldItems: TopItems[];
  startDate: string;
  endDate: string;
  name: string;
  totalSales: number;
  totalItems: number;
  totalOrders: number;
  totalCustomers: number;
  totalDiscounts: number;
  totalTaxes: number;
  totalShipping: number;
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

export default function DepartmentReportPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [report, setReport] = useState<ExtendedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState<string>();
  const [formValues, setFormValues] = useState<FormValues>({
    startDate: (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 1);
      return d;
    })(),
    endDate: new Date(),
  });

  useEffect(() => {
    fectchAllDepartments()
      .then(setDepartments)
      .catch(() =>
        toast({ variant: "destructive", title: "Failed to load departments" }),
      );
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) {
      setDateError("Please select a department");
      return;
    }
    if (formValues.startDate > formValues.endDate) {
      setDateError("Start date must be before end date");
      return;
    }
    setDateError(undefined);
    setLoading(true);
    try {
      const data = await DepartmentReport(
        selectedDepartment.id as unknown as UUID,
        formValues.startDate.toISOString(),
        formValues.endDate.toISOString(),
      );
      const extended: ExtendedReport = {
        totalGrossProfit: data.totalGrossProfit,
        totalNetAmount: data.totalNetAmount,
        totalGrossAmount: data.totalGrossAmount,
        soldItems: [],
        startDate: data.startDate,
        endDate: data.endDate,
        name: data.name,
        totalSales: data.totalGrossAmount || 0,
        totalItems: data.totalItemsSold || 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalDiscounts: 0,
        totalTaxes: 0,
        totalShipping: 0,
      };
      if (Array.isArray(data.soldItems)) {
        extended.soldItems = data.soldItems.map((item) => {
          const revenue = (item.price || 0) * (item.quantity || 0);
          return {
            ...item,
            revenue,
            percentageOfTotal:
              extended.totalGrossAmount > 0
                ? (revenue / extended.totalGrossAmount) * 100
                : 0,
            averagePrice:
              item.quantity > 0 ? revenue / item.quantity : item.price || 0,
            staffName: "Staff",
          };
        });
      }
      setReport(extended);
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

  const isProfit = (report?.totalGrossProfit ?? 0) >= 0;

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 space-y-5 min-h-screen">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Department report
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {report
            ? `${report.name} · ${format(new Date(report.startDate), "dd MMM yyyy")} — ${format(new Date(report.endDate), "dd MMM yyyy, HH:mm")}`
            : "Select a department and date range"}
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="p-4 bg-background border rounded-xl">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="flex flex-col gap-1.5 sm:w-52">
            <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Department
            </span>
            <Select
              value={selectedDepartment?.id}
              onValueChange={(v) => {
                setSelectedDepartment(
                  departments.find((d) => d.id === v) || null,
                );
                setDateError(undefined);
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          <SubmitButton
            isPending={loading}
            label="Apply filter"
            className="h-9 text-sm sm:w-auto w-full"
          />
        </form>
        {dateError && <p className="text-xs text-red-500 mt-2">{dateError}</p>}
      </div>

      {/* ── Metric cards ── */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Items sold
            </p>
            <p className="text-2xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
              {report.totalItems.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                units
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total gross: TZS {fmt(report.totalGrossAmount)}
            </p>
          </div>

          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Net amount
            </p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              TZS {fmt(report.totalNetAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              After discounts & returns
            </p>
          </div>

          <div className="bg-background border rounded-xl p-4 relative overflow-hidden">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              {isProfit ? "Gross profit" : "Gross loss"}
            </p>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                isProfit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              TZS {fmt(Math.abs(report.totalGrossProfit))}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {isProfit ? (
                <>
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Revenue minus cost of goods
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  Revenue minus cost of goods
                </>
              )}
            </p>
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

      {/* ── Items table ── */}
      {!loading && report && report.soldItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Items sold
            </p>
            <span className="text-xs text-muted-foreground">
              {report.soldItems.length} items
            </span>
          </div>

          <div className="bg-background border rounded-xl overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    {[
                      "Product",
                      "Category",
                      "Qty",
                      "Price",
                      "Revenue",
                      "% of total",
                      "Earliest",
                      "Latest",
                      "Staff",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap",
                          i >= 2 && i <= 5 ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.soldItems.map((item, index) => {
                    const revenue = item.revenue ?? item.price * item.quantity;
                    const pct =
                      item.percentageOfTotal ??
                      (report.totalGrossAmount > 0
                        ? (revenue / report.totalGrossAmount) * 100
                        : 0);
                    return (
                      <tr
                        key={index}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm leading-tight">
                            {item.productName}
                          </p>
                          {item.variantName && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.variantName}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">
                          {item.quantity}
                          <span className="text-muted-foreground font-normal ml-1">
                            u
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm">
                          TZS {fmt(item.price)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm text-emerald-600 dark:text-emerald-400">
                          TZS {fmt(revenue)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm text-muted-foreground">
                          {pct.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {format(
                            new Date(item.earliestSoldDate),
                            "dd MMM, HH:mm",
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {format(
                            new Date(item.latestSoldDate),
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {report.soldItems.map((item, index) => {
                const revenue = item.revenue ?? item.price * item.quantity;
                const pct =
                  item.percentageOfTotal ??
                  (report.totalGrossAmount > 0
                    ? (revenue / report.totalGrossAmount) * 100
                    : 0);
                return (
                  <div key={index} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-medium text-sm">
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.variantName}
                          </p>
                        )}
                        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {item.categoryName}
                        </span>
                      </div>
                      <span className="text-xs tabular-nums font-medium text-muted-foreground whitespace-nowrap">
                        {item.quantity} units
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: "Price", value: `TZS ${fmt(item.price)}` },
                        {
                          label: "Revenue",
                          value: `TZS ${fmt(revenue)}`,
                          className: "text-emerald-600",
                        },
                        { label: "% of total", value: `${pct.toFixed(1)}%` },
                        {
                          label: "Earliest",
                          value: format(
                            new Date(item.earliestSoldDate),
                            "dd MMM, HH:mm",
                          ),
                        },
                        {
                          label: "Latest",
                          value: format(
                            new Date(item.latestSoldDate),
                            "dd MMM, HH:mm",
                          ),
                        },
                        { label: "Staff", value: item.staffName || "—" },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="bg-muted/40 rounded-lg p-2.5"
                        >
                          <p className="text-muted-foreground mb-0.5">
                            {row.label}
                          </p>
                          <p
                            className={cn(
                              "font-medium tabular-nums",
                              row.className,
                            )}
                          >
                            {row.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && report && report.soldItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <PackageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No items sold in this period</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different date range or department
          </p>
        </div>
      )}
    </div>
  );
}
