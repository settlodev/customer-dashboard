import { z } from "zod";
import { object, string, number } from "zod";

export interface SupplierPricing {
  id: string;
  supplierId: string;
  stockVariantId: string;
  stockVariantName?: string | null;
  stockName?: string | null;
  businessId: string;
  unitPrice: number;
  currency: string;
  minOrderQuantity: number;
  leadTimeDays: number;
  paymentTerms: string | null;
  validFrom: string | null;
  validTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SupplierPricingSchema = object({
  supplierId: string().uuid("Pick a supplier"),
  stockVariantId: string().uuid("Pick a variant"),
  unitPrice: number({ invalid_type_error: "Unit price is required" })
    .nonnegative("Cannot be negative"),
  currency: string().min(3).max(3).default("TZS"),
  minOrderQuantity: number({ invalid_type_error: "MOQ is required" })
    .nonnegative("Cannot be negative")
    .default(1),
  leadTimeDays: number({ invalid_type_error: "Lead time is required" })
    .int("Must be a whole number")
    .nonnegative("Cannot be negative")
    .default(7),
  paymentTerms: string().max(200).optional().nullish(),
  validFrom: string().optional().nullish(),
  validTo: string().optional().nullish(),
  notes: string().max(500).optional().nullish(),
});

export type SupplierPricingPayload = z.infer<typeof SupplierPricingSchema>;
