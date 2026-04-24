// Shared BOM types mirror the DTOs published by the Inventory Service at
// /api/v1/bom and the analytics envelopes from the Reports Service at
// /api/v2/analytics/bom. Field names match the backend exactly so we can
// round-trip JSON without transformation.

export type BomLifecycleStatus = "DRAFT" | "ACTIVE" | "DEPRECATED";

export type BomItemCategory =
  | "STOCK"
  | "PHANTOM"
  | "TEXT"
  | "NON_STOCK"
  | "DOCUMENT"
  | "SUB_RULE";

export type BomSubstitutionStrategy =
  | "NONE"
  | "PRIORITY"
  | "PROBABILITY"
  | "AVAILABILITY"
  | "MANUAL";

export type BomOutputType = "PRIMARY" | "CO_PRODUCT" | "BY_PRODUCT";

export type BomCostAllocationMethod = "PHYSICAL_QTY" | "FIXED_PERCENT" | "MARKET_PRICE";

export type BomCostMethod = "STANDARD" | "MOVING_AVG" | "LATEST" | "PLANNED";

export type LocationType = "LOCATION" | "STORE" | "WAREHOUSE";

export type DeductionFailureReason =
  | "INSUFFICIENT_STOCK"
  | "SUBSTITUTES_EXHAUSTED"
  | "RULE_NOT_FOUND"
  | "FORMULA_ERROR"
  | "CYCLE_DETECTED"
  | "UNIT_CONVERSION_MISSING"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export interface BomRuleItemSubstitute {
  id?: string;
  stockVariantId: string;
  priority: number;
  usageProbability?: number | null;
  conversionFactor: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  notes?: string | null;
}

export interface BomRuleItem {
  id?: string;
  itemNumber: string;
  itemCategory: BomItemCategory;
  stockVariantId?: string | null;
  subRuleId?: string | null;
  quantity?: number | null;
  quantityFormula?: string | null;
  unitId?: string | null;
  componentScrapPercent?: number | null;
  operationScrapPercent?: number | null;
  fixedQuantity?: boolean;
  scalesWithMultiplier?: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  text?: string | null;
  attachmentId?: string | null;
  backflushed?: boolean;
  substitutionStrategy: BomSubstitutionStrategy;
  optional?: boolean;
  sortOrder?: number;
  notes?: string | null;
  substitutes: BomRuleItemSubstitute[];
}

export interface BomRuleOutput {
  id?: string;
  stockVariantId: string;
  outputType: BomOutputType;
  yieldQuantity: number;
  yieldUnitId: string;
  costAllocationMethod?: BomCostAllocationMethod | null;
  costAllocationPercent?: number | null;
  byProductValue?: number | null;
  sortOrder?: number;
}

export interface BomOperation {
  id?: string;
  sequence: number;
  name: string;
  workCenter?: string | null;
  setupMinutes?: number | null;
  runMinutesPerUnit?: number | null;
  laborRatePerHour?: number | null;
  overheadRatePerHour?: number | null;
  machineRatePerHour?: number | null;
  scrapPercent?: number | null;
  notes?: string | null;
}

export interface BomRule {
  id: string;
  businessId: string;
  locationId: string;
  locationType: LocationType;
  productVariantId: string;
  modifierOptionId?: string | null;
  name: string;
  revisionNumber: string;
  lifecycleStatus: BomLifecycleStatus;
  effectiveFrom: string;
  effectiveTo?: string | null;
  baseQuantity: number;
  baseUnitId: string;
  baseUnitName?: string | null;
  baseCostCached?: number | null;
  baseCostMethod?: BomCostMethod | null;
  baseCostCalculatedAt?: string | null;
  notes?: string | null;
  items: BomRuleItem[];
  outputs: BomRuleOutput[];
  operations: BomOperation[];
  createdAt: string;
  updatedAt: string;
}

// Response from POST /rules/{id}/calculate-cost
export interface BomCostSnapshot {
  id: string;
  bomRuleId: string;
  costMethod: BomCostMethod;
  materialCost: number;
  scrapCost: number;
  overheadCost: number;
  operationCost: number;
  byProductCredit: number;
  totalCost: number;
  breakdownJson?: string | null;
  calculatedAt: string;
}

// Response from GET /rules/{id}/explode
export interface ExplodedLine {
  level: number;
  itemNumber: string;
  itemCategory: BomItemCategory;
  stockVariantId?: string | null;
  variantName?: string | null;
  quantity: number;
  unitId?: string | null;
  unitAbbreviation?: string | null;
  subRuleId?: string | null;
  optional: boolean;
  requiresDeduction: boolean;
}

// Multi-level where-used response
export interface WhereUsedNode {
  depth: number;
  ruleId: string;
  parentRuleId?: string | null;
  businessId: string;
  locationId: string;
  productVariantId?: string | null;
  modifierOptionId?: string | null;
  name: string;
  revisionNumber: string;
  lifecycleStatus: BomLifecycleStatus;
}

