import { z } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const CreateStockTakeSchema = z.object({
  notes: z.string().optional(),
  cycleCountType: z
    .enum(["FULL", "CATEGORY", "ABC_CLASS", "RANDOM", "ZONE"])
    .optional(),
  filterCriteria: z.string().optional(),
  blindCount: z.boolean().optional(),
});

export const RecordCountSchema = z.object({
  itemId: z.string({ required_error: "Item is required" }).uuid(),
  countedQuantity: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Counted quantity is required" })
      .nonnegative("Count cannot be negative"),
  ),
  notes: z.string().optional(),
});
