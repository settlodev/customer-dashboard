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
  imageUrl: string | null;
  variants: StockVariant[];
  /**
   * True when the stock item is an in-progress form save (V35). The
   * default catalog list excludes drafts; promote via the publish action.
   * Optional on read so older response payloads that pre-date V35 still
   * type-check.
   */
  draft?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockVariant {
  id: string;
  stockId: string;
  name: string;
  displayName: string;
  sku: string | null;
  /**
   * Denormalized convenience copy of the parent stock's `baseUnitId` —
   * every variant of a stock transacts in the same tracking unit.
   */
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
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

