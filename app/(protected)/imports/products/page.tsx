import { ImportFlow } from "@/components/imports/import-flow";

export default function ProductImportPage() {
  return (
    <ImportFlow
      type="PRODUCT"
      title="Import products"
      description="Bulk-create products and their variants from a CSV. One row per variant; rows sharing a product_name collapse into one product."
      templateColumns={[
        "product_name",
        "description",
        "category",
        "brand",
        "tax_class",
        "sell_online",
        "variant_name",
        "variant_sku",
        "variant_barcode",
        "variant_price",
        "variant_cost",
      ]}
      templateSample={[
        "Pepsi 500ml",
        "Carbonated soft drink",
        "Beverages",
        "Pepsi",
        "STANDARD",
        "true",
        "Bottle",
        "PEP-500-B",
        "5901234123457",
        "1500",
        "900",
      ]}
      previewColumns={[
        { key: "product_name", label: "Product" },
        { key: "variant_name", label: "Variant" },
        { key: "category", label: "Category" },
        { key: "variant_price", label: "Price" },
        { key: "variant_sku", label: "SKU" },
      ]}
    />
  );
}
