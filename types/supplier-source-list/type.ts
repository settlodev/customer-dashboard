import { z } from "zod";
import { object, string, number, boolean } from "zod";

export interface SupplierSourceList {
  id: string;
  stockVariantId: string;
  stockVariantName?: string | null;
  stockName?: string | null;
  supplierId: string;
  supplierName?: string | null;
  businessId: string;
  priority: number;
  isFixedSource: boolean;
  validFrom: string | null;
  validTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SupplierSourceListSchema = object({
  stockVariantId: string().uuid("Pick a variant"),
  supplierId: string().uuid("Pick a supplier"),
  priority: number({ invalid_type_error: "Priority is required" })
    .int("Must be a whole number")
    .min(1, "Lowest priority is 1")
    .max(99, "Highest priority is 99")
    .default(1),
  isFixedSource: boolean().default(false),
  validFrom: string().optional().nullish(),
  validTo: string().optional().nullish(),
  notes: string().max(500).optional().nullish(),
});

export type SupplierSourceListPayload = z.infer<typeof SupplierSourceListSchema>;
