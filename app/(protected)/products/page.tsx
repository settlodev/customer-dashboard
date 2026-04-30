import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/product/column";
import {
  Product,
  ProductVariant,
  ProductVariantRow,
} from "@/types/product/type";
import { searchProducts } from "@/lib/actions/product-actions";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { ProductCSVDialog } from "@/components/csv/CSVImport";
import { Plus } from "lucide-react";
import TableExport from "@/components/widgets/export";
import { ProductStatusTabs } from "@/components/tables/product/status-tabs";
import type { InventoryBalance } from "@/types/inventory-balance/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

/**
 * Compose a customer-facing variant name from the parent product + variant.
 * Mirrors the stock-variant naming pattern (e.g. "Coca-Cola 300ml") while
 * collapsing the awkward cases:
 *
 * <ul>
 *   <li>variant name equals product name → just the product name</li>
 *   <li>single-variant product with the conventional "Default" name →
 *       just the product name</li>
 *   <li>variant name already contains the product name → use it as-is
 *       (avoids "Coca-Cola Coca-Cola 300ml")</li>
 *   <li>otherwise → "{product} {variant}"</li>
 * </ul>
 */
function variantDisplayName(
  productName: string,
  variantName: string,
  isOnlyVariant: boolean,
): string {
  const p = productName.trim();
  const v = variantName.trim();
  if (!v) return p;
  if (v.toLowerCase() === p.toLowerCase()) return p;
  if (isOnlyVariant && v.toLowerCase() === "default") return p;
  if (v.toLowerCase().includes(p.toLowerCase())) return v;
  return `${p} ${v}`;
}

/**
 * Build one {@link ProductVariantRow} from a (product, variant) pair,
 * enriching with live inventory data so the list can render Cost and
 * Available without per-row API calls.
 */
function enrichVariant(
  product: Product,
  variant: ProductVariant,
  balanceMap: Map<string, InventoryBalance>,
  isOnlyVariant: boolean,
): ProductVariantRow {
  let currentCost: number | null = null;
  let sellableQty: number | "Unlimited" | null = null;

  if (variant.unlimited) {
    currentCost = variant.costPrice;
    sellableQty =
      variant.availableQuantity != null ? variant.availableQuantity : "Unlimited";
  } else if (variant.stockLinkType === "DIRECT" && variant.stockVariantId) {
    const bal = balanceMap.get(variant.stockVariantId);
    const directQty = variant.directQuantity ?? 1;
    if (bal) {
      const unitCost = bal.currentBatchCost ?? bal.averageCost;
      if (unitCost != null) currentCost = unitCost * directQty;
      if (directQty > 0) {
        sellableQty = Math.floor(bal.availableQuantity / directQty);
      }
    } else {
      currentCost = variant.costPrice;
    }
  } else {
    // RECIPE or unconfigured tracking — surface stored cost; sellable
    // requires walking the BOM rule and is deferred.
    currentCost = variant.costPrice;
  }

  return {
    // id = productId so the existing row-click navigates to the product
    // detail page and the per-row action menu (archive/delete) keeps
    // operating at the product level.
    id: product.id,
    productId: product.id,
    variantId: variant.id,
    name: variantDisplayName(product.name, variant.name, isOnlyVariant),
    imageUrl: variant.imageUrl ?? product.imageUrl,
    product,
    sku: variant.sku,
    price: variant.price,
    nativeCurrency:
      variant.nativeCurrency || product.nativeCurrency || "TZS",
    unlimited: variant.unlimited,
    stockLinkType: variant.stockLinkType,
    stockVariantId: variant.stockVariantId,
    directQuantity: variant.directQuantity,
    costPrice: variant.costPrice,
    variantActive: variant.active,
    variantArchivedAt: variant.archivedAt,
    _currentCost: currentCost,
    _sellableQty: sellableQty,
  };
}

async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);
  const status: "active" | "archived" =
    resolvedSearchParams.status === "archived" ? "archived" : "active";

  const [responseData, location] = await Promise.all([
    searchProducts(q, page, pageLimit),
    getCurrentLocation().catch(() => null),
  ]);

  // One bulk balances call covers every stock variant referenced by the
  // products on this page — far cheaper than per-variant lookups.
  const balances: InventoryBalance[] = location?.id
    ? await getBalancesByLocation(location.id).catch(() => [])
    : [];
  const balanceMap = new Map(balances.map((b) => [b.stockVariantId, b]));

  // Flatten each product into one row per variant. Filter by tab:
  //   active   → variant.archivedAt == null AND product.archivedAt == null
  //   archived → variant.archivedAt != null OR product.archivedAt != null
  // The display-name dedup uses the count of all variants the response
  // returned (the backend already excludes soft-deleted ones), regardless
  // of archive state, so an archived single-variant product still reads
  // as "Coca-Cola" rather than "Coca-Cola Default".
  const filteredData: ProductVariantRow[] = responseData.content.flatMap((p) => {
    const allLiveVariants = p.variants ?? [];
    if (allLiveVariants.length === 0) return [];
    const isOnlyVariant = allLiveVariants.length === 1;
    const productArchived = p.archivedAt != null;

    return allLiveVariants
      .filter((v) => {
        const variantArchived = v.archivedAt != null;
        const isArchivedRow = variantArchived || productArchived;
        return status === "archived" ? isArchivedRow : !isArchivedRow;
      })
      .map((v) => enrichVariant(p, v, balanceMap, isOnlyVariant));
  });

  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Products" }]} />
      <PageHeader
        title="Products"
        subtitle="Catalog of items sold from this location."
        actions={
          <>
            <TableExport filename="products" useEndpoint />
            <ProductCSVDialog />
            <Button asChild>
              <Link href="/products/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add product
              </Link>
            </Button>
          </>
        }
      />

      <PageBody>
        <ProductStatusTabs value={status} />

        {total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                data={filteredData}
                searchKey="name"
                pageNo={page}
                total={total}
                pageCount={pageCount}
                rowClickBasePath="/products"
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems newItemUrl="/products/new" itemName="products" />
        )}
      </PageBody>
    </PageShell>
  );
}

export default Page;
