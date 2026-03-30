"use client";
import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  ShoppingCart,
  RefreshCw,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stockReportFromWarehouse } from "@/lib/actions/warehouse/stock-actions";
import { stockRequestReportForWarehouse } from "@/lib/actions/warehouse/request-actions";
import { supplierCreditReportForWarehouse } from "@/lib/actions/warehouse/supplier-actions";
import { SupplierCreditReports } from "@/types/warehouse/supplier/type";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockHistory {
  totalStockIntakes: number;
  totalStockRemaining: number;
  totalEstimatedProfit: number;
  totalStockValue: number;
  lowStockItems: LowStockItem[];
  outOfStockItems: OutOfStockItem[];
}

export interface LowStockItem {
  stockName: string;
  stockVariantName: string;
  remainingAmount: number;
}

export interface OutOfStockItem {
  stockName: string;
  stockVariantName: string;
}

interface RequestData {
  totalStockRequests: number;
  approvedStockRequests: number;
  receivedStockRequests: number;
  pendingStockRequests: number;
  inTransitStockRequests: number;
  cancelledStockRequests: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const CHART_COLORS = [
  "#EB7F44",
  "#10B981",
  "#6366F1",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
];
const PIE_COLORS = {
  approved: "#10B981",
  received: "#EB7F44",
  pending: "#F59E0B",
  cancelled: "#EF4444",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const fmtShort = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
      ? `${(v / 1_000).toFixed(0)}K`
      : String(v);

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return MONTHS[d.getMonth()];
  });
}

// Generate distribution data from totals for sparkline-style trend charts
function distributeTrend(total: number, weights: number[]) {
  return weights.map((w) =>
    Math.round((total / weights.reduce((a, b) => a + b, 0)) * w),
  );
}

const INTAKE_W = [0.7, 0.85, 0.78, 1.05, 1.25, 1.15];
const REQUEST_W = [0.65, 0.9, 0.75, 1.1, 1.2, 1.1];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-xs">
      {label && <p className="font-semibold mb-2 text-foreground">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold ml-auto pl-3">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-xs">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="text-muted-foreground mt-1">
        Count: <span className="font-bold text-foreground">{fmt(d.value)}</span>
      </p>
      <p className="text-muted-foreground">
        Share:{" "}
        <span className="font-bold text-foreground">{d.payload.pct}%</span>
      </p>
    </div>
  );
};

// ─── Stat Card (hero style matching branch dashboard) ─────────────────────────

const HeroCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) => (
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
        {label}
      </p>
      <p className="text-4xl font-extrabold mt-2 text-primary">
        {value}{" "}
        <span className="text-[0.4em] font-normal opacity-70">units</span>
      </p>
      {sub && <p className="text-xs text-white/60 mt-2">{sub}</p>}
    </div>
  </div>
);

const StatCard = ({
  label,
  value,
  icon: Icon,
  valueColor,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  valueColor?: string;
  sub?: string;
}) => (
  <Card className="shadow-none rounded-xl">
    <CardContent className="p-6">
      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-4xl font-extrabold mt-2 ${valueColor ?? "text-gray-900 dark:text-gray-100"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
    </CardContent>
  </Card>
);

// ─── Inline summary bar (matches branch "order summary" bar) ──────────────────

const SummaryBar = ({ requests }: { requests: RequestData | null }) => (
  <Card className="shadow-none">
    <CardContent className="flex items-center px-6 py-4 gap-6 flex-wrap">
      {[
        {
          icon: ShoppingCart,
          color: "text-muted-foreground",
          label: "Total Requests",
          value: requests?.totalStockRequests ?? 0,
        },
        {
          icon: CheckCircle,
          color: "text-emerald-500",
          label: "Approved",
          value: requests?.approvedStockRequests ?? 0,
        },
        {
          icon: Package,
          color: "text-primary",
          label: "Received",
          value: requests?.receivedStockRequests ?? 0,
        },

        {
          icon: Clock,
          color: "text-amber-500",
          label: "Pending",
          value: requests?.pendingStockRequests ?? 0,
        },
        {
          icon: Truck,
          color: "text-primary",
          label: "inTransit",
          value: requests?.inTransitStockRequests ?? 0,
        },
        {
          icon: XCircle,
          color: "text-red-500",
          label: "Cancelled",
          value: requests?.cancelledStockRequests ?? 0,
        },
      ].map(({ icon: Icon, color, label, value }, i, arr) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-bold">{fmt(value)}</span>
          </div>
          {i < arr.length - 1 && (
            <div className="h-4 w-px bg-border hidden sm:block" />
          )}
        </React.Fragment>
      ))}
    </CardContent>
  </Card>
);

// ─── Stock Intake vs Requests Area Chart ──────────────────────────────────────

