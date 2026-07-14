import { UUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getProduct } from "@/lib/actions/product-actions";
import { Product } from "@/types/product/type";
import { ApiResponse } from "@/types/types";
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

  if (resolvedParams.id === "new") {
    redirect("/products/new/edit");
  }

  let item: ApiResponse<Product> | null = null;

  try {
    item = await getProduct(resolvedParams.id as UUID);
    if (item.totalElements === 0) notFound();
  } catch (error) {
    console.log(error);
    throw new Error("Failed to load product details");
  }

  const product = item.content[0];

  const breadcrumbItems = [
    { title: "Products", link: "/products" },
    { title: product.name, link: "" },
  ];

  const isValidImageUrl =
    product.image &&
    (product.image.startsWith("http://") ||
      product.image.startsWith("https://") ||
      product.image.startsWith("/"));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Breadcrumbs */}
      <BreadcrumbsNav items={breadcrumbItems} />

      {/* Sales Report Summary */}
      <ProductDetailDashboard
        productId={resolvedParams.id}
        productName={product.name}
        productImage={isValidImageUrl ? product.image : null}
        categoryName={product.categoryName}
        sku={product.sku}
        status={product.status}
        isArchived={product.isArchived}
        editUrl={`/products/${product.id}/edit`}
      >
        {/* Summary Cards — rendered after revenue stream */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            label="Category"
            value={product.categoryName || "—"}
            icon={Tag}
          />
          <SummaryCard
            label="Department"
            value={product.departmentName || "—"}
            icon={Building2}
          />
          <SummaryCard
            label="Available Stock"
            value={product.trackInventory ? (product.quantity?.toLocaleString() ?? "0") : "Unlimited"}
            icon={Box}
          />
          <SummaryCard
            label="Tracking"
            value={product.trackInventory ? "Enabled" : "Disabled"}
            icon={BarChart3}
          />
        </div>
      </ProductDetailDashboard>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="SKU" value={product.sku} />
            <DetailRow label="Brand" value={product.brandName} />
            <DetailRow
              label="Tax Class"
              value={product.taxClass}
            />
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">
                Tax Included
              </span>
              <Badge variant={product.taxIncluded ? "default" : "secondary"}>
                {product.taxIncluded ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">
                Sell Online
              </span>
              <Badge variant={product.sellOnline ? "default" : "secondary"}>
                {product.sellOnline ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
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
                      {variant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {variant.sku && `SKU: ${variant.sku}`}
                      {variant.unitName &&
                        `${variant.sku ? " · " : ""}${variant.unitName}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {variant.price?.toLocaleString()} TZS
                    </p>
                    {variant.trackInventory && (
                      <p className="text-xs text-muted-foreground">
                        Stock: {variant.availableStock?.toLocaleString() ?? "0"}
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

      {/* Description */}
      {product.description && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {product.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
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
