import { ImportFlow } from "@/components/imports/import-flow";

export default function StockImportPage() {
  return (
    <ImportFlow
      type="STOCK"
      title="Import stock items"
      description="Bulk-create stock items and their variants from a CSV. One row per variant; rows sharing a stock_name collapse into one stock item. Supports material type, returnable-crate deposits, and opening-stock quantities."
      templateColumns={[
        "stock_name",
        "description",
        "base_unit",
        "variant_name",
        "variant_sku",
        "variant_barcode",
        "material_type",
        "deposit_value",
        "deposit_currency",
        "quantity",
        "unit_cost",
        "batch_number",
        "expiry_date",
      ]}
      templateSample={[
        "Pepsi 500ml",
        "Sealed cases for the cold room",
        "Bottle",
        "Bottle",
        "PEP-500-B",
        "5901234123457",
        "TRADING_GOOD",
        "",
        "",
        "12",
        "5000",
        "",
        "",
      ]}
      previewColumns={[
        { key: "stock_name", label: "Stock item" },
        { key: "variant_name", label: "Variant" },
        { key: "variant_sku", label: "SKU" },
        { key: "material_type", label: "Material" },
        { key: "deposit_value", label: "Deposit" },
        { key: "quantity", label: "Qty" },
      ]}
    />
  );
}
