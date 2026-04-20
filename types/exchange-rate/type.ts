import { z } from "zod";
import { object, string, number, boolean } from "zod";

export type ManualRateScope = "BUSINESS" | "LOCATION";

export interface ManualExchangeRate {
  id: string;
  businessId: string | null;
  locationId: string | null;
  sourceCurrency: string;
  targetCurrency: string;
  rate: number;
  inverseRate: number;
  effectiveDate: string;
  fetchedAt: string;
  notes: string | null;
  createdByOperatorId: string | null;
  scope: ManualRateScope;
}

export const SetManualRateSchema = object({
  sourceCurrency: string({ required_error: "Source currency is required" })
    .trim()
    .length(3, "Use the 3-letter ISO code")
    .transform((v) => v.toUpperCase()),
  targetCurrency: string({ required_error: "Target currency is required" })
    .trim()
    .length(3, "Use the 3-letter ISO code")
    .transform((v) => v.toUpperCase()),
  rate: number({ invalid_type_error: "Rate is required" })
    .positive("Rate must be greater than zero"),
  locationScoped: boolean().default(false),
  notes: string().max(500).optional().nullish(),
}).refine((v) => v.sourceCurrency !== v.targetCurrency, {
  path: ["targetCurrency"],
  message: "Source and target must differ",
});

export type SetManualRatePayload = z.infer<typeof SetManualRateSchema>;
