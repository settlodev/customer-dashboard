import type { DestinationType } from "@/types/catalogue/enums";

export type StockTakeStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "APPROVED"
  | "CANCELLED";

export type CycleCountType = "FULL" | "CATEGORY" | "ABC_CLASS" | "RANDOM" | "ZONE";

export interface StockTake {
  id: string;
  takeNumber: string;
  locationType: DestinationType;
  locationId: string;
  status: StockTakeStatus;
  startedAt: string | null;
  startedBy: string | null;
  startedByName: string | null;
  completedAt: string | null;
  completedBy: string | null;
  completedByName: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  cycleCountType: CycleCountType | null;
  blindCount: boolean | null;
  notes: string | null;
  totalItems: number;
  itemsCounted: number;
  itemsWithVariance: number;
  items: StockTakeItem[];
  createdAt: string;
}

export interface StockTakeItem {
  id: string;
  stockVariantId: string;
  displayName: string | null;
  expectedQuantity: number | null;
  countedQuantity: number | null;
  variance: number | null;
  notes: string | null;
  countedAt: string | null;
  countedBy: string | null;
}

export interface CreateStockTakePayload {
  locationType: DestinationType;
  notes?: string;
  cycleCountType?: CycleCountType;
  filterCriteria?: string;
  blindCount?: boolean;
}

export interface RecordCountPayload {
  itemId: string;
  countedQuantity: number;
  notes?: string;
}

export const STOCK_TAKE_STATUS_LABELS: Record<StockTakeStatus, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
};

export const STOCK_TAKE_STATUS_TONES: Record<StockTakeStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export const CYCLE_COUNT_TYPE_LABELS: Record<CycleCountType, string> = {
  FULL: "Full (every variant)",
  CATEGORY: "By category",
  ABC_CLASS: "ABC class (high-value first)",
  RANDOM: "Random sample",
  ZONE: "By warehouse zone",
};

export const CYCLE_COUNT_TYPE_OPTIONS: { value: CycleCountType; label: string }[] = [
  { value: "FULL", label: "Full (every variant)" },
  { value: "CATEGORY", label: "By category" },
  { value: "ABC_CLASS", label: "ABC class (high-value first)" },
  { value: "RANDOM", label: "Random sample" },
  { value: "ZONE", label: "By warehouse zone" },
];

export function canStartStockTake(status: StockTakeStatus): boolean {
  return status === "DRAFT";
}
export function canCountStockTake(status: StockTakeStatus): boolean {
  return status === "IN_PROGRESS";
}
export function canCompleteStockTake(status: StockTakeStatus): boolean {
  return status === "IN_PROGRESS";
}
export function canApproveStockTake(status: StockTakeStatus): boolean {
  return status === "COMPLETED";
}
export function canCancelStockTake(status: StockTakeStatus): boolean {
  return status === "DRAFT" || status === "IN_PROGRESS";
}
