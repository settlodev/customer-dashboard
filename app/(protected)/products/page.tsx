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
import { searchProducts, getProductCounts } from "@/lib/actions/product-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getProductsKpi } from "@/lib/actions/reports-analytics-actions";
import { Plus, Upload } from "lucide-react";
import TableExport from "@/components/widgets/export";
import { ProductStatusTabs } from "@/components/tables/product/status-tabs";
import { ProductsKpiStrip } from "@/components/widgets/products/products-kpi-strip";
import { BulkBarcodeGenerator } from "@/components/widgets/products/bulk-barcode-generator";

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
 * Build one {@link ProductVariantRow} from a (product, variant) pair.
 *
 * <p>Live cost and sellable quantity come from the inventory service —
 * {@code currentCost} and {@code qtyAvailable} are joined into the
 * variant response server-side from the {@code inventory_balance}
 * projection. The page used to fetch every balance for the location and
 * derive these client-side, but that scaled poorly (a 100k-product
 * location was shipping hundreds of thousands of balance rows per page
 * render). For UNLIMITED variants the server leaves {@code qtyAvailable}
 * null so the row falls back to the merchant-set
 * {@code availableQuantity} cap, or "Unlimited" when no cap is set.
 */
function enrichVariant(
  product: Product,
  variant: ProductVariant,
  isOnlyVariant: boolean,
): ProductVariantRow {
  const sellableQty: number | "Unlimited" | null = variant.unlimited
    ? variant.availableQuantity ?? "Unlimited"
    : variant.qtyAvailable;

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
    _currentCost: variant.currentCost,
    _sellableQty: sellableQty,
  };
}

async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);
  const status: "active" | "archived" | "draft" | "all" =
    resolvedSearchParams.status === "archived"
      ? "archived"
      : resolvedSearchParams.status === "draft"
        ? "draft"
        : resolvedSearchParams.status === "all"
          ? "all"
          : "active";

  // Filtering happens entirely on the backend via ?view=. Each merchant
  // tab maps 1:1 to a backend finder (Active = lifecycle=ACTIVE AND
  // not-archived, Archived = archivedAt!=null, Drafts = lifecycle=DRAFT,
  // All = every non-deleted row). Live qty / cost ride along on each
  // variant — joined into the response from inventory_balance — so this
  // page no longer needs a second balances round-trip.
  // Chain the KPI fetch off the location promise so it fires as soon as
  // location resolves rather than waiting for the entire Promise.all. End
  // time becomes max(searchProducts, location+kpi) instead of
  // max(searchProducts, location) + kpi.
  const locationPromise = getCurrentLocation().catch(() => null);
  const kpiPromise = locationPromise.then((loc) =>
    loc?.id ? getProductsKpi(loc.id, "TZS").catch(() => null) : null,
  );

  const [responseData, counts, location, kpi] = await Promise.all([
    searchProducts(q, page, pageLimit, status),
    getProductCounts(),
    locationPromise,
    kpiPromise,
  ]);

  // Flatten each product into one row per variant. The display-name
  // dedup uses the count of all variants the response returned (the
  // backend already excludes soft-deleted ones), regardless of archive
  // state, so an archived single-variant product still reads as
  // "Coca-Cola" rather than "Coca-Cola Default".
  const filteredData: ProductVariantRow[] = responseData.content.flatMap((p) => {
    const allLiveVariants = p.variants ?? [];
    if (allLiveVariants.length === 0) return [];
    const isOnlyVariant = allLiveVariants.length === 1;

    return allLiveVariants.map((v) => enrichVariant(p, v, isOnlyVariant));
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
            <BulkBarcodeGenerator scope="all" />
            <Button asChild variant="outline" size="sm">
              <Link href="/imports/products">
                <Upload className="mr-1.5 h-4 w-4" />
                Import CSV
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/products/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add product
              </Link>
            </Button>
          </>
        }
      />

      <PageBody>
        {total > 0 || q !== "" ? (
          <>
            <ProductsKpiStrip summary={kpi} />
            <ProductStatusTabs value={status} counts={counts} />
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
          </>
        ) : (
          <NoItems newItemUrl="/products/new" itemName="products" />
        )}
      </PageBody>
    </PageShell>
  );
}

export default Page;
