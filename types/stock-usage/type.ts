import type { DestinationType } from "@/types/catalogue/enums";

export type UsageCategory =
  | "STAFF_CONSUMPTION"
  | "INTERNAL_USE"
  | "MAINTENANCE"
  | "MARKETING_SAMPLE"
  | "RESEARCH_AND_DEVELOPMENT"
  | "OFFICE_USE"
  | "GIFTS_AND_PROMOTIONS"
  | "TRAINING"
  | "OTHER";

export type UsageStatus = "ACTIVE" | "REVERSED";

export type UsageGrouping = "CATEGORY" | "DEPARTMENT" | "RECIPIENT";

export interface StockUsageItem {
  id: string;
  stockVariantId: string;
  variantName: string | null;
  previousQuantity: number;
  /** Always positive — amount consumed. Movement records the negative deduction. */
  quantity: number;
  newQuantity: number;
  unitCost: number | null;
  /** Settlement currency of `unitCost` (location base currency). */
  currency: string | null;
  /** User-supplied original currency (null when cost was taken from inventory). */
  originalCurrency: string | null;
  originalUnitCost: number | null;
  rateUsed: number | null;
  batchId: string | null;
  batchNumber: string | null;
  notes: string | null;
}

export interface StockUsage {
  id: string;
  usageNumber: string;
  locationType: DestinationType;
  locationId: string;
  locationName: string | null;
  category: UsageCategory;
  /** Location base currency — applies to every line's cost. */
  currency: string | null;
  purpose: string;
  departmentId: string | null;
  departmentName: string | null;
  recipientId: string;
  recipientName: string | null;
  performedBy: string;
  performedByName: string | null;
  usageDate: string;
  notes: string | null;
  status: UsageStatus;
  reversedAt: string | null;
  reversedBy: string | null;
  reversedByName: string | null;
  reversalReason: string | null;
  items: StockUsageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockUsageSummaryRow {
  /** Raw key — UsageCategory name for CATEGORY, UUID string for DEPARTMENT / RECIPIENT. */
  groupKey: string | null;
  /** Human-readable label resolved server-side (category label, staff name, department name). */
  groupLabel: string | null;
  usageCount: number;
  totalQuantity: number;
  totalCost: number;
}

export const USAGE_CATEGORY_OPTIONS: { value: UsageCategory; label: string }[] = [
  { value: "STAFF_CONSUMPTION", label: "Staff consumption" },
  { value: "INTERNAL_USE", label: "Internal use" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "MARKETING_SAMPLE", label: "Marketing sample" },
  { value: "RESEARCH_AND_DEVELOPMENT", label: "Research & development" },
  { value: "OFFICE_USE", label: "Office use" },
  { value: "GIFTS_AND_PROMOTIONS", label: "Gifts & promotions" },
  { value: "TRAINING", label: "Training" },
  { value: "OTHER", label: "Other" },
];

export const USAGE_STATUS_OPTIONS: { value: UsageStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "REVERSED", label: "Reversed" },
];

export const USAGE_GROUPING_OPTIONS: { value: UsageGrouping; label: string }[] = [
  { value: "CATEGORY", label: "Category" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "RECIPIENT", label: "Recipient" },
];

export interface StockUsageFilters {
  category?: UsageCategory;
  departmentId?: string;
  recipientId?: string;
  performedBy?: string;
  status?: UsageStatus;
  from?: string;
  to?: string;
}
