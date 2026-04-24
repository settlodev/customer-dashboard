import { z } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

const uuid = z.string().uuid("Must be a valid UUID");

export const CreateStockTakeSchema = z
  .object({
    locationType: z
      .enum(["LOCATION", "STORE", "WAREHOUSE"], {
        required_error: "Select where the count will take place",
      })
      .default("LOCATION"),
    cycleCountType: z
      .enum(["FULL", "ABC_CLASS", "RANDOM", "ZONE"])
      .default("FULL"),
    blindCount: z.boolean().optional(),
    notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional(),

    abcClass: z.enum(["A", "B", "C"]).optional(),
    zoneId: uuid.optional(),

    sampleMode: z.enum(["size", "percentage"]).optional(),
    sampleSize: z
      .preprocess(toNumber, z.number().int("Must be a whole number").positive("Must be greater than 0"))
      .optional(),
    samplePercentage: z
      .preprocess(
        toNumber,
        z
          .number()
          .positive("Must be greater than 0")
          .max(100, "Cannot exceed 100%"),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.cycleCountType) {
      case "ABC_CLASS":
        if (!data.abcClass) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["abcClass"],
            message: "Pick an ABC class",
          });
        }
        break;
      case "ZONE":
        if (!data.zoneId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["zoneId"],
            message: "Enter a warehouse zone",
          });
        }
        break;
      case "RANDOM":
        if (!data.sampleMode) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sampleMode"],
            message: "Choose sample size or percentage",
          });
          break;
        }
        if (data.sampleMode === "size" && data.sampleSize == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sampleSize"],
            message: "Enter the number of items to sample",
          });
        }
        if (data.sampleMode === "percentage" && data.samplePercentage == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["samplePercentage"],
            message: "Enter a percentage between 0 and 100",
          });
        }
        break;
    }
  });

export type CreateStockTakeInput = z.infer<typeof CreateStockTakeSchema>;

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
