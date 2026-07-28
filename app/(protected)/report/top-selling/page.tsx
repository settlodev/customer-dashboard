"use client";
import React, { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TrendingUp, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { topSellingProduct } from "@/lib/actions/product-actions";
import { TopItems, TopSellingProduct } from "@/types/product/type";
import Loading from "@/components/ui/loading";

type SortBy = "revenue" | "quantity";

function DateTimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      const newDate = new Date(selected);
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      onChange(newDate);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    const newDate = new Date(value);
    if (type === "hour") newDate.setHours(parseInt(val, 10));
    else newDate.setMinutes(parseInt(val, 10));
    onChange(newDate);
  };

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <p className="text-xs lg:text-sm font-medium text-muted-foreground  tracking-wide">
        {label}
      </p>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 h-8 w-full px-3 bg-muted/50 hover:bg-muted border border-border rounded-lg text-sm text-left transition-colors">
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs lg:text-sm truncate">
              {format(value, "dd MMM yy, HH:mm")}
            </span>
          </button>
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
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <Button
                      key={hour}
                      size="icon"
                      variant={value.getHours() === hour ? "default" : "ghost"}
                      className="text-xs"
                      onClick={() => handleTimeChange("hour", hour.toString())}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      size="icon"
                      variant={
                        value.getMinutes() === minute ? "default" : "ghost"
                      }
                      className="text-xs"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                    >
                      {minute.toString().padStart(2, "0")}
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
}

const TopSellingPage = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  });
  const [endDate, setEndDate] = useState(new Date());
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortBy>("revenue");
  const [soldData, setSoldData] = useState<TopSellingProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await topSellingProduct(startDate, endDate, limit);
        setSoldData(response);
      } catch (error) {
        console.error("Error fetching top selling products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilter = async () => {
    setIsFiltering(true);
    try {
      const response = await topSellingProduct(startDate, endDate, limit);
      setSoldData(response);
    } catch (error) {
      console.error("Error fetching top selling products:", error);
    } finally {
      setIsFiltering(false);
    }
  };

  const sortedItems = useMemo(() => {
    if (!soldData?.items) return [];
    return [...soldData.items].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [soldData, sortBy]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat().format(value);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 space-y-4 min-h-screen">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Top selling products
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Most popular products by {sortBy}
        </p>
      </div>

      {/* Filter card */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {/* Date pickers — always full width, stack nicely */}
        <div className="flex gap-2">
          <DateTimePicker
            label="From"
            value={startDate}
            onChange={setStartDate}
          />
          <DateTimePicker label="To" value={endDate} onChange={setEndDate} />
        </div>

        {/* Row 2: limit + sort + button */}
        <div className="flex gap-2 items-end">
          {/* Limit */}
          <div className="space-y-1 shrink-0">
            <p className="text-xs lg:text-sm font-medium text-muted-foreground tracking-wide">
              Limit
            </p>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))}
              className="w-14 h-8 rounded-lg border border-border bg-muted/50 px-1 text-xs lg:text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
              min={1}
            />
          </div>

          {/* Sort toggle — takes all remaining space */}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs lg:text-sm font-medium text-muted-foreground  tracking-wide">
              Sort by
            </p>
            <div className="flex h-8 rounded-lg border border-border overflow-hidden bg-muted/50">
              <button
                onClick={() => setSortBy("revenue")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 text-sm transition-colors",
                  sortBy === "revenue"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="text-xs lg:text-sm">Revenue</span>
              </button>

              <div className="w-px bg-border shrink-0" />

              <button
                onClick={() => setSortBy("quantity")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 text-sm transition-colors",
                  sortBy === "quantity"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="text-xs lg:text-sm">Quantity</span>
              </button>
            </div>
          </div>

          {/* Filter button */}
          <Button
            onClick={handleFilter}
            disabled={isFiltering}
            className="h-8 text-xs lg:text-sm shrink-0 self-end"
          >
            {isFiltering ? (
              <div className="border-t-transparent border-4 border-white w-4 h-4 rounded-full animate-spin" />
            ) : (
              "Filter"
            )}
          </Button>
        </div>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-white flex items-center justify-between">
          <p className="text-sm font-semibold">
            Top {sortedItems.length} products
          </p>
          <span className="text-xs text-muted-foreground">
            sorted by {sortBy}
          </span>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-8">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Product
                </th>
                <th
                  className={cn(
                    "text-right px-4 py-3 text-xs font-medium",
                    sortBy === "quantity"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="flex items-center justify-end gap-1">
                    <Hash className="h-3 w-3" />
                    Qty {sortBy === "quantity" && "▼"}
                  </span>
                </th>
                <th
                  className={cn(
                    "text-right px-4 py-3 text-xs font-medium",
                    sortBy === "revenue"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="flex items-center justify-end gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Revenue {sortBy === "revenue" && "▼"}
                  </span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                  % total
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Latest sold
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length ? (
                sortedItems.map((item: TopItems, index: number) => (
                  <tr
                    key={`${item.productName}-${item.variantName}-${index}`}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm whitespace-nowrap">
                        {item.productName}
                        {item.variantName ? ` · ${item.variantName}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-muted">
                          {item.categoryName}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {formatCurrency(item.quantity)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {formatCurrency(item.revenue)}
                      <span className="text-xs text-muted-foreground ml-1">
                        TZS
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {item.percentageOfTotal}%
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(item.latestSoldDate), "dd MMM, HH:mm")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopSellingPage;
