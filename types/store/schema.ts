import * as z from "zod";

export const StoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  businessId: z.string().uuid("Business ID is required"),
  locationId: z.string().uuid("Location ID is required"),
  storeNumber: z.string().optional(),
  code: z.string().optional(),
  storeType: z.string().optional(),
  timezone: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().optional(),
});
