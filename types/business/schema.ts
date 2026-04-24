import { isValidPhoneNumber } from "libphonenumber-js";
import { boolean, number, object, string, z } from "zod";

const currencyCode = string()
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO code")
  .transform((v) => v.toUpperCase());

const optionalUrl = string().url("Must be a valid URL").max(500).optional().or(z.literal(""));

/**
 * BusinessSchema — write payload for the business entity itself
 * (mirrors UpdateBusinessRequest on the backend).
 */
export const BusinessSchema = object({
  id: string().uuid().optional(),
  name: string({ required_error: "Business name is required" })
    .min(2, "Business must be at least 2 characters")
    .max(255, "Business can not be more than 255 characters"),
  description: string().max(2000).nullable().optional(),
  phoneNumber: string({ required_error: "Phone number is required" })
    .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
  email: string({ required_error: "Email address is required" }).email("Invalid email address"),
  website: string().max(500).nullable().optional(),
  active: boolean().optional(),
  countryId: string({ required_error: "Country is required" }).uuid(),
  region: string().max(100).nullable().optional(),
  district: string().max(100).nullable().optional(),
  ward: string().max(100).nullable().optional(),
  address: string().max(500).nullable().optional(),
  postalCode: string().max(20).nullable().optional(),
  logoUrl: string().max(500).nullable().optional(),
});

export type BusinessUpdate = z.infer<typeof BusinessSchema>;

/**
 * BusinessSettingsSchema — write payload for `/api/v1/businesses/{id}/settings`
 * (mirrors UpdateBusinessSettingsRequest). Every field is optional on the wire;
 * the form picks the section it edits.
 */
export const BusinessSettingsSchema = object({
  // Legal entity
  businessLicenseNumber: string().max(100).optional(),
  companyRegistrationNumber: string().max(100).optional(),
  taxIdentificationNumber: string().max(100).optional(),
  establishedYear: number().int().min(1800).max(new Date().getFullYear()).optional(),

  // EFD
  efdSerialNumber: string().max(100).optional(),
  vatRegistrationNumber: string().max(100).optional(),
  uniqueIdentificationNumber: string().max(100).optional(),
  enableVirtualEfd: boolean().optional(),
  efdStatus: z.enum(["REQUESTED", "AWAITING_CONFIRMATION", "ACTIVE"]).optional(),

  // Social media (parent company)
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  twitterUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  whatsappNumber: string().max(20).optional(),

  // Template
  defaultCurrency: currencyCode.optional(),

  // Consolidated reports
  notificationEmail: string().email("Invalid email").max(255).optional().or(z.literal("")),
  notificationPhone: string().max(20).optional(),
  sendConsolidatedDailyReport: boolean().optional(),
  sendConsolidatedWeeklyReport: boolean().optional(),
  sendConsolidatedMonthlyReport: boolean().optional(),

  // Procurement
  requirePurchaseRequisitionApproval: boolean().optional(),
  supplierPerformanceTrackingEnabled: boolean().optional(),
  landedCostTrackingEnabled: boolean().optional(),
  locationToLocationTransferEnabled: boolean().optional(),

  // Legal text
  termsAndConditions: string().optional(),
  privacyPolicy: string().optional(),
  returnPolicy: string().optional(),
});

export type BusinessSettingsUpdate = z.infer<typeof BusinessSettingsSchema>;
