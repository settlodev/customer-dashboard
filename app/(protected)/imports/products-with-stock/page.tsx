import { ImportFlow } from "@/components/imports/import-flow";

export default function ProductsWithStockImportPage() {
  return (
    <ImportFlow
      type="PRODUCT_WITH_STOCK"
      title="Import products + stock (auto-tracked)"
      description="Create products + stock items together. Each variant row becomes one product variant linked 1:1 to its matching stock variant. Initial quantity / cost on the FIRST row of each group seed an opening balance."
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
        "variant_price",
        "variant_cost",
        "initial_quantity",
        "initial_unit_cost",
      ]}
      templateSample={[
        "Pepsi 500ml",
        "Cold drink",
        "Beverages",
        "Pepsi",
        "Bottle",
        "STANDARD",
        "Bottle",
        "PEP-500-B",
        "5901234123457",
        "1500",
        "900",
        "240",
        "900",
      ]}
      previewColumns={[
        { key: "name", label: "Name" },
        { key: "variant_name", label: "Variant" },
        { key: "variant_price", label: "Price" },
        { key: "initial_quantity", label: "Initial qty" },
        { key: "variant_sku", label: "SKU" },
      ]}
    />
  );
}
