import type { DestinationType } from "@/types/catalogue/enums";

export type StockTakeStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "APPROVED"
  | "CANCELLED";

export type CycleCountType =
  | "FULL"
  | "ABC_CLASS"
  | "CATEGORY"
  | "DEPARTMENT"
  | "RANDOM"
  | "ZONE";

export type AbcClass = "A" | "B" | "C";

export type SampleMode = "size" | "percentage";

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
  filterCriteria: string | null;
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
  binId: string | null;
  binCode: string | null;
  unitId: string | null;
  unitName: string | null;
  unitAbbreviation: string | null;
  divisibleUnitId: string | null;
  divisibleUnitName: string | null;
  divisibleUnitAbbreviation: string | null;
  divisibleUnitRatio: number | null;
}

export interface CreateStockTakePayload {
  notes?: string;
  cycleCountType?: CycleCountType;
  filterCriteria?: string;
  blindCount?: boolean;
}

export interface RecordCountPayload {
  itemId: string;
  countedQuantity?: number;
  countedWholeUnits?: number;
  countedSubUnits?: number;
  notes?: string;
}

export interface RecordCountBatchPayload {
  counts: RecordCountPayload[];
}

export const STOCK_TAKE_STATUS_LABELS: Record<StockTakeStatus, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
};

export const STOCK_TAKE_STATUS_TONES: Record<StockTakeStatus, string> = {
  DRAFT: "bg-muted text-ink-2",
  IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  COMPLETED: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  APPROVED: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  CANCELLED: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
};

export const CYCLE_COUNT_TYPE_LABELS: Record<CycleCountType, string> = {
  FULL: "Full — every variant",
  ABC_CLASS: "By ABC class",
  CATEGORY: "By stock category",
  DEPARTMENT: "By department",
  RANDOM: "Random sample",
  ZONE: "By warehouse zone",
};

export const CYCLE_COUNT_TYPE_DESCRIPTIONS: Record<CycleCountType, string> = {
  FULL: "Count every variant currently on hand at the location.",
  ABC_CLASS: "Count variants classified as A, B, or C (by value contribution).",
  CATEGORY:
    "Count variants in one stock category — or everything not yet categorised.",
  DEPARTMENT:
    "Count variants belonging to products in a department's categories.",
  RANDOM: "Count a randomly selected subset — by count or percentage.",
  ZONE: "Count only variants currently stored in a specific warehouse zone.",
};

export const CYCLE_COUNT_TYPE_OPTIONS: { value: CycleCountType; label: string }[] = [
  { value: "FULL", label: CYCLE_COUNT_TYPE_LABELS.FULL },
  { value: "ABC_CLASS", label: CYCLE_COUNT_TYPE_LABELS.ABC_CLASS },
  { value: "CATEGORY", label: CYCLE_COUNT_TYPE_LABELS.CATEGORY },
  { value: "DEPARTMENT", label: CYCLE_COUNT_TYPE_LABELS.DEPARTMENT },
  { value: "RANDOM", label: CYCLE_COUNT_TYPE_LABELS.RANDOM },
  { value: "ZONE", label: CYCLE_COUNT_TYPE_LABELS.ZONE },
];

export const LOCATION_TYPE_LABELS: Record<DestinationType, string> = {
  LOCATION: "Location",
  STORE: "Store",
  WAREHOUSE: "Warehouse",
};

export const ABC_CLASS_OPTIONS: { value: AbcClass; label: string; hint: string }[] = [
  { value: "A", label: "A — high value", hint: "Top 70–80% of inventory value" },
  { value: "B", label: "B — medium value", hint: "Next 15–20% of value" },
  { value: "C", label: "C — low value", hint: "Long tail — everything else" },
];

export function describeFilterCriteria(
  cycleCountType: CycleCountType | null | undefined,
  filterCriteria: string | null | undefined,
  opts?: { departmentName?: string | null; categoryName?: string | null },
): string | null {
  if (!cycleCountType || cycleCountType === "FULL") return null;
  if (!filterCriteria) return CYCLE_COUNT_TYPE_LABELS[cycleCountType];

  let parsed: Record<string, unknown> | null = null;
  try {
    const raw = JSON.parse(filterCriteria);
    if (raw && typeof raw === "object") parsed = raw as Record<string, unknown>;
  } catch {
    return `${CYCLE_COUNT_TYPE_LABELS[cycleCountType]} — ${filterCriteria}`;
  }

  if (!parsed) return CYCLE_COUNT_TYPE_LABELS[cycleCountType];

  switch (cycleCountType) {
    case "ABC_CLASS":
      return parsed.classification
        ? `ABC class ${String(parsed.classification).toUpperCase()}`
        : CYCLE_COUNT_TYPE_LABELS.ABC_CLASS;
    case "CATEGORY":
      if (parsed.uncategorised === true) return "Uncategorised items";
      if (opts?.categoryName) return `Category: ${opts.categoryName}`;
      return parsed.categoryId
        ? `Category ${String(parsed.categoryId).slice(0, 8)}…`
        : CYCLE_COUNT_TYPE_LABELS.CATEGORY;
    case "DEPARTMENT":
      if (opts?.departmentName) return `Department: ${opts.departmentName}`;
      return parsed.departmentId
        ? `Department ${String(parsed.departmentId).slice(0, 8)}…`
        : CYCLE_COUNT_TYPE_LABELS.DEPARTMENT;
    case "RANDOM":
      if (typeof parsed.sampleSize === "number") {
        return `Random sample — ${parsed.sampleSize} items`;
      }
      if (typeof parsed.samplePercentage === "number") {
        return `Random sample — ${parsed.samplePercentage}% of variants`;
      }
      return CYCLE_COUNT_TYPE_LABELS.RANDOM;
    case "ZONE":
      return parsed.zoneId
        ? `Warehouse zone ${String(parsed.zoneId).slice(0, 8)}…`
        : CYCLE_COUNT_TYPE_LABELS.ZONE;
    default:
      return CYCLE_COUNT_TYPE_LABELS[cycleCountType];
  }
}

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