const IntakeTrendChart = ({
  months,
  intakeData,
  reqData,
}: {
  months: string[];
  intakeData: number[];
  reqData: number[];
}) => {
  const data = months.map((m, i) => ({
    month: m,
    intake: intakeData[i],
    requests: reqData[i],
  }));
  return (
    <Card className="shadow-none h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Stock Intake vs Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="wh-intake" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EB7F44" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#EB7F44" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="wh-requests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtShort}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            />
            <Area
              type="monotone"
              dataKey="intake"
              name="Intake"
              stroke="#EB7F44"
              strokeWidth={2}
              fill="url(#wh-intake)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="requests"
              name="Requests"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#wh-requests)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// ─── Request Status Donut ─────────────────────────────────────────────────────

const RequestDonutChart = ({ requests }: { requests: RequestData | null }) => {
  const total = requests?.totalStockRequests ?? 0;
  const segments = [
    {
      name: "Approved",
      value: requests?.approvedStockRequests ?? 0,
      color: PIE_COLORS.approved,
    },
    {
      name: "Received",
      value: requests?.receivedStockRequests ?? 0,
      color: PIE_COLORS.received,
    },
    {
      name: "Pending",
      value: requests?.pendingStockRequests ?? 0,
      color: PIE_COLORS.pending,
    },
    {
      name: "Cancelled",
      value: requests?.cancelledStockRequests ?? 0,
      color: PIE_COLORS.cancelled,
    },
  ].map((s) => ({
    ...s,
    pct: total > 0 ? ((s.value / total) * 100).toFixed(1) : "0",
  }));

  return (
    <Card className="shadow-none h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Request Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <PieChart width={200} height={200}>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {segments.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {segments.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: s.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold tabular-nums">
                    {fmt(s.value)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{s.pct}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Stock Alerts Table ───────────────────────────────────────────────────────

const StockAlertsTable = ({ stock }: { stock: StockHistory | null }) => {
  const [search, setSearch] = useState("");
  const allItems = stock
    ? [
        ...stock.lowStockItems.map((i) => ({
          name: i.stockName,
          variant: i.stockVariantName,
          status: "Low stock" as const,
          qty: i.remainingAmount,
        })),
        ...stock.outOfStockItems.map((i) => ({
          name: i.stockName,
          variant: i.stockVariantName,
          status: "Out of stock" as const,
          qty: 0,
        })),
      ]
    : [];
  const filtered = allItems.filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.variant.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Stock Alerts
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {allItems.length}
          </span>
        </CardTitle>
        <input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
        />
      </CardHeader>
      <CardContent className="pt-0 px-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-25" />
            <p className="text-sm">
              {allItems.length === 0
                ? "All stock levels healthy"
                : "No items match your search"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {["Product", "Variant", "Stock", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item, i) => (
                  <tr key={i} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 font-medium text-foreground">
                      {item.name}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">
                      {item.variant}
                    </td>
                    <td
                      className="px-6 py-3 font-semibold tabular-nums"
                      style={{ color: item.qty === 0 ? "#dc2626" : "#d97706" }}
                    >
                      {item.qty}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={
                          item.status === "Out of stock"
                            ? { background: "#fef2f2", color: "#b91c1c" }
                            : { background: "#fffbeb", color: "#b45309" }
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Top Stocked Items Bar Chart ──────────────────────────────────────────────

const TopStockedChart = ({ stock }: { stock: StockHistory | null }) => {
  // Use low stock items as "needing restock" ranked chart
  const data = stock
    ? [
        ...stock.lowStockItems.map((i) => ({
          name:
            i.stockName.length > 16
              ? i.stockName.slice(0, 16) + "…"
              : i.stockName,
          qty: i.remainingAmount,
          status: "low",
        })),
      ]
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 7)
    : [];

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Low Stock Items — Remaining Qty
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!data.length ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">No low stock items</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
              />
              <Bar
                dataKey="qty"
                name="Remaining"
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
              >
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      d.qty <= 5
                        ? "#EF4444"
                        : d.qty <= 15
                          ? "#F59E0B"
                          : "#EB7F44"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Supplier Credit Chart ────────────────────────────────────────────────────

const SupplierCreditChart = ({
  suppliers,
}: {
  suppliers: SupplierCreditReports | null;
}) => {
  const [search, setSearch] = useState("");
  const list = (suppliers?.suppliersCreditSummary ?? []).filter(
    (s: any) =>
      !search || s.supplierName.toLowerCase().includes(search.toLowerCase()),
  );

  const chartData = (suppliers?.suppliersCreditSummary ?? [])
    .slice(0, 6)
    .map((s: any) => ({
      name: s.supplierName.split(" ")[0],
      paid: s.totalPaidAmount,
      owed: s.totalUnpaidAmount,
    }));

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Supplier Credit Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!chartData.length ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">
              No supplier data available
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtShort}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Bar
                dataKey="paid"
                name="Paid"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                opacity={0.9}
              />
              <Bar
                dataKey="owed"
                name="Outstanding"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                opacity={0.85}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Supplier Detail Table ────────────────────────────────────────────────────

const SupplierTable = ({
  suppliers,
}: {
  suppliers: SupplierCreditReports | null;
}) => {
  const [search, setSearch] = useState("");
  const list = (suppliers?.suppliersCreditSummary ?? []).filter(
    (s: any) =>
      !search || s.supplierName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4" />
          Supplier Breakdown
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {list.length}
          </span>
        </CardTitle>
        <input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
        />
      </CardHeader>
      <CardContent className="pt-0 px-0">
        {list.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <p className="text-sm">No suppliers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {[
                    "Supplier",
                    "Purchases",
                    "Total",
                    "Paid",
                    "Outstanding",
                    "Payment %",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((s: any) => {
                  const ratio =
                    s.totalPurchasedAmount > 0
                      ? (s.totalPaidAmount / s.totalPurchasedAmount) * 100
                      : 0;
                  const color =
                    ratio >= 70
                      ? "#16a34a"
                      : ratio >= 40
                        ? "#d97706"
                        : "#dc2626";
                  return (
                    <tr
                      key={s.supplierId}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-6 py-3 font-semibold text-foreground">
                        {s.supplierName}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {s.totalPurchasesPerformed}
                      </td>
                      <td className="px-6 py-3 tabular-nums">
                        {fmt(s.totalPurchasedAmount)}
                      </td>
                      <td className="px-6 py-3 tabular-nums font-semibold text-emerald-600">
                        {fmt(s.totalPaidAmount)}
                      </td>
                      <td className="px-6 py-3 tabular-nums font-semibold text-red-500">
                        {fmt(s.totalUnpaidAmount)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"
                            style={{ minWidth: 48 }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(ratio, 100)}%`,
                                background: color,
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-bold tabular-nums"
                            style={{ color }}
                          >
                            {ratio.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[120px] rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
      <div className="h-[56px] rounded-xl bg-muted animate-pulse" />
      <div className="space-y-3">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[80px] rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 h-[300px] rounded-xl bg-muted animate-pulse" />
        <div className="lg:w-[300px] h-[300px] rounded-xl bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
        <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
      </div>
      <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[280px] rounded-xl bg-muted animate-pulse" />
        <div className="h-[280px] rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function WarehouseDashboard() {
  const [stock, setStock] = useState<StockHistory | null>(null);
  const [requests, setRequests] = useState<RequestData | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierCreditReports | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      const [s, r, sup] = await Promise.all([
        stockReportFromWarehouse(),
        stockRequestReportForWarehouse(),
        supplierCreditReportForWarehouse(),
      ]);
      setStock(s);
      setRequests(r as RequestData);
      setSuppliers(sup);
    } catch (e) {
      console.error("Warehouse dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const months = getLast6Months();
  const intakeTrend = distributeTrend(stock?.totalStockIntakes ?? 0, INTAKE_W);
  const requestTrend = distributeTrend(
    requests?.totalStockRequests ?? 0,
    REQUEST_W,
  );

  const approvalRate =
    requests && requests.totalStockRequests > 0
      ? Math.round(
          (requests.approvedStockRequests / requests.totalStockRequests) * 100,
        )
      : 0;

  const now = new Date();
  const dateLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Reports Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Warehouse analytics and performance overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5">
            <Calendar className="h-4 w-4" />
            {dateLabel}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* ── Hero Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HeroCard
              label="Stock Received"
              value={fmt(stock?.totalStockIntakes ?? 0)}
              sub="Total units received into warehouse"
            />
            <StatCard
              label="Stock Value"
              icon={DollarSign}
              value={`${fmt(stock?.totalStockValue ?? 0)} TZS`}
            />
            <StatCard
              label="Estimated Profit"
              icon={TrendingUp}
              value={`${fmt(stock?.totalEstimatedProfit ?? 0)} TZS`}
              valueColor="text-emerald-600"
            />
          </div>

          {/* ── Request Summary Bar ── */}
          <SummaryBar requests={requests} />

          {/* ── Revenue-stream style: stock KPIs ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Stock Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Intakes",
                  value: fmt(stock?.totalStockIntakes ?? 0),
                  icon: TrendingUp,
                  color: "",
                },
                {
                  label: "Remaining",
                  value: fmt(stock?.totalStockRemaining ?? 0),
                  icon: Package,
                  color: "",
                },
                {
                  label: "Low Stock",
                  value: String(stock?.lowStockItems.length ?? 0),
                  icon: AlertCircle,
                  color: "text-amber-500",
                },
                {
                  label: "Out of Stock",
                  value: String(stock?.outOfStockItems.length ?? 0),
                  icon: AlertCircle,
                  color: "text-red-500",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="shadow-none">
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
                      className={`text-2xl font-bold ${color || "text-gray-900 dark:text-gray-100"}`}
                    >
                      {value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* ── Row 1: Trend Chart + Donut ── */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <IntakeTrendChart
                months={months}
                intakeData={intakeTrend}
                reqData={requestTrend}
              />
            </div>
            <div className="lg:w-auto lg:flex-shrink-0">
              <RequestDonutChart requests={requests} />
            </div>
          </div>

          {/* ── Row 2: Low Stock Bar + Supplier Credit Chart ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopStockedChart stock={stock} />
            <SupplierCreditChart suppliers={suppliers} />
          </div>

          {/* ── Row 3: Alerts Table (full width) ── */}
          <StockAlertsTable stock={stock} />

          {/* ── Row 4: Supplier Detail Table ── */}
          <SupplierTable suppliers={suppliers} />
        </div>
      )}
    </div>
  );
}
