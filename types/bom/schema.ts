import { array, boolean, number, object, preprocess, string, z } from "zod";

/**
 * Zod schemas for BOM rule create/revise payloads. Shape matches the
 * Inventory Service's CreateBomRuleRequest / ReviseBomRuleRequest records
 * one-for-one; the /api/v1/bom/rules endpoint validates server-side too.
 */

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

const toOptionalNumber = preprocess(toNumber, number().optional().nullable());
const toNonNegativeNumber = preprocess(toNumber, number().nonnegative().optional().nullable());
const toPositiveNumber = preprocess(toNumber, number().positive().optional().nullable());
const toPercent = preprocess(toNumber, number().min(0).max(100).optional().nullable());

export const BomSubstitutionStrategyEnum = z.enum([
  "NONE",
  "PRIORITY",
  "PROBABILITY",
  "AVAILABILITY",
  "MANUAL",
]);

export const BomItemCategoryEnum = z.enum([
  "STOCK",
  "PHANTOM",
  "TEXT",
  "NON_STOCK",
  "DOCUMENT",
  "SUB_RULE",
]);

export const BomOutputTypeEnum = z.enum(["PRIMARY", "CO_PRODUCT", "BY_PRODUCT"]);

export const BomCostAllocationMethodEnum = z.enum([
  "PHYSICAL_QTY",
  "FIXED_PERCENT",
  "MARKET_PRICE",
]);

export const BomRuleItemSubstituteSchema = object({
  stockVariantId: string({ required_error: "Substitute variant is required" }).uuid(),
  priority: preprocess(toNumber, number().int().nonnegative().default(100)),
  usageProbability: toPercent,
  conversionFactor: preprocess(toNumber, number().positive().default(1)),
  effectiveFrom: string().optional().nullable(),
  effectiveTo: string().optional().nullable(),
  notes: string().optional().nullable(),
});

export const BomRuleItemSchema = object({
  itemNumber: string({ required_error: "Item number is required" }).min(1).max(16),
  itemCategory: BomItemCategoryEnum,
  stockVariantId: string().uuid().optional().nullable(),
  subRuleId: string().uuid().optional().nullable(),
  quantity: toPositiveNumber,
  quantityFormula: string().max(1000).optional().nullable(),
  unitId: string().uuid().optional().nullable(),
  componentScrapPercent: toPercent,
  operationScrapPercent: toPercent,
  fixedQuantity: boolean().default(false),
  scalesWithMultiplier: boolean().default(true),
  effectiveFrom: string().optional().nullable(),
  effectiveTo: string().optional().nullable(),
  text: string().optional().nullable(),
  attachmentId: string().uuid().optional().nullable(),
  backflushed: boolean().default(true),
  substitutionStrategy: BomSubstitutionStrategyEnum.default("NONE"),
  optional: boolean().default(false),
  sortOrder: preprocess(toNumber, number().int().nonnegative().default(0)),
  notes: string().optional().nullable(),
  substitutes: array(BomRuleItemSubstituteSchema).default([]),
}).superRefine((item, ctx) => {
  // Category-specific coherence matching BomValidator on the backend.
  if (item.itemCategory === "STOCK" && !item.stockVariantId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Stock items require a stock variant",
      path: ["stockVariantId"],
    });
  }
  if (item.itemCategory === "SUB_RULE" && !item.subRuleId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Sub-rule items require a rule reference",
      path: ["subRuleId"],
    });
  }
  if (item.itemCategory === "TEXT" && !item.text) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Text items require content",
      path: ["text"],
    });
  }
  if (
    (item.itemCategory === "STOCK" || item.itemCategory === "NON_STOCK") &&
    !item.quantity &&
    !item.quantityFormula
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either a quantity or a formula is required",
      path: ["quantity"],
    });
  }
});

export const BomRuleOutputSchema = object({
  stockVariantId: string({ required_error: "Output variant is required" }).uuid(),
  outputType: BomOutputTypeEnum,
  yieldQuantity: preprocess(toNumber, number().positive()),
  yieldUnitId: string({ required_error: "Yield unit is required" }).uuid(),
  costAllocationMethod: BomCostAllocationMethodEnum.optional().nullable(),
  costAllocationPercent: toPercent,
  byProductValue: toNonNegativeNumber,
  sortOrder: preprocess(toNumber, number().int().nonnegative().default(0)),
});

export const BomOperationSchema = object({
  sequence: preprocess(toNumber, number().int().nonnegative()),
  name: string({ required_error: "Operation name is required" }).min(1),
  workCenter: string().optional().nullable(),
  setupMinutes: toNonNegativeNumber,
  runMinutesPerUnit: toNonNegativeNumber,
  laborRatePerHour: toNonNegativeNumber,
  overheadRatePerHour: toNonNegativeNumber,
  machineRatePerHour: toNonNegativeNumber,
  scrapPercent: toPercent,
  notes: string().optional().nullable(),
});

const BaseRuleFields = {
  name: string({ required_error: "Rule name is required" }).min(2, "Name must be at least 2 characters"),
  effectiveFrom: string().optional().nullable(),
  effectiveTo: string().optional().nullable(),
  baseQuantity: preprocess(toNumber, number().positive().default(1)),
  baseUnitId: string({ required_error: "Base unit is required" }).uuid(),
  notes: string().optional().nullable(),
  items: array(BomRuleItemSchema).min(1, "At least one item is required"),
  outputs: array(BomRuleOutputSchema).default([]),
  operations: array(BomOperationSchema).default([]),
} as const;

export const CreateBomRuleSchema = object({
  productVariantId: string().uuid().optional().nullable(),
  modifierOptionId: string().uuid().optional().nullable(),
  ...BaseRuleFields,
}).superRefine((value, ctx) => {
  if (!value.productVariantId && !value.modifierOptionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either productVariantId or modifierOptionId is required",
      path: ["productVariantId"],
    });
  }
  if (value.productVariantId && value.modifierOptionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Only one of productVariantId / modifierOptionId may be set",
      path: ["modifierOptionId"],
    });
  }
});

export const ReviseBomRuleSchema = object({
  ...BaseRuleFields,
  effectiveFrom: string({ required_error: "Effective-from is required on revisions" }),
});

export const CopyToLocationSchema = object({
  sourceLocationId: string().uuid(),
  targetLocationId: string().uuid(),
  productVariantIds: array(string().uuid()).optional().nullable(),
  modifierOptionIds: array(string().uuid()).optional().nullable(),
  effectiveFrom: string().optional().nullable(),
  overwriteExisting: boolean().default(false),
}).refine((v) => v.sourceLocationId !== v.targetLocationId, {
  message: "Source and target locations must differ",
  path: ["targetLocationId"],
});

export const ReplaceVariantSchema = object({
  fromVariantId: string({ required_error: "From variant is required" }).uuid(),
  toVariantId: string({ required_error: "To variant is required" }).uuid(),
  conversionFactor: preprocess(toNumber, number().positive().default(1)),
  targetLocationIds: array(string().uuid()).optional().nullable(),
  effectiveFrom: string().optional().nullable(),
});

export const CalculateCostSchema = object({
  costMethod: z.enum(["STANDARD", "MOVING_AVG", "LATEST", "PLANNED"]).default("MOVING_AVG"),
});

export type CreateBomRuleValues = z.infer<typeof CreateBomRuleSchema>;
export type ReviseBomRuleValues = z.infer<typeof ReviseBomRuleSchema>;
export type CopyToLocationValues = z.infer<typeof CopyToLocationSchema>;
export type ReplaceVariantValues = z.infer<typeof ReplaceVariantSchema>;
