import { array, boolean, number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const ConsumptionRuleItemSchema = object({
  stockVariantId: string().uuid().optional().nullish(),
  subRuleId: string().uuid().optional().nullish(),
  quantity: preprocess(toNumber, number().positive("Quantity must be positive").optional()),
  quantityFormula: string().max(500).optional().nullish(),
  unitId: string({ required_error: "Unit is required" }).uuid(),
  wastagePercent: preprocess(toNumber, number().min(0).max(100).optional()),
  optional: boolean().default(false),
  scalesWithMultiplier: boolean().default(true),
  orderIndex: number().default(0),
});

export const ConsumptionRuleSchema = object({
  name: string({ required_error: "Rule name is required" }).min(2, "Name must be at least 2 characters"),
  consumptionType: string({ required_error: "Type is required" }),
  calculationType: string({ required_error: "Calculation type is required" }),
  yieldQuantity: preprocess(toNumber, number().positive().optional()),
  yieldUnitId: string().uuid().optional().nullish(),
  prepTime: preprocess(toNumber, number().nonnegative().optional()),
  wastagePercent: preprocess(toNumber, number().min(0).max(100).optional()),
  items: array(ConsumptionRuleItemSchema).min(1, "At least one ingredient is required"),
});
