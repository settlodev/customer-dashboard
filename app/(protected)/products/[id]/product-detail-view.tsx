"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  ChevronRight,
  DollarSign,
  Globe,
  History,
  Layers,
  LineChart as LineChartIcon,
  Package,
  Percent,
  Puzzle,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck,
  TrendingUp,
  User,
  Utensils,
} from "lucide-react";
import type { Product, ProductVariant } from "@/types/product/type";
import type { InventoryBalanceSummary } from "@/types/inventory-balance/summary-type";
import type { ItemSalesAggregate } from "@/types/item-sales/type";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type { AuditLogEntry } from "@/types/audit-log/type";
import type { ProductRecipeSummary, VariantRecipeSummary } from "@/types/bom/type";
import type { UnitOfMeasure } from "@/types/unit/type";
import { AUDIT_ACTION_LABELS } from "@/types/audit-log/type";
import {
  PRICING_STRATEGY_OPTIONS,
  TAX_CLASS_OPTIONS,
  LIFECYCLE_STATUS_OPTIONS,
} from "@/types/catalogue/enums";
import { Money } from "@/components/widgets/money";
import { BarcodeManager } from "@/components/widgets/barcode-manager";
import { assignProductBarcode } from "@/lib/actions/product-barcode-actions";
import {
  QtyOnHandChart,
  StockValueChart,
} from "@/components/widgets/inventory/stock-item-charts";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { format } from "date-fns";

interface Props {
  product: Product;
  /** Per-stock-variant balance for DIRECT-linked product variants. Keyed by stockVariantId. */
  stockBalanceMap: Record<string, InventoryBalanceSummary>;
  /** 30-day item-sales rows for this product (server-filtered to product's variants). */
  salesItems: ItemSalesAggregate[];
  /** 90-day daily snapshots per linked stock variant. Keyed by stockVariantId. */
  variantSnapshotMap: Record<string, InventorySnapshot[]>;
  /** Audit trail (entityType=PRODUCT). */
  auditEntries: AuditLogEntry[];
  /** Location currency — labels every cost/value display. */
  currency: string;
  /** Per-variant recipe payload — empty when the product has no RECIPE-mode variants. */
  recipeSummary: ProductRecipeSummary;
  /**
   * Full units-of-measure catalogue, fetched server-side (page.tsx) alongside
   * the page's other data. Resolves a DIRECT variant's `saleUnitId` to a
   * display name — the backend response carries only the id.
   */
  units: UnitOfMeasure[];
  /** Tab to open on mount (from `?tab=`), e.g. "sales" when arriving from a report. */
  initialTab?: string;
  /** Sales-window start (yyyy-MM-dd) — scopes the sales KPIs + Sales tab. */
  from: string;
  /** Sales-window end (yyyy-MM-dd). */
  to: string;
}

