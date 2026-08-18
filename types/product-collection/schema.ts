import { array, boolean, coerce, object, string } from "zod";

const ISO_CURRENCY = string().length(3, "Currency must be a 3-letter ISO code");

const positiveNumber = coerce
  .number({ invalid_type_error: "Must be a number" })
  .positive("Must be greater than zero");

/** One variant line in a bundle (variantId + quantity ≥ 0.000001). */
export const CollectionItemSchema = object({
  variantId: string().uuid("Variant id must be a UUID"),
  quantity: positiveNumber,
});

/** One per-currency bundle price override. */
export const CollectionPriceSchema = object({
  currency: ISO_CURRENCY,
  price: positiveNumber,
  active: boolean().optional(),
  notes: string().optional(),
});

/**
 * Form-side schema for create/update. The custom price is optional —
 * leaving it blank means "default to the sum of variant line totals".
 * Currency overrides may be empty.
 */
export const ProductCollectionSchema = object({
  name: string({ required_error: "Collection name is required" }).min(
    2,
    "Name must be at least 2 characters",
  ),
  description: string().optional(),
  imageUrl: string().optional(),
  active: boolean().optional(),
  nativeCurrency: ISO_CURRENCY.optional(),
  customPrice: positiveNumber.optional().nullable(),
  items: array(CollectionItemSchema).min(
    1,
    "A bundle must have at least one variant",
  ),
  currencyOverrides: array(CollectionPriceSchema).optional(),
});
