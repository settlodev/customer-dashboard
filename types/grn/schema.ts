import { z } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const CreateGrnItemSchema = z
  .object({
    stockVariantId: z.string({ required_error: "Stock item is required" }).uuid(),
    receivedQuantity: z.preprocess(
      toNumber,
      z
        .number({ required_error: "Received quantity is required" })
        .positive("Received quantity must be greater than zero"),
    ),
    unitCost: z.preprocess(
      toNumber,
      z
        .number({ required_error: "Unit cost is required" })
        .nonnegative("Unit cost cannot be negative"),
    ),
    batchNumber: z.string().optional(),
    supplierBatchReference: z.string().optional(),
    expiryDate: z.string().optional(),
    serialNumbers: z.array(z.string().min(1, "Serial cannot be empty")).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.serialNumbers && val.serialNumbers.length > 0) {
      if (val.serialNumbers.length !== Math.trunc(val.receivedQuantity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["serialNumbers"],
          message: `Provide exactly ${val.receivedQuantity} serial numbers`,
        });
      }
      const unique = new Set(val.serialNumbers);
      if (unique.size !== val.serialNumbers.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["serialNumbers"],
          message: "Serial numbers must be unique",
        });
      }
    }
  });

export const CreateGrnSchema = z.object({
  lpoId: z.string().uuid().optional().or(z.literal("")),
  supplierId: z.string({ required_error: "Supplier is required" }).uuid("Supplier is required"),
  receivedBy: z.string({ required_error: "Receiver is required" }).uuid("Receiver is required"),
  receivedDate: z
    .string({ required_error: "Received date is required" })
    .min(1, "Received date is required"),
  notes: z.string().optional(),
  deliveryPersonName: z.string().optional(),
  deliveryPersonPhone: z.string().optional(),
  deliveryPersonEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  items: z.array(CreateGrnItemSchema).min(1, "Add at least one item"),
});

export const AddLandedCostSchema = z.object({
  costType: z.enum(["FREIGHT", "CUSTOMS", "INSURANCE", "HANDLING", "OTHER"]),
  amount: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Amount is required" })
      .positive("Amount must be greater than zero"),
  ),
  description: z.string().optional(),
});

export const RecordInspectionSchema = z
  .object({
    inspectionStatus: z.enum(["PASSED", "FAILED", "PARTIAL"]),
    inspectedQuantity: z.preprocess(
      toNumber,
      z.number().nonnegative().optional(),
    ),
    rejectedQuantity: z.preprocess(
      toNumber,
      z.number().nonnegative().optional(),
    ),
  })
  .superRefine((val, ctx) => {
    if (val.inspectionStatus === "PARTIAL") {
      if (val.inspectedQuantity == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inspectedQuantity"],
          message: "Required for partial inspection",
        });
      }
      if (val.rejectedQuantity == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rejectedQuantity"],
          message: "Required for partial inspection",
        });
      }
    }
  });
