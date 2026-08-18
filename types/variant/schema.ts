import { object, string, number, preprocess, boolean } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const VariantSchema = object({
  id: string().uuid().optional().nullish(),
  name: string({ required_error: "Variant name is required" }).min(
    1,
    "Variant name is required",
  ),

  // Pricing
  pricingStrategy: string().default("MANUAL"),
  price: preprocess(
    toNumber,
    number({ message: "Price is required" })
      .nonnegative({ message: "Price cannot be negative" }),
  ),
  costPrice: preprocess(toNumber, number().nonnegative().optional()),
  markupPercentage: preprocess(toNumber, number().positive().optional().nullish()),
  markupAmount: preprocess(toNumber, number().positive().optional().nullish()),

  // Identity
  sku: string().optional().nullish(),
  imageUrl: string().optional().nullish(),

  // Quantity
  availableQuantity: preprocess(toNumber, number().nonnegative().optional().nullish()),
  unlimited: boolean().default(false),

  // Stock linking
  stockLinkType: string().optional().nullish(),
  stockVariantId: string().uuid().optional().nullish(),
  directQuantity: preprocess(toNumber, number().positive().optional().nullish()),
  consumptionRuleId: string().uuid().optional().nullish(),
});
