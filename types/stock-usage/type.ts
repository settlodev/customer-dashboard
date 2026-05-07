import type { DestinationType } from "@/types/catalogue/enums";

export type StockUsageType =
  | "INTERNAL_USE"
  | "STAFF_MEAL"
  | "SAMPLE"
  | "TRAINING"
  | "MARKETING"
  | "MAINTENANCE"
  | "OTHER";

export interface StockUsage {
  id: string;
  usageNumber: string;
  locationType: DestinationType;
  locationId: string;
  locationName: string | null;
  stockVariantId: string;
  variantName: string | null;
  quantity: number;
  usageType: StockUsageType;
  departmentId: string;
  departmentName: string | null;
  notes: string | null;
  recordedBy: string;
  recordedByName: string | null;
  usageDate: string;
  unitCost: number | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
}

export const STOCK_USAGE_TYPE_OPTIONS: { value: StockUsageType; label: string }[] = [
  { value: "INTERNAL_USE", label: "Internal use" },
  { value: "STAFF_MEAL", label: "Staff meal" },
  { value: "SAMPLE", label: "Sample / tasting" },
  { value: "TRAINING", label: "Training" },
  { value: "MARKETING", label: "Marketing" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OTHER", label: "Other" },
];
