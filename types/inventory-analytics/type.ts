export interface StockoutForecastItem {
  stockVariantId: string;
  variantName: string;
  stockName: string;
  currentQuantity: number;
  avgDailyConsumption: number;
  daysUntilStockout: number;
  estimatedStockoutDate: string | null;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NO_CONSUMPTION";
}

export interface StockTurnoverItem {
  stockVariantId: string;
  variantName: string;
  stockName: string;
  currentQuantity: number;
  totalMovementQuantity: number;
  turnoverRatio: number;
}

export interface AbcAnalysisItem {
  stockVariantId: string;
  variantName: string;
  stockName: string;
  classification: "A" | "B" | "C";
  annualConsumptionValue: number;
  percentageOfTotal: number;
  cumulativePercentage: number;
}

export interface MovementTypeSummary {
  movementType: string;
  totalQuantity: number;
  count: number;
}

export interface ReorderSuggestion {
  stockVariantId: string;
  variantName: string;
  stockName: string;
  currentAvailableQuantity: number;
  avgDailyConsumption: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  daysOfStockRemaining: number;
}

export interface DeadStockItem {
  stockVariantId: string;
  variantName: string;
  stockName: string;
  daysSinceLastMovement: number;
  quantityOnHand: number;
  totalValue: number;
}

export interface InventoryValuationItem {
  stockVariantId: string;
  variantName: string;
  stockName: string;
  quantityOnHand: number;
  averageCost: number;
  currentBatchCost: number;
  totalValue: number;
}

export const RISK_LEVEL_CONFIG: Record<
  StockoutForecastItem["riskLevel"],
  { label: string; color: string; bgColor: string }
> = {
  CRITICAL: {
    label: "Critical",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  HIGH: {
    label: "High",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  LOW: {
    label: "Low",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  NO_CONSUMPTION: {
    label: "No Usage",
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900",
  },
};

export const ABC_CONFIG: Record<
  "A" | "B" | "C",
  { label: string; description: string; color: string; bgColor: string }
> = {
  A: {
    label: "A",
    description: "High value — top 80% of consumption",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  B: {
    label: "B",
    description: "Medium value — next 15%",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  C: {
    label: "C",
    description: "Low value — bottom 5%",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900",
  },
};
