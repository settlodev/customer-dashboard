"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Package,
  RefreshCcw,
  Percent,
  Edit,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-picker-with-range";
import {
  fetchProductSummary,
  getLocationId,
} from "@/lib/actions/dashboard-action";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ProductSummaryResponse,
  ProductVariantSummary,
  ProductDailySales,
  ProductStaffPerformance,
} from "@/types/product/product-summary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const WS_URL = process.env.NEXT_PUBLIC_REPORTS_WS_URL;

type SummaryFilter = {
  filter: string;
  customStart?: string | null;
  customEnd?: string | null;
};

const formatAmount = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return "0";
  return value.toLocaleString();
};

const CurrencyValue = ({
  value,
  className,
}: {
  value: number | undefined | null;
  className?: string;
}) => (
  <span className={className}>
    {formatCurrency(value)}{" "}
    <span className="text-[0.6em] font-normal opacity-70">TZS</span>
  </span>
);

function StatCard({
  label,
  value,
  icon: Icon,
  valueColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  valueColor?: string;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div
          className={`text-2xl font-bold ${valueColor || "text-gray-900 dark:text-gray-100"}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Chart tooltip ---
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          <span className="font-semibold">{entry.name}:</span>{" "}
          {entry.value?.toLocaleString()} TZS
        </p>
      ))}
    </div>
  );
}

// --- Daily Sales Trend Chart ---
function DailySalesTrendChart({ data }: { data: ProductDailySales[] }) {
  const chartData = (data || []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  if (!chartData.length) {
    return (
      <Card className="shadow-none h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Daily Sales Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[220px]">
          <p className="text-sm text-muted-foreground">No sales data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Daily Sales Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EB7F44" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#EB7F44" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={formatAmount}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#revGrad)"
            />
            <Area
              type="monotone"
              dataKey="grossProfit"
              name="Gross Profit"
              stroke="#EB7F44"
              strokeWidth={2}
              fill="url(#profitGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// --- Staff Performance Chart ---
function StaffSalesChart({ data }: { data: ProductStaffPerformance[] }) {
  if (!data?.length) {
    return (
      <Card className="shadow-none h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Staff Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[220px]">
          <p className="text-sm text-muted-foreground">
            No staff data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Staff Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#f0f0f0"
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={formatAmount}
            />
            <YAxis
              type="category"
              dataKey="staffName"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              width={100}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              dataKey="salesValue"
              name="Sales Value"
              fill="#EB7F44"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// --- Variant Breakdown Table ---
function VariantBreakdownTable({ data }: { data: ProductVariantSummary[] }) {
  if (!data?.length) {
    return (
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Variant Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <p className="text-sm text-muted-foreground">No variant data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Variant Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-md border mx-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Variant</TableHead>
                <TableHead className="text-xs text-right">Qty Sold</TableHead>
                <TableHead className="text-xs text-right hidden sm:table-cell">
                  Gross Sales
                </TableHead>
                <TableHead className="text-xs text-right">Net Sales</TableHead>
                <TableHead className="text-xs text-right hidden md:table-cell">
                  Profit
                </TableHead>
                <TableHead className="text-xs text-right hidden md:table-cell">
                  Margin
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((v) => (
                <TableRow key={v.variantId}>
                  <TableCell className="text-sm font-medium">
                    {v.itemName}
                  </TableCell>
                  <TableCell className="text-sm text-right">
                    {v.quantitySold.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-right hidden sm:table-cell">
                    {v.grossSales.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-right">
                    {v.netSales.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-right hidden md:table-cell">
                    {v.grossProfit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-right hidden md:table-cell">
                    {v.profitMargin.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---
export default function ProductDetailDashboard({
  productId,
  children,
  productName,
  productImage,
  categoryName,
  sku,
  status,
  isArchived,
  editUrl,
}: {
  productId: string;
  children?: React.ReactNode;
  productName: string;
  productImage: string | null;
  categoryName: string;
  sku: string;
  status: boolean;
  isArchived: boolean;
  editUrl: string;
}) {
  const [summary, setSummary] = useState<ProductSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const retryCountRef = useRef(0);
  const locationIdRef = useRef<string | undefined>(undefined);
  const activeFilterRef = useRef<SummaryFilter>({ filter: "THIS_MONTH" });
  const mountedRef = useRef(false);

  const getMonthRange = useCallback(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = String(
      new Date(y, now.getMonth() + 1, 0).getDate(),
    ).padStart(2, "0");
    return { startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${lastDay}` };
  }, []);

  const publishFilter = useCallback(
    (filterOverride?: SummaryFilter) => {
      const client = stompClientRef.current;
      const locationId = locationIdRef.current;
      if (!client?.connected || !locationId) return;

      const filter = filterOverride || activeFilterRef.current;
      client.publish({
        destination: "/app/subscribe-product-summary",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locationId,
          productId,
          filter: filter.filter,
          customStart: filter.customStart ?? null,
          customEnd: filter.customEnd ?? null,
        }),
      });
    },
    [productId],
  );

  const handleFilterChange = useCallback(
    (startDate: string, endDate: string) => {
      const newFilter: SummaryFilter = {
        filter: "CUSTOM",
        customStart: startDate,
        customEnd: endDate,
      };
      activeFilterRef.current = newFilter;

      if (stompClientRef.current?.connected) {
        publishFilter(newFilter);
      } else {
        fetchProductSummary(productId, startDate, endDate)
          .then((response) => setSummary(response))
          .catch((error) =>
            console.error("Error fetching product summary:", error),
          );
      }
    },
    [publishFilter, productId],
  );

  // -- WebSocket lifecycle --

  const disconnectWs = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    const client = stompClientRef.current;
    if (client) {
      client.onWebSocketClose = () => {};
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      client.deactivate();
      stompClientRef.current = null;
    }
    retryCountRef.current = 0;
  }, []);

  const connectWs = useCallback(
    (locationId: string) => {
      if (!WS_URL) return;
      if (stompClientRef.current) return;
      if (!mountedRef.current) return;

      const client = new Client({
        webSocketFactory: () =>
          new SockJS(WS_URL, null, {
            transports: ["xhr-streaming", "xhr-polling"],
          }),
        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,
        reconnectDelay: 0,
        connectHeaders: {
          accept: "application/json",
          "content-type": "application/json",
        },

        onConnect: () => {
          if (!mountedRef.current) {
            client.deactivate();
            return;
          }

          retryCountRef.current = 0;

          subscriptionRef.current = client.subscribe(
            "/user/queue/product-summary",
            (message) => {
              if (!mountedRef.current) return;
              const update = JSON.parse(message.body);
              if (!update || !update.productId) return;
              setSummary(update as ProductSummaryResponse);
            },
            { "content-type": "application/json" },
          );

          publishFilter();
        },

        onStompError: (frame) => {
          console.error("Product summary STOMP error:", frame.headers.message);
        },

        onWebSocketClose: () => {
          if (
            !mountedRef.current ||
            document.visibilityState !== "visible" ||
            !locationIdRef.current
          ) {
            return;
          }

          const base = 2000 * Math.pow(1.5, retryCountRef.current);
          const jitter = Math.random() * 1000;
          const delay = Math.min(base + jitter, 30_000);
          retryCountRef.current += 1;

          stompClientRef.current = null;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectWs(locationIdRef.current!);
            }
          }, delay);
        },
      });

      stompClientRef.current = client;
      client.activate();
    },
    [publishFilter],
  );

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        disconnectWs();
      } else if (locationIdRef.current && mountedRef.current) {
        connectWs(locationIdRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [connectWs, disconnectWs]);

  // -- Initial load --
  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        setIsLoading(true);
        const { startDate, endDate } = getMonthRange();

        const [locationId, summaryData] = await Promise.all([
          getLocationId(),
          fetchProductSummary(productId, startDate, endDate),
        ]);

        locationIdRef.current = locationId;

        if (mountedRef.current) {
          setSummary(summaryData);
        }

        if (locationId && mountedRef.current) {
          connectWs(locationId);
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error("Error initializing product summary:", error);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      disconnectWs();
    };
  }, [productId, getMonthRange, connectWs, disconnectWs]);

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: Product info */}
      <div className="flex items-center gap-4">
        {productImage ? (
          <Image
            src={productImage}
            alt={productName}
            className="w-12 h-12 rounded-xl object-cover"
            width={48}
            height={48}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {productName}
            </h1>
            <span
              className={`h-2.5 w-2.5 rounded-full ${status ? "bg-green-500" : "bg-red-500"}`}
            />
            {isArchived && (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-300"
              >
                Archived
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Right: Filter + Edit */}
      <div className="flex items-center gap-2">
        <DateRangePicker onFilterChange={handleFilterChange} />
        <Link href={editUrl}>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        </Link>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <ProductSummarySkeleton />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <Card className="shadow-none">
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground">
              No sales data available for this product
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderHeader()}

      {/* Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="relative rounded-xl overflow-hidden shadow-none"
          style={{
            backgroundImage: "url('/images/bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-white/80">
              Gross Profit
            </p>
            <p className="text-4xl font-extrabold mt-2 text-primary">
              <CurrencyValue value={summary.grossProfit} />
            </p>
          </div>
        </div>

        <Card className="rounded-xl shadow-none">
          <CardContent className="p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Net Sales
            </p>
            <p className="text-4xl font-extrabold mt-2 text-gray-900 dark:text-gray-100">
              <CurrencyValue value={summary.netSales} />
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-none">
          <CardContent className="p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Cost of Goods
            </p>
            <p className="text-4xl font-extrabold mt-2 text-gray-900 dark:text-gray-100">
              <CurrencyValue value={summary.totalCost} />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="shadow-none">
        <CardContent className="flex items-center px-6 py-4 gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Qty Sold</span>
            <span className="text-sm font-bold">
              {summary.totalQuantitySold.toLocaleString()}
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Avg. Price</span>
            <span className="text-sm font-bold">
              {formatCurrency(summary.averageUnitPrice)} TZS
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">Profit Margin</span>
            <span className="text-sm font-bold">
              {summary.profitMargin.toFixed(1)}%
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">Refunds</span>
            <span className="text-sm font-bold">
              {summary.refundedQuantity.toLocaleString()} (
              {formatCurrency(summary.refundedAmount)} TZS)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Stream */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Revenue stream
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Gross Sales"
            value={`${formatCurrency(summary.grossSales)} TZS`}
            icon={DollarSign}
          />
          <StatCard
            label="Discounts"
            value={`${formatCurrency(summary.totalDiscount)} TZS`}
            icon={RefreshCcw}
          />
          <StatCard
            label="Net Sales"
            value={`${formatCurrency(summary.netSales)} TZS`}
            icon={TrendingUp}
          />
          <StatCard
            label="Profit Margin"
            value={`${summary.profitMargin.toFixed(1)}%`}
            icon={Percent}
          />
        </div>
      </div>

      {children}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailySalesTrendChart data={summary.dailySalesTrend} />
        <StaffSalesChart data={summary.staffPerformance} />
      </div>

      {/* Variant Breakdown */}
      <VariantBreakdownTable data={summary.variants} />
    </div>
  );
}

function ProductSummarySkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[100px] rounded-xl" />
        <Skeleton className="h-[100px] rounded-xl" />
        <Skeleton className="h-[100px] rounded-xl" />
      </div>

      {/* Quick Stats Bar */}
      <Skeleton className="h-[56px] rounded-xl" />

      {/* Revenue Stream */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>

      {/* Variant Table */}
      <Skeleton className="h-[200px] rounded-xl" />
    </div>
  );
}