const TABS = [
  { key: "overview", label: "Overview", icon: Package },
  { key: "variants", label: "Variants", icon: Layers },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "sales", label: "Sales", icon: ShoppingCart },
  { key: "charts", label: "Charts", icon: LineChartIcon },
  { key: "extras", label: "Modifiers & Addons", icon: Puzzle },
  { key: "audit", label: "Audit", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Compose customer-facing "Coca-Cola 300ml" style name for a single variant
// row, mirroring the products-list dedup so the detail view reads the same
// way the list did.
function variantDisplay(product: Product, variant: ProductVariant): string {
  const p = product.name.trim();
  const v = (variant.displayName || variant.name || "").trim();
  if (!v) return p;
  if (v.toLowerCase() === p.toLowerCase()) return p;
  if (product.variants.length === 1 && v.toLowerCase() === "default") return p;
  if (v.toLowerCase().includes(p.toLowerCase())) return v;
  return `${p} ${v}`;
}

function sellabilityLabel(v: ProductVariant): {
  label: string;
  tone: "neutral" | "info" | "success" | "warn";
} {
  if (v.unlimited) return { label: "Unlimited", tone: "info" };
  if (v.stockLinkType === "DIRECT") return { label: "Direct stock", tone: "success" };
  return { label: "Recipe / BOM", tone: "warn" };
}

function totalAvailableQty(
  product: Product,
  maxSellableByVariant: Map<string, number>,
): number | "Unlimited" {
  let any = false;
  let total = 0;
  for (const v of product.variants) {
    if (v.archivedAt != null) continue;
    if (v.unlimited) return "Unlimited";
    // Recipe variants carry no qtyAvailable/availableQuantity — fall back to
    // the BOM weakest-link buildable count from the recipe summary.
    const q =
      v.qtyAvailable ??
      v.availableQuantity ??
      maxSellableByVariant.get(v.id) ??
      0;
    total += Math.max(0, q);
    any = true;
  }
  return any ? total : 0;
}

export function ProductDetailView({
  product,
  stockBalanceMap,
  salesItems,
  variantSnapshotMap,
  auditEntries,
  currency,
  recipeSummary,
  units,
  initialTab,
  from,
  to,
}: Props) {
  const [tab, setTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab)
      ? (initialTab as TabKey)
      : "overview",
  );

  // ── Aggregates for KPI strip ────────────────────────────────────────
  const activeVariants = product.variants.filter((v) => v.archivedAt == null);
  const archivedVariantsCount = product.variants.length - activeVariants.length;

  // Recipe (BOM) variants have no inventory_balance row; their availability
  // and value derive from the BOM weakest-link yield (maxSellable) in the
  // recipe summary. Lookup keyed by product-variant id.
  const maxSellableByVariant = new Map<string, number>();
  for (const vr of recipeSummary.variants) {
    if (vr.maxSellable != null) {
      maxSellableByVariant.set(vr.variantId, vr.maxSellable);
    }
  }

  const available = totalAvailableQty(product, maxSellableByVariant);

  // Stock value = Σ(cost × qty). DIRECT variants use on-hand balance × unit
  // cost; recipe variants hold no finished-goods stock, so we value what can
  // be built right now — buildable count (maxSellable) × BOM unit cost.
  let costBasis = 0;
  for (const v of activeVariants) {
    const cost = v.currentCost ?? v.costPrice ?? 0;
    if (cost <= 0) continue;
    if (v.stockLinkType === "DIRECT" && v.stockVariantId) {
      const bal = stockBalanceMap[v.stockVariantId];
      if (bal) {
        costBasis += bal.quantityOnHand * cost;
      }
    } else if (v.stockLinkType == null && !v.unlimited) {
      const buildable = maxSellableByVariant.get(v.id) ?? 0;
      if (buildable > 0) {
        costBasis += buildable * cost;
      }
    }
  }

  // Sales aggregates — filter to this product's variant ids.
  const variantIds = new Set(product.variants.map((v) => v.id));
  const productSales = salesItems.filter((i) => variantIds.has(i.variantId));
  const totalQtySold = productSales.reduce((s, i) => s + i.quantitySold, 0);
  const totalGross = productSales.reduce((s, i) => s + i.grossSales, 0);
  const totalNet = productSales.reduce((s, i) => s + i.netSales, 0);
  const totalCost = productSales.reduce((s, i) => s + i.totalCost, 0);
  const totalProfit = productSales.reduce((s, i) => s + i.grossProfit, 0);
  const totalDiscount = productSales.reduce((s, i) => s + i.totalDiscount, 0);
  const profitMargin = totalNet > 0 ? (totalProfit / totalNet) * 100 : 0;

  const rangeLabel =
    from === to
      ? format(new Date(from), "MMM d, yyyy")
      : `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <div className="space-y-6">
      {/* ── Sales period selector (scopes the sales KPIs + Sales tab) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          Sales period
        </span>
        <OrdersDateFilter from={from} to={to} />
      </div>

      {/* ── Summary KPIs ──────────────────────────────────────── */}
      <KpiStrip cols={6}>
        <KpiCard
          icon={<Layers className="h-3 w-3" />}
          label="Variants"
          value={activeVariants.length.toLocaleString()}
          delta={
            archivedVariantsCount > 0
              ? `${archivedVariantsCount} archived`
              : "All active"
          }
          deltaTone={archivedVariantsCount > 0 ? "neutral" : "pos"}
        />
        <KpiCard
          icon={<ShieldCheck className="h-3 w-3" />}
          label="Available"
          value={
            available === "Unlimited"
              ? "Unlimited"
              : available.toLocaleString()
          }
          unit={available === "Unlimited" ? undefined : "units"}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Stock value"
          value={
            costBasis > 0
              ? costBasis.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : "—"
          }
          unit={costBasis > 0 ? currency : undefined}
        />
        <KpiCard
          icon={<ShoppingCart className="h-3 w-3" />}
          label="Qty sold"
          value={totalQtySold > 0 ? totalQtySold.toLocaleString() : "—"}
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Net sales"
          value={
            totalNet > 0
              ? totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : "—"
          }
          unit={totalNet > 0 ? currency : undefined}
          delta={
            totalDiscount > 0
              ? `-${totalDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })} disc`
              : undefined
          }
          deltaTone={totalDiscount > 0 ? "neg" : "neutral"}
        />
        <KpiCard
          icon={<Percent className="h-3 w-3" />}
          label="Margin"
          value={totalNet > 0 ? `${profitMargin.toFixed(1)}%` : "—"}
          delta={
            totalProfit !== 0
              ? `${totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`
              : undefined
          }
          deltaTone={
            profitMargin >= 20
              ? "pos"
              : profitMargin >= 10
                ? "neutral"
                : profitMargin > 0
                  ? "neg"
                  : "neutral"
          }
        />
      </KpiStrip>

      {/* ── Tabs ──────────────────────────────────────────────────
          Same segmented underline pattern as the stock detail screen. */}
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            let badge: string | null = null;
            if (t.key === "variants") badge = String(activeVariants.length);
            if (t.key === "sales" && productSales.length > 0)
              badge = String(productSales.length);
            if (t.key === "extras") {
              const n =
                (product.modifierGroups?.length ?? 0) +
                (product.addonGroups?.length ?? 0);
              if (n > 0) badge = String(n);
            }
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
                {badge && (
                  <span
                    className={`rounded-[3px] px-1.5 font-mono text-[9.5px] tracking-[0.02em] ${
                      isActive
                        ? "border border-line bg-card text-ink-3"
                        : "bg-canvas text-muted-foreground"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      {tab === "overview" && <OverviewTab product={product} />}
      {tab === "variants" && (
        <VariantsTab
          product={product}
          currency={currency}
          recipeSummary={recipeSummary}
        />
      )}
      {tab === "inventory" && (
        <InventoryTab
          product={product}
          stockBalanceMap={stockBalanceMap}
          currency={currency}
          recipeSummary={recipeSummary}
          units={units}
        />
      )}
      {tab === "sales" && (
        <SalesTab
          salesItems={productSales}
          totals={{
            totalQtySold,
            totalGross,
            totalNet,
            totalCost,
            totalProfit,
            totalDiscount,
            profitMargin,
          }}
          currency={currency}
          rangeLabel={rangeLabel}
        />
      )}
      {tab === "charts" && (
        <ChartsTab
          product={product}
          variantSnapshotMap={variantSnapshotMap}
          currency={currency}
        />
      )}
      {tab === "extras" && <ExtrasTab product={product} />}
      {tab === "audit" && <AuditTab entries={auditEntries} />}
    </div>
  );
}

