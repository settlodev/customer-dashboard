import { notFound, redirect } from "next/navigation";
import {
  PageShell,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { getProduct } from "@/lib/actions/product-actions";
import { Product } from "@/types/product/type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Tag,
  Building2,
  Layers,
  Box,
  BarChart3,
} from "lucide-react";
import ProductDetailDashboard from "@/components/dashboard/ProductDetailDashboard";

type Params = Promise<{ id: string }>;

export default async function ProductPage({ params }: { params: Params }) {
  const resolvedParams = await params;

  // /products/new is now a sibling route — bounce there if someone
  // links to /products/new through the dynamic segment.
  if (resolvedParams.id === "new") {
    redirect("/products/new");
  }

  let product: Product | null = null;

  try {
    product = await getProduct(resolvedParams.id);
    if (!product) notFound();
  } catch {
    throw new Error("Failed to load product details");
  }

  const isValidImageUrl =
    product.imageUrl &&
    (product.imageUrl.startsWith("http://") ||
      product.imageUrl.startsWith("https://") ||
      product.imageUrl.startsWith("/"));

  const categoryName = product.categories?.[0]?.name || null;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Products", href: "/products" },
          { title: product.name },
        ]}
      />
      <PageBody>
      <ProductDetailDashboard
        productId={resolvedParams.id}
        productName={product.name}
        productImage={isValidImageUrl ? product.imageUrl : null}
        categoryName={categoryName ?? ""}
        sku={product.variants?.[0]?.sku ?? ""}
        status={product.active}
        isArchived={!product.active}
        editUrl={`/products/${product.id}/edit`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="Category" value={categoryName || "—"} icon={Tag} />
          <SummaryCard
            label="Department"
            value={product.departmentName || "—"}
            icon={Building2}
          />
          <SummaryCard
            label="Available Stock"
            value={
              product.trackStock
                ? (product.variants
                    ?.reduce((sum, v) => sum + (v.availableQuantity ?? 0), 0)
                    .toLocaleString() ?? "0")
                : "Unlimited"
            }
            icon={Box}
          />
          <SummaryCard
            label="Tracking"
            value={product.trackStock ? "Enabled" : "Disabled"}
            icon={BarChart3}
          />
        </div>
      </ProductDetailDashboard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Brand" value={product.brandName} />
            <DetailRow label="Tax Class" value={product.taxClass} />
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Tax Inclusive</span>
              <Badge variant={product.taxInclusive ? "default" : "secondary"}>
                {product.taxInclusive ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Sell Online</span>
              <Badge variant={product.sellOnline ? "default" : "secondary"}>
                {product.sellOnline ? "Yes" : "No"}
              </Badge>
            </div>
            <DetailRow label="Lifecycle" value={product.lifecycleStatus} />
            {product.tags?.length > 0 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Tags</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Variants ({product.variants?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {product.variants?.length ? (
              product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {variant.displayName || variant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {variant.sku && `SKU: ${variant.sku}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {variant.price?.toLocaleString()} {variant.nativeCurrency}
                    </p>
                    {variant.availableQuantity != null && !variant.unlimited && (
                      <p className="text-xs text-muted-foreground">
                        Stock: {variant.availableQuantity.toLocaleString()}
                      </p>
                    )}
                    {variant.unlimited && (
                      <p className="text-xs text-muted-foreground">Unlimited</p>
                    )}
                    {variant.stockLinkType === "DIRECT" && (
                      <p className="text-xs text-muted-foreground">
                        Linked: {variant.stockVariantName ?? "stock item"}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No variants configured
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {product.description && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {product.description}
            </p>
          </CardContent>
        </Card>
      )}
      </PageBody>
    </PageShell>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {value || "—"}
      </span>
    </div>
  );
}