// Diff response
export interface BomRuleDiff {
  ruleAId: string;
  ruleARevision: string;
  ruleBId: string;
  ruleBRevision: string;
  headerChanges: FieldChange[];
  itemsAdded: ItemSummary[];
  itemsRemoved: ItemSummary[];
  itemsChanged: ItemDiff[];
  outputsAdded: OutputSummary[];
  outputsRemoved: OutputSummary[];
  outputsChanged: OutputDiff[];
}

export interface FieldChange {
  field: string;
  before?: string | null;
  after?: string | null;
}

export interface ItemSummary {
  itemNumber: string;
  category: BomItemCategory;
  stockVariantId?: string | null;
  subRuleId?: string | null;
  quantity?: number | null;
  unitId?: string | null;
}

export interface ItemDiff {
  itemNumber: string;
  changes: FieldChange[];
}

export interface OutputSummary {
  stockVariantId: string;
  outputType: BomOutputType;
  yieldQuantity: number;
  yieldUnitId: string;
}

export interface OutputDiff {
  stockVariantId: string;
  changes: FieldChange[];
}

// Mass change
export interface ReplaceVariantPreview {
  fromVariantId: string;
  toVariantId: string;
  rulesAffectedCount: number;
  rules: ReplaceVariantPreviewRule[];
}

export interface ReplaceVariantPreviewRule {
  ruleId: string;
  locationId: string;
  name: string;
  revisionNumber: string;
  items: ReplaceVariantPreviewItem[];
}

export interface ReplaceVariantPreviewItem {
  itemId: string;
  itemNumber: string;
  role: "PRIMARY" | "SUBSTITUTE";
  variantName?: string | null;
}

export interface ReplaceVariantApplyResult {
  rulesUpdated: number;
  newRevisionIds: string[];
  errors: string[];
}

// ── Analytics response shapes (Reports Service) ───────────────────────

export interface BomRecipeCostTrend {
  bomRuleId: string;
  ruleName: string;
  revisionNumber: string;
  costMethod: BomCostMethod;
  businessDate: string;
  materialCost: number;
  scrapCost: number;
  operationCost: number;
  byProductCredit: number;
  totalCost: number;
}

export interface BomSubstituteUsageSummary {
  bomRuleId: string;
  bomItemId: string;
  primaryVariantId?: string | null;
  chosenVariantId: string;
  strategy: BomSubstitutionStrategy;
  fireCount: number;
  totalQuantity: number;
}

export interface BomMissingRuleSummary {
  businessDate: string;
  locationId: string;
  kind: "PRODUCT" | "MODIFIER";
  productVariantId?: string | null;
  modifierOptionId?: string | null;
  missCount: number;
}

export interface BomDeductionFailureRow {
  eventId: string;
  occurredAt: string;
  locationId: string;
  orderId?: string | null;
  orderItemId?: string | null;
  productVariantId?: string | null;
  modifierOptionId?: string | null;
  bomRuleId?: string | null;
  reason: DeductionFailureReason;
  attemptedQuantity: number;
  message?: string | null;
}

export interface BomProductionYieldRow {
  bomRuleId: string;
  bomRuleName: string;
  businessDate: string;
  completedRuns: number;
  totalPlanned: number;
  totalProduced: number;
  avgVariancePct: number;
}

export interface BomCostCascadeRow {
  eventId: string;
  occurredAt: string;
  locationId: string;
  triggerVariantId: string;
  previousAvgCost: number;
  newAvgCost: number;
  rulesInvalidated: number;
}

// ── UI labels ─────────────────────────────────────────────────────────

export const BOM_LIFECYCLE_LABELS: Record<BomLifecycleStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  DEPRECATED: "Deprecated",
};

export const BOM_ITEM_CATEGORY_LABELS: Record<BomItemCategory, string> = {
  STOCK: "Stock",
  PHANTOM: "Phantom",
  TEXT: "Text / note",
  NON_STOCK: "Non-stock",
  DOCUMENT: "Document",
  SUB_RULE: "Sub-rule",
};

export const BOM_SUBSTITUTION_STRATEGY_LABELS: Record<BomSubstitutionStrategy, string> = {
  NONE: "None",
  PRIORITY: "Priority",
  PROBABILITY: "Probability",
  AVAILABILITY: "Availability",
  MANUAL: "Manual",
};

export const BOM_OUTPUT_TYPE_LABELS: Record<BomOutputType, string> = {
  PRIMARY: "Primary",
  CO_PRODUCT: "Co-product",
  BY_PRODUCT: "By-product",
};

export const BOM_COST_METHOD_LABELS: Record<BomCostMethod, string> = {
  STANDARD: "Standard",
  MOVING_AVG: "Moving average",
  LATEST: "Latest",
  PLANNED: "Planned",
};

export const DEDUCTION_FAILURE_LABELS: Record<DeductionFailureReason, string> = {
  INSUFFICIENT_STOCK: "Insufficient stock",
  SUBSTITUTES_EXHAUSTED: "Substitutes exhausted",
  RULE_NOT_FOUND: "Rule not found",
  FORMULA_ERROR: "Formula error",
  CYCLE_DETECTED: "Cycle detected",
  UNIT_CONVERSION_MISSING: "Unit conversion missing",
  VALIDATION_ERROR: "Validation error",
  INTERNAL_ERROR: "Internal error",
};
