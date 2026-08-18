import { ImportFlow } from "@/components/imports/import-flow";

export default function StockIntakeImportPage() {
  return (
    <ImportFlow
      type="STOCK_INTAKE"
      title="Bulk stock intake"
      description="Receive quantities against existing stock variants. Each row is matched by SKU (primary) then barcode (fallback). The whole file becomes one intake record."
      templateColumns={[
        "variant_sku",
        "variant_barcode",
        "quantity",
        "unit_cost",
        "batch_number",
        "expiry_date",
        "notes",
      ]}
      templateSample={[
        "PEP-500-B",
        "5901234123457",
        "120",
        "900",
        "BATCH-2026-05",
        "2027-06-30",
        "Tuesday delivery",
      ]}
      previewColumns={[
        { key: "variant_sku", label: "SKU" },
        { key: "variant_barcode", label: "Barcode" },
        { key: "quantity", label: "Quantity" },
        { key: "unit_cost", label: "Unit cost" },
        { key: "batch_number", label: "Batch" },
      ]}
    />
  );
}
