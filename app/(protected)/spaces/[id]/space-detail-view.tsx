"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  CornerDownRight,
  DollarSign,
  LayoutGrid,
  Palette,
  Power,
  PowerOff,
  ShoppingCart,
  Sparkles,
  StickyNote,
  Tag,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Space,
  TABLE_SPACE_TYPE_LABELS,
  TABLE_STATUS_LABELS,
  BOOKABLE_TYPES,
} from "@/types/space/type";
import { TableStatus } from "@/types/enums";
import type { Order } from "@/types/orders/type";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "sales", label: "Sales", icon: ShoppingCart },
  { key: "operations", label: "Operations", icon: Activity },
  { key: "layout", label: "Layout", icon: Palette },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface Props {
  space: Space;
  /** Closed orders at this table over the last 30 days. When provided, the
   * Sales tab is shown — only the tables route passes this. */
  salesOrders?: Order[];
  currency?: string;
  /** Tab to open on mount (from `?tab=`), e.g. "sales" from a report. */
  initialTab?: string;
}

export function SpaceDetailView({
  space,
  salesOrders,
  currency = "TZS",
  initialTab,
}: Props) {
  const showSales = salesOrders !== undefined;
  const visibleTabs = TABS.filter((t) => t.key !== "sales" || showSales);
  const [tab, setTab] = useState<TabKey>(
    visibleTabs.some((t) => t.key === initialTab)
      ? (initialTab as TabKey)
      : "overview",
  );
  const isBookable = BOOKABLE_TYPES.includes(space.type);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-line bg-line">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-5">
          <SummaryTile
            icon={<Tag className="h-3 w-3" />}
            label="Type"
            value={
              TABLE_SPACE_TYPE_LABELS[space.type] ?? String(space.type)
            }
          />
          <SummaryTile
            icon={<Users className="h-3 w-3" />}
            label="Capacity"
            value={
              space.minCapacity != null
                ? `${space.minCapacity}–${space.capacity}`
                : space.capacity.toString()
            }
            unit="seats"
          />
          <SummaryTile
            icon={<Activity className="h-3 w-3" />}
            label="Table status"
            value={
              space.tableStatus
                ? TABLE_STATUS_LABELS[space.tableStatus]
                : "—"
            }
          />
          <SummaryTile
            icon={
              space.reservable ? (
                <Sparkles className="h-3 w-3" />
              ) : (
                <PowerOff className="h-3 w-3" />
              )
            }
            label="Reservable"
            value={space.reservable ? "Yes" : "No"}
            tone={space.reservable ? "pos" : "neutral"}
          />
          <SummaryTile
            icon={
              space.active ? (
                <Power className="h-3 w-3" />
              ) : (
                <PowerOff className="h-3 w-3" />
              )
            }
            label="State"
            value={space.active ? "Active" : "Inactive"}
            tone={space.active ? "pos" : "neutral"}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={isActive}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "border-primary text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink-2"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && <OverviewTab space={space} />}
      {tab === "sales" && showSales && (
        <TableSalesTab orders={salesOrders} currency={currency} />
      )}
      {tab === "operations" && (
        <OperationsTab space={space} isBookable={isBookable} />
      )}
      {tab === "layout" && <LayoutTab space={space} />}
    </div>
  );
}

// ── Sales (per-table orders, last 30 days) ──────────────────────────

