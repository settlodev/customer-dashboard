import { array, boolean, number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const StockVariantSchema = object({
  id: string().uuid().optional(),
  name: string({ required_error: "Variant name is required" }).min(
    1,
    "Variant name is required",
  ),
  sku: string().optional().nullish(),
  unitId: string({ required_error: "Unit is required" }).uuid(
    "Select a valid unit",
  ),
  conversionToBase: preprocess(
    toNumber,
    number({ required_error: "Conversion factor is required" }).positive(
      "Must be positive",
    ),
  ),
  defaultCost: preprocess(toNumber, number().nonnegative().optional()),
  barcode: string().max(50).optional().nullish(),
  serialTracked: boolean().default(false),
  archived: boolean().default(false),
  initialQuantity: preprocess(toNumber, number().nonnegative().default(0)),
  initialUnitCost: preprocess(toNumber, number().nonnegative().default(0)),
});

export const StockSchema = object({
  name: string({ required_error: "Stock name is required" }).min(
    2,
    "Name must be at least 2 characters",
  ),
  description: string().optional().nullish(),
  baseUnitId: string({ required_error: "Base unit is required" }).uuid(
    "Select a valid unit",
  ),
  materialType: string().default("FINISHED_GOOD"),
  variants: array(StockVariantSchema).min(
    1,
    "At least one variant is required",
  ),
});
