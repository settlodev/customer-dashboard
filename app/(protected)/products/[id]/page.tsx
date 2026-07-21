import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/actions/product-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getItemSalesSummary } from "@/lib/actions/item-sales-actions";
import { getUnits } from "@/lib/actions/unit-actions";
// Reads come from the Reports Service so the Inventory Service stays out
// of the read path. Mutations (reorder config, threshold writes) still go
// through the Inventory Service via {@code inventory-balance-actions}.
import {
  getBalanceSummariesByLocation,
  getVariantsSnapshotHistory,
  getAuditLogByEntity,
} from "@/lib/actions/inventory-analytics-reports-actions";
import { getProductRecipeSummary } from "@/lib/actions/bom-rule-actions";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { Product } from "@/types/product/type";
import type { InventoryBalanceSummary } from "@/types/inventory-balance/summary-type";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type { ProductRecipeSummary } from "@/types/bom/type";
import { ProductDetailView } from "./product-detail-view";
import { ProductDetailActions } from "./product-detail-actions";
import { BulkBarcodeGenerator } from "@/components/widgets/products/bulk-barcode-generator";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string; from?: string; to?: string }>;

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { tab, from, to } = await searchParams;

  // /products/new is now a sibling route — bounce there if someone
  // links to /products/new through the dynamic segment.
  if (id === "new") redirect("/products/new");

  let product: Product | null = null;
  try {
    product = await getProduct(id);
    if (!product) notFound();
  } catch {
    throw new Error("Failed to load product details");
  }

  const [location, currency, units] = await Promise.all([
    getCurrentLocation().catch(() => null),
    getLocationCurrency(),
    getUnits().catch(() => []),
  ]);

  const locationId = location?.id ?? null;

  // Sales window honors the ?from/?to range carried through from the sales
  // report, defaulting to the current month to match the report and the other
  // reporting screens. The 90-day snapshot window (charts) stays separate.
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const toDate = now.toISOString().split("T")[0];
  const fromDate90 = ninetyDaysAgo.toISOString().split("T")[0];
  const salesFrom = from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const salesTo = to ?? format(endOfMonth(now), "yyyy-MM-dd");

  // Linked stock variants — drives balance + snapshot fetches.
  const linkedStockVariantIds = Array.from(
    new Set(
      product.variants
        .filter((v) => v.stockLinkType === "DIRECT" && v.stockVariantId)
        .map((v) => v.stockVariantId as string),
    ),
  );

  // Recipe-mode variants: anything tracked but without a direct link is
  // resolved via a BOM rule. The /recipe-summary endpoint returns one
  // round-trip with the active rule + ingredient availability per variant
  // so the Inventory tab can render the recipe section without N+1 calls.
  const hasRecipeVariants =
    product.trackStock &&
    product.variants.some(
      (v) =>
        v.archivedAt == null &&
        !v.unlimited &&
        v.stockLinkType == null,
    );

  // Parallel fetches against the Reports Service. All have empty/null
  // fallbacks server-side so the page renders even when any individual
  // request fails. Snapshots come back in a single bundled response —
  // saves N round-trips for multi-variant products.
  const [scopedBalances, salesSummary, bundledSnapshots, auditPage, recipeSummary] =
    await Promise.all([
      locationId && linkedStockVariantIds.length > 0
        ? getBalanceSummariesByLocation(locationId, linkedStockVariantIds)
        : Promise.resolve([] as InventoryBalanceSummary[]),
      locationId
        ? getItemSalesSummary(locationId, salesFrom, salesTo)
        : Promise.resolve(null),
      linkedStockVariantIds.length > 0
        ? getVariantsSnapshotHistory(linkedStockVariantIds, fromDate90, toDate)
        : Promise.resolve([] as InventorySnapshot[]),
      getAuditLogByEntity("PRODUCT", id, 0, 50),
      hasRecipeVariants
        ? getProductRecipeSummary(id)
        : Promise.resolve({
            productId: id,
            locationId: locationId ?? "",
            variants: [],
          } as ProductRecipeSummary),
    ]);

  // Balance map for the linked stock variants only — already filtered
  // server-side, so just key by stockVariantId.
  const stockBalanceMap: Record<string, InventoryBalanceSummary> = {};
  for (const b of scopedBalances) {
    stockBalanceMap[b.stockVariantId] = b;
  }

  // Snapshot map keyed by stockVariantId — group the bundled response.
  const variantSnapshotMap: Record<string, InventorySnapshot[]> = {};
  for (const sv of linkedStockVariantIds) {
    variantSnapshotMap[sv] = [];
  }
  for (const snap of bundledSnapshots) {
    const list = variantSnapshotMap[snap.stockVariantId];
    if (list) list.push(snap);
  }

  const isArchived = product.archivedAt != null;
  const isDraft = product.lifecycleStatus === "DRAFT";

  const statusLabel = isArchived
    ? "Archived"
    : isDraft
      ? "Draft"
      : product.active
        ? "Active"
        : "Inactive";
  const statusClass = isArchived
    ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    : isDraft
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
      : product.active
        ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";

  const subtitleParts = [
    product.categories?.[0]?.name,
    // Department rolls up from the category; show the first one that has it.
    product.categories?.find((c) => c.departmentName)?.departmentName,
    product.brandName,
  ].filter(Boolean) as string[];

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Products", href: "/products" },
          { title: product.name },
        ]}
      />
      <PageHeader
        title={product.name}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
          >
            {statusLabel}
          </span>
        }
        subtitle={
          subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined
        }
        actions={
          <>
            <BulkBarcodeGenerator
              scope="product"
              productId={product.id}
              productName={product.name}
            />
            <Button asChild variant="outline" size="sm">
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <ProductDetailActions product={product} />
          </>
        }
      />

      <PageBody>
        <ProductDetailView
          product={product}
          stockBalanceMap={stockBalanceMap}
          salesItems={salesSummary?.items ?? []}
          variantSnapshotMap={variantSnapshotMap}
          auditEntries={auditPage.content ?? []}
          currency={currency}
          recipeSummary={recipeSummary}
          units={units}
          initialTab={tab}
          from={salesFrom}
          to={salesTo}
        />
      </PageBody>
    </PageShell>
  );
}
