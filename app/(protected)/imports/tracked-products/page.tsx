import { ImportFlow } from "@/components/imports/import-flow";

export default function TrackedProductsImportPage() {
  return (
    <ImportFlow
      type="STOCK_WITH_PRODUCT"
      title="Import tracked products"
      description="Create a product + stock item per row, linked 1:1 so every sale decrements stock automatically."
      templateColumns={[
        "name",
        "description",
        "category",
        "brand",
        "base_unit",
        "tax_class",
        "variant_name",
        "variant_sku",
        "variant_barcode",
        "quantity",
        "price",
        "selling_price",
      ]}
      templateSample={[
        "Pepsi 500ml",
        "Carbonated soft drink",
        "Beverages",
        "Pepsi",
        "Bottle",
        "STANDARD",
        "Bottle",
        "PEP-500-B",
        "5901234123457",
        "240",
        "900",
        "1500",
      ]}
      previewColumns={[
        { key: "name", label: "Name" },
        { key: "variant_name", label: "Variant" },
        { key: "category", label: "Category" },
        { key: "quantity", label: "Qty" },
        { key: "price", label: "Cost" },
        { key: "selling_price", label: "Sell price" },
      ]}
    />
  );
}
