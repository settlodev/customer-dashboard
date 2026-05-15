import { ImportFlow } from "@/components/imports/import-flow";

export default function StockImportPage() {
  return (
    <ImportFlow
      type="STOCK"
      title="Import stock items"
      description="Bulk-create stock items and their variants from a CSV. One row per variant; rows sharing a stock_name collapse into one stock item."
      templateColumns={[
        "stock_name",
        "description",
        "base_unit",
        "variant_name",
        "variant_sku",
        "variant_barcode",
      ]}
      templateSample={[
        "Pepsi 500ml",
        "Sealed cases for the cold room",
        "Bottle",
        "Bottle",
        "PEP-500-B",
        "5901234123457",
      ]}
      previewColumns={[
        { key: "stock_name", label: "Stock item" },
        { key: "variant_name", label: "Variant" },
        { key: "variant_sku", label: "SKU" },
      ]}
    />
  );
}
