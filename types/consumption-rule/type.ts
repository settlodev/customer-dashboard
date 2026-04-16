export type ConsumptionType = "RECIPE" | "BUNDLE" | "COMBO" | "MODIFIER" | "MANUFACTURING" | "KIT";
export type CalculationType = "FIXED" | "SCALED" | "FORMULA";

export interface ConsumptionRule {
  id: string;
  accountId: string;
  name: string;
  sourceVariantId: string | null;
  consumptionType: ConsumptionType;
  calculationType: CalculationType;
  yieldQuantity: number | null;
  yieldUnitId: string | null;
  yieldUnitName: string | null;
  prepTime: number | null;
  wastagePercent: number | null;
  ruleVersion: number;
  active: boolean;
  items: ConsumptionRuleItem[];
  scalings: ConsumptionRuleScaling[];
  costs: ConsumptionRuleCost[];
  createdAt: string;
  updatedAt: string;
}

export interface ConsumptionRuleItem {
  id: string;
  stockVariantId: string | null;
  variantName: string | null;
  subRuleId: string | null;
  subRuleName: string | null;
  quantity: number | null;
  quantityFormula: string | null;
  unitId: string;
  unitAbbreviation: string | null;
  wastagePercent: number | null;
  optional: boolean;
  scalesWithMultiplier: boolean;
  orderIndex: number;
  alternatives: ItemAlternative[];
}

export interface ItemAlternative {
  id: string;
  stockVariantId: string;
  variantName: string | null;
  priority: number;
  conversionFactor: number;
}

export interface ConsumptionRuleScaling {
  id: string;
  productVariantId: string;
  multiplier: number;
}

export interface ConsumptionRuleCost {
  id: string;
  locationType: string;
  locationId: string;
  calculatedCost: number;
  lastCalculatedAt: string;
}

export const CONSUMPTION_TYPE_LABELS: Record<ConsumptionType, string> = {
  RECIPE: "Recipe",
  BUNDLE: "Bundle",
  COMBO: "Combo",
  MODIFIER: "Modifier",
  MANUFACTURING: "Manufacturing",
  KIT: "Kit",
};

export const CALCULATION_TYPE_LABELS: Record<CalculationType, string> = {
  FIXED: "Fixed Quantity",
  SCALED: "Scaled",
  FORMULA: "Formula",
};
