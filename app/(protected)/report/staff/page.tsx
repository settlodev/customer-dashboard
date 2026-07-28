"use client";
import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Award,
  CalendarIcon,
  Package,
  Search,
  ShoppingCart,
  TrendingUp,
  UserCircle,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { staffReport } from "@/lib/actions/staff-actions";
import { StaffSummaryReport } from "@/types/staff";
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

const StaffReportDashboard = () => {
  const [staffData, setStaffData] = useState<StaffSummaryReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "staff">("overview");

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      startDate: (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 1);
        return d;
      })(),
      endDate: new Date(),
    },
  });

  useEffect(() => {
    const { startDate, endDate } = form.getValues();
    setIsLoading(true);
    staffReport(startDate, endDate)
      .then(setStaffData)
      .catch(() =>
        toast({ variant: "destructive", title: "Error fetching staff report" }),
      )
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onInvalid = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Validation error",
      description: "Please check all fields.",
    });
  }, []);

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      const response = await staffReport(values.startDate, values.endDate);
      setStaffData(response);
    } catch {
      toast({ variant: "destructive", title: "Error fetching staff report" });
    } finally {
      setIsLoading(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

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

  const totals = staffData?.staffReports.reduce(
    (acc, s) => ({
      orders: acc.orders + s.totalOrdersCompleted,
      items: acc.items + s.totalItemsSold,
      intakes: acc.intakes + s.totalStockIntakePerformed,
      gross: acc.gross + s.totalGrossAmount,
      net: acc.net + s.totalNetAmount,
      profit: acc.profit + s.totalGrossProfit,
    }),
    { orders: 0, items: 0, intakes: 0, gross: 0, net: 0, profit: 0 },
  );

  const filteredStaff =
    staffData?.staffReports.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  const topPerformer = staffData?.staffReports?.length
    ? [...staffData.staffReports].sort(
        (a, b) => b.totalGrossProfit - a.totalGrossProfit,
      )[0]
    : null;

  const profitMargin = totals?.gross
    ? Math.min((totals.profit / totals.gross) * 100, 100)
    : 0;

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 space-y-5 min-h-screen">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Staff performance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(form.getValues("startDate"), "dd MMM yyyy")} —{" "}
            {format(form.getValues("endDate"), "dd MMM yyyy, HH:mm")}
          </p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="p-4 bg-background border rounded-xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="flex flex-col sm:flex-row sm:items-end gap-3"
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

      {/* ── Summary metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Total orders",
            value: totals?.orders ?? 0,
            unit: "orders",
            accent: "bg-blue-500",
            color: "text-blue-600 dark:text-blue-400",
            icon: <ShoppingCart className="h-4 w-4" />,
          },
          {
            label: "Items sold",
            value: totals?.items ?? 0,
            unit: "items",
            accent: "bg-emerald-500",
            color: "text-emerald-600 dark:text-emerald-400",
            icon: <Package className="h-4 w-4" />,
          },
          {
            label: "Stock intakes",
            value: totals?.intakes ?? 0,
            unit: "intakes",
            accent: "bg-purple-500",
            color: "text-purple-600 dark:text-purple-400",
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: "Gross amount",
            value: `TZS ${fmt(totals?.gross ?? 0)}`,
            accent: "bg-amber-500",
            color: "text-amber-600 dark:text-amber-400",
            icon: <TrendingUp className="h-4 w-4" />,
          },
          {
            label: "Net amount",
            value: `TZS ${fmt(totals?.net ?? 0)}`,
            accent: "bg-cyan-500",
            color: "text-cyan-600 dark:text-cyan-400",
            icon: <TrendingUp className="h-4 w-4" />,
          },
          {
            label: "Gross profit",
            value: `TZS ${fmt(totals?.profit ?? 0)}`,
            accent: "bg-green-500",
            color: "text-green-600 dark:text-green-400",
            icon: <TrendingUp className="h-4 w-4" />,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-background border rounded-xl p-3 relative overflow-hidden"
          >
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
              {card.label}
            </p>
            <p
              className={`text-base font-semibold tabular-nums leading-tight ${card.color}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Profit margin bar ── */}
      <div className="bg-background border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Profit margin
          </p>
          <span className="text-sm font-semibold tabular-nums text-green-600">
            {profitMargin.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${profitMargin}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <span>Gross: TZS {fmt(totals?.gross ?? 0)}</span>
          <span>Profit: TZS {fmt(totals?.profit ?? 0)}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div>
        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit mb-4">
          {(["overview", "staff"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "overview" ? "Overview" : "Staff details"}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top performer */}
            {topPerformer && (
              <div className="bg-background border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Top performer
                  </p>
                  <Award className="h-4 w-4 text-amber-500" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <UserCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {topPerformer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Highest gross profit
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      {
                        label: "Orders",
                        value: topPerformer.totalOrdersCompleted,
                      },
                      {
                        label: "Items sold",
                        value: topPerformer.totalItemsSold,
                      },
                      {
                        label: "Gross amount",
                        value: `TZS ${fmt(topPerformer.totalGrossAmount)}`,
                      },
                      {
                        label: "Gross profit",
                        value: `TZS ${fmt(topPerformer.totalGrossProfit)}`,
                        className: "text-green-600 font-medium",
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between items-center py-1.5 border-b last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {row.label}
                        </span>
                        <span className={cn("tabular-nums", row.className)}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery(topPerformer.name);
                      setActiveTab("staff");
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border rounded-lg py-2 transition-colors"
                  >
                    View in details <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Preview table */}
            <div
              className={cn(
                "bg-background border rounded-xl overflow-hidden",
                topPerformer ? "lg:col-span-2" : "lg:col-span-3",
              )}
            >
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Top 5 by gross amount
                </p>
                <button
                  onClick={() => setActiveTab("staff")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      {[
                        "Name",
                        "Orders",
                        "Items",
                        "Gross amount",
                        "Gross profit",
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap",
                            i > 0 ? "text-right" : "text-left",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...(staffData?.staffReports ?? [])]
                      .sort((a, b) => b.totalGrossAmount - a.totalGrossAmount)
                      .slice(0, 5)
                      .map((staff) => (
                        <tr
                          key={staff.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">
                            {staff.name}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {staff.totalOrdersCompleted}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {staff.totalItemsSold}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            TZS {fmt(staff.totalGrossAmount)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-green-600 font-medium">
                            TZS {fmt(staff.totalGrossProfit)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Staff details tab */}
        {activeTab === "staff" && (
          <div className="bg-background border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                All staff — {filteredStaff.length} members
              </p>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 text-sm border rounded-lg bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-base leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    {[
                      "Name",
                      "Orders",
                      "Items sold",
                      "Stock intakes",
                      "Gross amount",
                      "Net amount",
                      "Gross profit",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap",
                          i > 0 ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => (
                      <tr
                        key={staff.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{staff.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {staff.totalOrdersCompleted}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {staff.totalItemsSold}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {staff.totalStockIntakePerformed ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          TZS {fmt(staff.totalGrossAmount)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          TZS {fmt(staff.totalNetAmount)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-green-600 dark:text-green-400 font-medium">
                          TZS {fmt(staff.totalGrossProfit)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        No staff members match your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <div key={staff.id} className="p-4">
                    <p className="font-medium text-sm mb-2">{staff.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: "Orders", value: staff.totalOrdersCompleted },
                        { label: "Items sold", value: staff.totalItemsSold },
                        {
                          label: "Stock intakes",
                          value: staff.totalStockIntakePerformed ?? 0,
                        },
                        {
                          label: "Gross amount",
                          value: `TZS ${fmt(staff.totalGrossAmount)}`,
                        },
                        {
                          label: "Net amount",
                          value: `TZS ${fmt(staff.totalNetAmount)}`,
                        },
                        {
                          label: "Gross profit",
                          value: `TZS ${fmt(staff.totalGrossProfit)}`,
                          className: "text-green-600 font-semibold",
                        },
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
                ))
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No staff members match your search
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffReportDashboard;