function TableSalesTab({
  orders,
  currency,
}: {
  orders: Order[];
  currency: string;
}) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No closed orders at this table in the last 30 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fmt = (v: number) =>
    v.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const gross = orders.reduce((s, o) => s + (o.grossAmount ?? 0), 0);
  const net = orders.reduce((s, o) => s + (o.netAmount ?? 0), 0);
  const profit = orders.reduce((s, o) => s + (o.grossProfit ?? 0), 0);
  const avg = orders.length > 0 ? net / orders.length : 0;
  const margin = net > 0 ? (profit / net) * 100 : 0;

  return (
    <div className="space-y-6">
      <KpiStrip cols={5}>
        <KpiCard
          icon={<ShoppingCart className="h-3 w-3" />}
          label="Orders"
          value={orders.length.toLocaleString()}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Gross"
          value={fmt(gross)}
          unit={currency}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Net"
          value={fmt(net)}
          unit={currency}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Avg / order"
          value={fmt(avg)}
          unit={currency}
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Gross profit"
          value={fmt(profit)}
          unit={currency}
          delta={net > 0 ? `${margin.toFixed(1)}% margin` : undefined}
          deltaTone={profit >= 0 ? "pos" : "neg"}
        />
      </KpiStrip>

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-3 text-sm font-semibold">
            Orders at this table (last 30 days)
          </h3>
          <div className="overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={String(o.id)}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-primary hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(o.openedDate).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(o.grossAmount ?? 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(o.netAmount ?? 0)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${
                        (o.grossProfit ?? 0) >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {fmt(o.grossProfit ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewTab({ space }: { space: Space }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line"
              style={
                space.color
                  ? { backgroundColor: `${space.color}1A`, color: space.color }
                  : undefined
              }
            >
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {space.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {space.code || "—"}
              </p>
            </div>
          </div>

          {space.parentSpaceName && (
            <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2">
              <CornerDownRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-[12px] font-medium text-ink">
                {space.parentSpaceName}
              </span>
            </div>
          )}

          {space.floorPlanName && (
            <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2">
              <LayoutGrid className="h-3 w-3 text-muted-foreground" />
              <span className="text-[12px] font-medium text-ink">
                Floor plan: {space.floorPlanName}
              </span>
            </div>
          )}

          {space.description && (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <StickyNote className="h-3 w-3" />
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm text-ink-2">
                {space.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            Profile
          </h3>

          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow
                icon={Tag}
                label="Type"
                value={
                  TABLE_SPACE_TYPE_LABELS[space.type] ?? String(space.type)
                }
              />
              <DetailRow icon={Tag} label="Code" value={space.code} />
              <DetailRow
                icon={Users}
                label="Maximum capacity"
                value={`${space.capacity}`}
              />
              <DetailRow
                icon={Users}
                label="Minimum capacity"
                value={
                  space.minCapacity != null ? `${space.minCapacity}` : null
                }
              />
              <DetailRow
                icon={CornerDownRight}
                label="Parent"
                value={space.parentSpaceName}
              />
              <DetailRow
                icon={LayoutGrid}
                label="Floor plan"
                value={space.floorPlanName}
              />
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OperationsTab({
  space,
  isBookable,
}: {
  space: Space;
  isBookable: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Live status
            </h3>
            <Badge
              variant={space.tableStatus ? "soft" : "outline"}
              className="text-[10.5px]"
            >
              {space.tableStatus
                ? TABLE_STATUS_LABELS[space.tableStatus as TableStatus]
                : "Not set"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <DetailRow
              label="Reservable"
              value={
                <Badge
                  variant={space.reservable ? "pos" : "soft"}
                  className="text-[10.5px]"
                >
                  {space.reservable ? "Yes" : "No"}
                </Badge>
              }
            />
            <DetailRow
              label="Active"
              value={
                <Badge
                  variant={space.active ? "pos" : "soft"}
                  className="text-[10.5px]"
                >
                  {space.active ? "Active" : "Inactive"}
                </Badge>
              }
            />
            <DetailRow label="Sort order" value={space.sortOrder?.toString()} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="h-4 w-4 text-muted-foreground" />
            Turnover
          </h3>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-nums">
                {space.turnTimeMinutes ?? "—"}
              </span>
              {space.turnTimeMinutes != null && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  min
                </span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">
              {isBookable
                ? "Average time a party occupies this table before turnover."
                : "Turnover only applies to bookable tables and seats."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LayoutTab({ space }: { space: Space }) {
  const hasPosition = space.posX != null && space.posY != null;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Visual styling
          </h3>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <DetailRow
              label="Color"
              value={
                space.color ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full border border-line"
                      style={{ backgroundColor: space.color }}
                    />
                    <span className="font-mono text-[11.5px]">{space.color}</span>
                  </span>
                ) : null
              }
            />
            <DetailRow label="Floor plan" value={space.floorPlanName} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            Position
          </h3>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <DetailRow
              label="X coordinate"
              value={space.posX != null ? space.posX.toString() : null}
            />
            <DetailRow
              label="Y coordinate"
              value={space.posY != null ? space.posY.toString() : null}
            />
          </div>
          {!hasPosition && (
            <p className="text-[12px] text-muted-foreground">
              Drop this space onto a floor plan to set its position.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: "pos" | "neg" | "neutral";
}) {
  const toneClass =
    tone === "pos"
      ? "text-pos"
      : tone === "neg"
        ? "text-neg"
        : "text-ink";
  return (
    <div className="bg-card px-4 py-4 md:px-5">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        <span className="opacity-70">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div
        className={`flex items-baseline gap-1.5 text-[20px] font-semibold leading-none tracking-[-0.025em] tabular-nums ${toneClass}`}
      >
        <span>{value}</span>
        {unit && (
          <span className="font-mono text-[11px] font-normal tracking-[0.02em] text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const isEmpty =
    value == null || (typeof value === "string" && value.trim() === "");
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink sm:text-right">
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </dd>
    </div>
  );
}