// ── Overview tab ────────────────────────────────────────────────────

function OverviewTab({ product }: { product: Product }) {
  const validImage =
    product.imageUrl &&
    (product.imageUrl.startsWith("http://") ||
      product.imageUrl.startsWith("https://") ||
      product.imageUrl.startsWith("/"));

  const taxClassLabel =
    TAX_CLASS_OPTIONS.find((o) => o.value === product.taxClass)?.label ??
    product.taxClass ??
    null;
  const lifecycleLabel =
    LIFECYCLE_STATUS_OPTIONS.find((o) => o.value === product.lifecycleStatus)
      ?.label ??
    (product.lifecycleStatus === "DRAFT" ? "Draft" : product.lifecycleStatus);

  // Departments live on categories (a product can span several), so surface
  // the distinct set rolled up from its categories rather than a single
  // product-level field. Deduped by id, ordered by first appearance.
  const departmentNames = Array.from(
    new Map(
      (product.categories ?? [])
        .filter((c) => c.departmentId && c.departmentName)
        .map((c) => [c.departmentId, c.departmentName] as const),
    ).values(),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Image + headline */}
      <Card className="lg:col-span-1 overflow-hidden">
        <div className="relative aspect-square w-full bg-canvas">
          {validImage ? (
            <Image
              src={product.imageUrl as string}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Package className="h-10 w-10" />
            </div>
          )}
        </div>
        <CardContent className="space-y-2 pt-4">
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          {product.description && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {product.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Product info */}
      <Card className="lg:col-span-2">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            Product information
          </h3>

          {/* Hairline grid: paint the wrapper bg-line and let cells paint
              bg-card on top of a 1px gap — produces clean dividers both
              between rows and between the two columns at sm+, with no
              orphan border on the last row regardless of item count. */}
          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow label="Brand" value={product.brandName} />
              <DetailRow
                label="Department"
                value={departmentNames.length ? departmentNames.join(", ") : null}
              />
              <DetailRow
                label="Category"
                value={
                  product.categories?.length
                    ? product.categories.map((c) => c.name).join(", ")
                    : null
                }
              />
              <DetailRow
                label="Native currency"
                value={product.nativeCurrency}
              />
              <DetailRow label="Tax class" value={taxClassLabel} />
              <DetailBoolRow
                label="Tax inclusive"
                value={product.taxInclusive}
              />
              <DetailBoolRow label="Sell online" value={product.sellOnline} />
              <DetailBoolRow label="Track stock" value={product.trackStock} />
              <DetailRow label="Lifecycle" value={lifecycleLabel} />
              <DetailRow
                label="Created"
                value={new Date(product.createdAt).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" },
                )}
              />
              <DetailRow
                label="Updated"
                value={new Date(product.updatedAt).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" },
                )}
              />
              {product.replacementProductId && (
                <DetailRow
                  label="Replaced by"
                  value={
                    <Link
                      href={`/products/${product.replacementProductId}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      View replacement
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  }
                />
              )}
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Uniform row used inside the hairline grid above. Stacks label-over-value
// on small screens so long values never crowd the label column, then
// switches to a tight label-left / value-right row at sm+.
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  const isEmpty =
    value == null || (typeof value === "string" && value.trim() === "");
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink sm:text-right">
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </dd>
    </div>
  );
}

function DetailBoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {label}
      </dt>
      <dd>
        <Badge
          variant={value ? "default" : "secondary"}
          className="text-[10px]"
        >
          {value ? "Yes" : "No"}
        </Badge>
      </dd>
    </div>
  );
}

// ── Variants tab ────────────────────────────────────────────────────

function VariantsTab({
  product,
  currency,
  recipeSummary,
}: {
  product: Product;
  currency: string;
  recipeSummary: ProductRecipeSummary;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-muted-foreground" />
          Variants
        </h3>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>SKU / Barcode</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Sellability</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants.map((v) => {
                const isArchived = v.archivedAt != null;
                const display = variantDisplay(product, v);
                const cost = v.currentCost ?? v.costPrice ?? null;
                const margin =
                  v.price > 0 && cost != null
                    ? ((v.price - cost) / v.price) * 100
                    : null;
                const sellability = sellabilityLabel(v);
                const recipeMax = recipeSummary.variants.find(
                  (r) => r.variantId === v.id,
                )?.maxSellable;
                const available: number | "Unlimited" | null = v.unlimited
                  ? v.availableQuantity ?? "Unlimited"
                  : v.qtyAvailable ?? recipeMax ?? null;
                const pricingLabel =
                  PRICING_STRATEGY_OPTIONS.find(
                    (o) => o.value === v.pricingStrategy,
                  )?.label ?? v.pricingStrategy;
                const variantCurrency = v.nativeCurrency || currency;

                return (
                  <TableRow key={v.id} className={isArchived ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="min-w-0">
                        <span className="font-medium">{display}</span>
                        {v.autoRetireOnSellout && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 font-medium">
                            Auto-retire
                          </span>
                        )}
                        {Object.keys(v.currencyPriceOverrides || {}).length >
                          0 && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Globe className="h-2.5 w-2.5" />
                            Overrides:{" "}
                            {Object.entries(v.currencyPriceOverrides)
                              .map(
                                ([cur, p]) =>
                                  `${cur} ${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                              )
                              .join(" · ")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {v.sku && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">SKU: </span>
                            <span className="font-mono">{v.sku}</span>
                          </div>
                        )}
                        <BarcodeManager
                          variantId={v.id}
                          variantName={display}
                          barcode={v.barcode}
                          sku={v.sku}
                          disabled={isArchived}
                          assign={assignProductBarcode}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <Money amount={v.price} currency={variantCurrency} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {cost != null ? (
                        <Money amount={cost} currency={variantCurrency} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {margin != null ? (
                        <span
                          className={
                            margin >= 20
                              ? "text-green-600 dark:text-green-400"
                              : margin >= 10
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }
                        >
                          {margin.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {pricingLabel}
                    </TableCell>
                    <TableCell>
                      <SellabilityBadge sellability={sellability} variant={v} />
                    </TableCell>
                    <TableCell className="text-right">
                      {available === "Unlimited" ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          Unlimited
                        </span>
                      ) : available != null ? (
                        <span
                          className={
                            available <= 0
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : ""
                          }
                        >
                          {available.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          isArchived
                            ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            : v.active
                              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        }`}
                      >
                        {isArchived ? "Archived" : v.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SellabilityBadge({
  sellability,
  variant,
}: {
  sellability: { label: string; tone: "neutral" | "info" | "success" | "warn" };
  variant: ProductVariant;
}) {
  const toneClass =
    sellability.tone === "info"
      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
      : sellability.tone === "success"
        ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
        : sellability.tone === "warn"
          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  const detail =
    variant.stockLinkType === "DIRECT" && variant.stockVariantName
      ? variant.stockVariantName
      : null;

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClass}`}
      >
        {sellability.label}
      </span>
      {detail && (
        <span className="text-[10px] text-muted-foreground">
          {detail}
          {variant.directQuantity != null && variant.directQuantity !== 1 && (
            <> · {variant.directQuantity}/sale</>
          )}
        </span>
      )}
    </div>
  );
}

// ── Inventory tab ───────────────────────────────────────────────────

function InventoryTab({
  product,
  stockBalanceMap,
  currency,
  recipeSummary,
  units,
}: {
  product: Product;
  stockBalanceMap: Record<string, InventoryBalanceSummary>;
  currency: string;
  recipeSummary: ProductRecipeSummary;
  units: UnitOfMeasure[];
}) {
  const trackedVariants = product.variants.filter(
    (v) =>
      v.archivedAt == null &&
      v.stockLinkType === "DIRECT" &&
      v.stockVariantId != null,
  );

  const recipeVariants = recipeSummary.variants ?? [];

  if (trackedVariants.length === 0 && recipeVariants.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Boxes className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No tracked variants. Inventory data appears for variants linked
            directly to a stock item or driven by a recipe.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Per-product roll-up across linked stock variants
  let totalOnHand = 0;
  let totalAvailable = 0;
  let totalReserved = 0;
  let totalInTransit = 0;
  let totalValue = 0;
  for (const v of trackedVariants) {
    const bal = stockBalanceMap[v.stockVariantId!];
    if (!bal) continue;
    totalOnHand += bal.quantityOnHand;
    totalAvailable += bal.availableQuantity;
    totalReserved += bal.reservedQuantity;
    totalInTransit += bal.inTransitQuantity;
    totalValue += bal.quantityOnHand * (bal.averageCost ?? 0);
  }

  return (
    <div className="space-y-6">
      {trackedVariants.length > 0 && (
        <KpiStrip cols={5}>
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="On hand"
            value={totalOnHand.toLocaleString()}
          />
          <KpiCard
            icon={<ShieldCheck className="h-3 w-3" />}
            label="Available"
            value={totalAvailable.toLocaleString()}
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Reserved"
            value={
              totalReserved > 0 ? totalReserved.toLocaleString() : "—"
            }
            deltaTone={totalReserved > 0 ? "neg" : "neutral"}
          />
          <KpiCard
            icon={<Truck className="h-3 w-3" />}
            label="In transit"
            value={
              totalInTransit > 0 ? totalInTransit.toLocaleString() : "—"
            }
            deltaTone="neutral"
          />
          <KpiCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Value"
            value={
              totalValue > 0
                ? totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })
                : "—"
            }
            unit={totalValue > 0 ? currency : undefined}
          />
        </KpiStrip>
      )}

      {recipeVariants.length > 0 && (
        <RecipeVariantsCard variants={recipeVariants} />
      )}

      {trackedVariants.length > 0 && (
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3">Linked stock variants</h3>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Linked stock</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">In transit</TableHead>
                  <TableHead className="text-right">Avg. cost</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackedVariants.map((v) => {
                  const bal = stockBalanceMap[v.stockVariantId!];
                  const value =
                    (bal?.quantityOnHand ?? 0) * (bal?.averageCost ?? 0);
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">
                        {variantDisplay(product, v)}
                      </TableCell>
                      <TableCell>
                        {v.stockVariantName ? (
                          <Link
                            href={`/stock-variants/${v.stockVariantId}`}
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {v.stockVariantName}
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {(() => {
                          const unitName = v.saleUnitId
                            ? units.find((u) => u.id === v.saleUnitId)?.name
                            : undefined;
                          // "1 Bottle per sale" is worth showing even at
                          // quantity 1 — the unit is the whole point. Without a
                          // unit, keep the old "only when != 1" rule.
                          if (v.saleUnitQuantity != null && unitName) {
                            return (
                              <span className="block text-[10px] text-muted-foreground">
                                {v.saleUnitQuantity} {unitName} per sale
                              </span>
                            );
                          }
                          if (v.directQuantity != null && v.directQuantity !== 1) {
                            return (
                              <span className="block text-[10px] text-muted-foreground">
                                {v.directQuantity} per sale
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          bal?.outOfStock
                            ? "text-red-600 dark:text-red-400"
                            : bal?.lowStock
                              ? "text-amber-600 dark:text-amber-400"
                              : ""
                        }`}
                      >
                        {(bal?.quantityOnHand ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(bal?.availableQuantity ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(bal?.reservedQuantity ?? 0) > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {bal!.reservedQuantity.toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(bal?.inTransitQuantity ?? 0) > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            {bal!.inTransitQuantity.toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {bal?.averageCost != null ? (
                          <Money amount={bal.averageCost} currency={currency} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {value > 0 ? (
                          <Money amount={value} currency={currency} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

// ── Recipe-driven variants (Inventory tab subsection) ──────────────

function RecipeVariantsCard({
  variants,
}: {
  variants: VariantRecipeSummary[];
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Utensils className="h-4 w-4 text-muted-foreground" />
            Recipe-driven variants
          </h3>
          <span className="text-xs text-muted-foreground">
            Availability follows the weakest ingredient
          </span>
        </div>
        <div className="space-y-4">
          {variants.map((v) => (
            <RecipeVariantRow key={v.variantId} variant={v} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecipeVariantRow({ variant }: { variant: VariantRecipeSummary }) {
  if (variant.ruleId == null) {
    return (
      <div className="rounded-md border border-amber-200/60 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{variant.variantName}</span>
          <Badge variant="outline" className="text-amber-700 dark:text-amber-300">
            No recipe attached
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          This variant is recipe-driven but has no active rule. Attach one
          from the Consumption Rules page so it can be sold.
        </p>
      </div>
    );
  }

  const max = variant.maxSellable ?? 0;
  const tone =
    max <= 0
      ? "text-red-600 dark:text-red-400"
      : max < 5
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{variant.variantName}</div>
          <Link
            href={`/bom-rules/${variant.ruleId}`}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            {variant.ruleName ?? "Rule"}
            {variant.revisionNumber ? ` · ${variant.revisionNumber}` : ""}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${tone}`}>
            {max.toLocaleString()} sellable
          </div>
          {max <= 0 && variant.limitingStockVariantName && (
            <div className="text-[10px] text-muted-foreground">
              {variant.limitingStockVariantName} short
            </div>
          )}
        </div>
      </div>
      {variant.ingredients.length > 0 && (
        <div className="mt-3 rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead className="text-right">Per sale</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Yield</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variant.ingredients.map((ing) => {
                const yieldQty = ing.quantity > 0
                  ? Math.floor(ing.available / ing.quantity)
                  : 0;
                const isBottleneck =
                  variant.limitingStockVariantId != null &&
                  variant.limitingStockVariantId === ing.stockVariantId;
                return (
                  <TableRow key={ing.stockVariantId}>
                    <TableCell className="font-medium">
                      {ing.stockVariantName ?? "—"}
                      {ing.optional && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          (optional)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {ing.quantity.toLocaleString()}
                      {ing.unitName ? ` ${ing.unitName}` : ""}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        ing.available <= 0
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }`}
                    >
                      {ing.available.toLocaleString()}
                      {ing.unitName ? ` ${ing.unitName}` : ""}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        isBottleneck
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }`}
                    >
                      {yieldQty.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Sales tab ──────────────────────────────────────────────────────

function SalesTab({
  salesItems,
  totals,
  currency,
  rangeLabel,
}: {
  salesItems: ItemSalesAggregate[];
  totals: {
    totalQtySold: number;
    totalGross: number;
    totalNet: number;
    totalCost: number;
    totalProfit: number;
    totalDiscount: number;
    profitMargin: number;
  };
  currency: string;
  rangeLabel: string;
}) {
  if (salesItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No sales recorded for this product in {rangeLabel}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <KpiStrip cols={6}>
        <KpiCard
          icon={<ShoppingCart className="h-3 w-3" />}
          label="Qty sold"
          value={totals.totalQtySold.toLocaleString()}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Gross sales"
          value={totals.totalGross.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Net sales"
          value={totals.totalNet.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
          delta={
            totals.totalDiscount > 0
              ? `-${totals.totalDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })} disc`
              : undefined
          }
          deltaTone={totals.totalDiscount > 0 ? "neg" : "neutral"}
        />
        <KpiCard
          icon={<ArrowUpRight className="h-3 w-3" />}
          label="COGS"
          value={totals.totalCost.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Gross profit"
          value={totals.totalProfit.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
          deltaTone={totals.totalProfit >= 0 ? "pos" : "neg"}
        />
        <KpiCard
          icon={<Percent className="h-3 w-3" />}
          label="Margin"
          value={`${totals.profitMargin.toFixed(1)}%`}
          deltaTone={
            totals.profitMargin >= 20
              ? "pos"
              : totals.profitMargin >= 10
                ? "neutral"
                : "neg"
          }
        />
      </KpiStrip>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3">
            Per-variant sales — {rangeLabel}
          </h3>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Qty sold</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">COGS</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesItems.map((item, idx) => {
                  const margin =
                    item.netSales > 0
                      ? (item.grossProfit / item.netSales) * 100
                      : 0;
                  return (
                    <TableRow key={`${item.variantId}-${idx}`}>
                      <TableCell className="font-medium">
                        {item.itemName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.departmentName || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantitySold.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.grossSales.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.totalDiscount > 0
                          ? item.totalDiscount.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.netSales.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.totalCost.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          item.grossProfit >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {item.grossProfit.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            margin >= 20
                              ? "text-green-600 dark:text-green-400"
                              : margin >= 10
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }
                        >
                          {margin.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Charts tab ──────────────────────────────────────────────────────

function ChartsTab({
  product,
  variantSnapshotMap,
  currency,
}: {
  product: Product;
  variantSnapshotMap: Record<string, InventorySnapshot[]>;
  currency: string;
}) {
  const trackedVariants = product.variants.filter(
    (v) =>
      v.archivedAt == null &&
      v.stockLinkType === "DIRECT" &&
      v.stockVariantId != null,
  );

  const [variantId, setVariantId] = useState<string>(
    trackedVariants[0]?.stockVariantId ?? "",
  );

  if (trackedVariants.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <LineChartIcon className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Charts populate from daily inventory snapshots — only available for
            variants linked directly to a stock item.
          </p>
        </CardContent>
      </Card>
    );
  }

  const snapshots = variantSnapshotMap[variantId] ?? [];

  return (
    <div className="space-y-6">
      {trackedVariants.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Variant
          </span>
          <div className="inline-flex flex-wrap items-center gap-1 bg-muted p-1 rounded-lg">
            {trackedVariants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.stockVariantId!)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  variantId === v.stockVariantId
                    ? "bg-background shadow-sm font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {variantDisplay(product, v)}
              </button>
            ))}
          </div>
        </div>
      )}

      {snapshots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LineChartIcon className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No daily snapshots in the last 90 days.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <QtyOnHandChart snapshots={snapshots} />
          <StockValueChart snapshots={snapshots} currency={currency} />
        </div>
      )}
    </div>
  );
}

// ── Modifiers & Addons tab ──────────────────────────────────────────

function ExtrasTab({ product }: { product: Product }) {
  const hasModifiers = (product.modifierGroups?.length ?? 0) > 0;
  const hasAddons = (product.addonGroups?.length ?? 0) > 0;

  if (!hasModifiers && !hasAddons) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Puzzle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No modifier groups or addons attached. Attach groups from the edit
            screen to let staff customise the item at checkout.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Utensils className="h-4 w-4 text-muted-foreground" />
            Modifier groups ({product.modifierGroups?.length ?? 0})
          </h3>
          {hasModifiers ? (
            <div className="space-y-3">
              {product.modifierGroups.map((mg) => (
                <div
                  key={mg.id}
                  className="rounded-lg border border-line bg-card p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{mg.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {mg.selectionType === "SINGLE" ? "Single" : "Multi"} ·
                        min {mg.minSelections} · max {mg.maxSelections}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {mg.options.length} options
                    </Badge>
                  </div>
                  {mg.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {mg.options.slice(0, 8).map((opt) => (
                        <span
                          key={opt.id}
                          className="inline-flex items-center gap-1 rounded border border-line bg-canvas px-1.5 py-0.5 text-[11px]"
                        >
                          {opt.name}
                          {opt.priceAdjustment !== 0 && (
                            <span
                              className={
                                opt.priceAdjustment > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              {opt.priceAdjustment > 0 ? "+" : ""}
                              {opt.priceAdjustment}
                            </span>
                          )}
                        </span>
                      ))}
                      {mg.options.length > 8 && (
                        <span className="text-[11px] text-muted-foreground">
                          +{mg.options.length - 8} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No modifier groups attached.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Addon groups ({product.addonGroups?.length ?? 0})
          </h3>
          {hasAddons ? (
            <div className="space-y-3">
              {product.addonGroups.map((ag) => (
                <div
                  key={ag.id}
                  className="rounded-lg border border-line bg-card p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{ag.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        min {ag.minSelections} · max {ag.maxSelections}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {ag.items.length} items
                    </Badge>
                  </div>
                  {ag.items.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ag.items.slice(0, 8).map((it) => (
                        <span
                          key={it.id}
                          className="inline-flex items-center gap-1 rounded border border-line bg-canvas px-1.5 py-0.5 text-[11px]"
                        >
                          {it.productVariantDisplayName ||
                            it.productVariantName}
                          {it.priceOverride != null &&
                            it.priceOverride !== it.price && (
                              <span className="text-amber-600 dark:text-amber-400">
                                @ {it.priceOverride.toLocaleString()}
                              </span>
                            )}
                        </span>
                      ))}
                      {ag.items.length > 8 && (
                        <span className="text-[11px] text-muted-foreground">
                          +{ag.items.length - 8} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No addon groups attached.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Audit tab ───────────────────────────────────────────────────────

function AuditTab({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No audit trail yet. Edits, archives, deletes, and lifecycle
            transitions will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold mb-3">Recent changes</h3>
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {entry.entityType}
                  </TableCell>
                  <TableCell>
                    {entry.staffName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {entry.staffName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[360px]">
                    {entry.details ? (
                      <span className="line-clamp-2 whitespace-pre-wrap">
                        {entry.details}
                      </span>
                    ) : (
                      "—"
                    )}
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
