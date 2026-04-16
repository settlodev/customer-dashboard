import type { MaterialType } from "@/types/catalogue/enums";

export interface Stock {
  id: string;
  name: string;
  description: string | null;
  baseUnitId: string;
  baseUnitName: string;
  baseUnitAbbreviation: string;
  archived: boolean;
  materialType: MaterialType;
  variants: StockVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface StockVariant {
  id: string;
  stockId: string;
  name: string;
  displayName: string;
  sku: string | null;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  conversionToBase: number;
  defaultCost: number | null;
  archived: boolean;
  isDefault: boolean;
  barcode: string | null;
  serialTracked: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Stock enriched with aggregated inventory balance data */
export interface StockWithBalance extends Stock {
  totalQuantity: number;
  totalValue: number;
  lowStock: boolean;
  outOfStock: boolean;
}

/** Response from the async CSV import job endpoint */
export interface CsvImportJobResponse {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalRows: number;
  stocksCreated: number;
  variantsCreated: number;
  failureCount: number;
  created: { id: string; name: string; variantCount: number }[];
  errors: { row: number; message: string }[];
  openingStockId: string | null;
  openingStockReference: string | null;
  openingStockItems: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

// ── Report types (from reports service) ──────────────────────────

export interface StockHistory {
  totalItems: number;
  totalValue: number;
  totalStockRemaining: number;
  totalStockValue: number;
  totalEstimatedProfit: number;
  totalStockIntakes: number;
  lowStockItems: any[];
  outOfStockItems: any[];
  topMovingItems: any[];
  slowMovingItems: any[];
}
