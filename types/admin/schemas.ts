import { z } from "zod";

import { InternalRole } from "@/types/types";

// ── Internal users (Auth Service) ───────────────────────────────────

const INTERNAL_ROLES = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
  "BOARD_MEMBER",
  "SALES_TEAM",
] as const satisfies readonly InternalRole[];

export const CreateInternalUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(100, "Password is too long"),
  role: z.enum(INTERNAL_ROLES, {
    errorMap: () => ({ message: "Select a role" }),
  }),
});

export const UpdateInternalRoleSchema = z.object({
  role: z.enum(INTERNAL_ROLES, {
    errorMap: () => ({ message: "Select a role" }),
  }),
});

// ── Support agents (Accounts Service) ───────────────────────────────

export const CreateSupportAgentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(100, "Password is too long"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

// ── Billing (Billing Service) ───────────────────────────────────────

export const GenerateInvoiceSchema = z.object({
  months: z
    .number()
    .int("Months must be a whole number")
    .min(1, "Minimum 1 month")
    .max(36, "Maximum 36 months"),
});

export const RecordManualPaymentSchema = z.object({
  paymentMethod: z.enum([
    "MOBILE_MONEY",
    "BANK_TRANSFER",
    "CASH",
    "CHECK",
    "OTHER",
  ]),
  referenceNumber: z.string().min(1, "Reference number is required"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().max(500).optional(),
});

export const CreateRefundSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason is too long"),
});

export const ApplyDiscountSchema = z.object({
  discountId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const GrantFreeSubscriptionSchema = z.object({
  durationMonths: z
    .number()
    .int()
    .min(1, "Minimum 1 month")
    .max(120, "Maximum 120 months")
    .optional(),
  reason: z.string().min(1, "Reason is required").max(500),
});

// ── Subscription mutations ──────────────────────────────────────────

export const UpgradePlanSchema = z.object({
  subscriptionItemId: z.string().uuid("Pick a subscription item"),
  newPackageId: z.string().uuid("Pick a target package"),
});

export const AddSubscriptionAddonSchema = z.object({
  subscriptionItemId: z.string().uuid("Pick a subscription item"),
  addonId: z.string().uuid("Pick an addon"),
});

export const AttachInvoiceSchema = z.object({
  invoiceId: z.string().uuid("Invoice ID is required"),
  businessId: z.string().uuid("Business ID is required"),
  locationId: z
    .string()
    .uuid("Location ID must be a UUID")
    .optional()
    .or(z.literal("")),
  subscriptionId: z
    .string()
    .uuid("Subscription ID must be a UUID")
    .optional()
    .or(z.literal("")),
});

// ── Catalog (super admin) ───────────────────────────────────────────

const SUBSCRIBABLE_ENTITY_TYPES = ["LOCATION", "WAREHOUSE", "STORE"] as const;

export const CreatePackageSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  basePrice: z.number().nonnegative("Price cannot be negative"),
  entityType: z.enum(SUBSCRIBABLE_ENTITY_TYPES, {
    errorMap: () => ({ message: "Pick an entity type" }),
  }),
  includedWarehouseCount: z
    .number()
    .int("Must be a whole number")
    .nonnegative("Cannot be negative")
    .optional(),
  includedStoreCount: z
    .number()
    .int("Must be a whole number")
    .nonnegative("Cannot be negative")
    .optional(),
});

export const CreateAddonSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.number().nonnegative("Price cannot be negative"),
  entityType: z.enum(SUBSCRIBABLE_ENTITY_TYPES, {
    errorMap: () => ({ message: "Pick an entity type" }),
  }),
});

// ── Discount definitions ────────────────────────────────────────────

const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED_AMOUNT"] as const;
const DISCOUNT_SCOPES = ["SUBSCRIPTION", "ITEM", "INVOICE"] as const;
const DISCOUNT_SOURCES = [
  "ADMIN_GRANTED",
  "SUPPORT_GRANTED",
  "PROMOTION",
  "REFERRAL",
] as const;

export const CreateDiscountSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(120),
    description: z.string().max(500).optional().or(z.literal("")),
    discountType: z.enum(DISCOUNT_TYPES, {
      errorMap: () => ({ message: "Pick a discount type" }),
    }),
    discountValue: z.number().nonnegative("Value cannot be negative"),
    scope: z.enum(DISCOUNT_SCOPES, {
      errorMap: () => ({ message: "Pick a scope" }),
    }),
    source: z.enum(DISCOUNT_SOURCES, {
      errorMap: () => ({ message: "Pick a source" }),
    }),
    durationMonths: z
      .number()
      .int("Must be a whole number")
      .min(1, "Minimum 1 month")
      .max(120, "Maximum 120 months")
      .optional(),
    stackable: z.boolean().optional(),
    maxApplications: z
      .number()
      .int("Must be a whole number")
      .min(1, "Minimum 1")
      .optional(),
    validFrom: z.string().min(1, "Valid-from is required"),
    validUntil: z.string().optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    // Percentage values must fall in [0, 100] so callers can't mint a
    // 9000%-off discount via the UI.
    if (
      value.discountType === "PERCENTAGE" &&
      (value.discountValue < 0 || value.discountValue > 100)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percentage must be between 0 and 100",
      });
    }
  });

// ── Coupons ─────────────────────────────────────────────────────────

export const CreateCouponSchema = z
  .object({
    code: z
      .string()
      .min(2, "Code must be at least 2 characters")
      .max(40, "Code is too long")
      .regex(/^[A-Z0-9_-]+$/i, "Use letters, numbers, dash or underscore only"),
    description: z.string().max(500).optional().or(z.literal("")),
    discountType: z.enum(DISCOUNT_TYPES, {
      errorMap: () => ({ message: "Pick a discount type" }),
    }),
    discountValue: z.number().nonnegative("Value cannot be negative"),
    maxUses: z
      .number()
      .int("Must be a whole number")
      .min(1, "Minimum 1 use")
      .optional(),
    validFrom: z.string().min(1, "Valid-from is required"),
    validUntil: z.string().min(1, "Valid-until is required"),
  })
  .superRefine((value, ctx) => {
    if (
      value.discountType === "PERCENTAGE" &&
      (value.discountValue < 0 || value.discountValue > 100)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percentage must be between 0 and 100",
      });
    }
  });

// ── Features ────────────────────────────────────────────────────────

const FEATURE_TYPES = ["CORE", "ADVANCED", "PREMIUM", "LIMIT"] as const;

export const CreateFeatureSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  featureKey: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(80, "Key is too long")
    .regex(
      /^[a-z][a-z0-9_.]*$/,
      "Use lowercase letters, digits, dot or underscore",
    ),
  featureType: z.enum(FEATURE_TYPES, {
    errorMap: () => ({ message: "Pick a feature type" }),
  }),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const SetPackageFeatureSchema = z.object({
  featureId: z.string().uuid("Pick a feature"),
  featureValue: z.string().max(500).optional().or(z.literal("")),
  isIncluded: z.boolean().optional(),
});

// ── Whitelabel pricing ──────────────────────────────────────────────

export const SetWhitelabelPackagePriceSchema = z.object({
  packageId: z.string().uuid("Pick a package"),
  price: z.number().nonnegative("Price cannot be negative"),
});

export const SetWhitelabelAddonPriceSchema = z.object({
  addonId: z.string().uuid("Pick an addon"),
  price: z.number().nonnegative("Price cannot be negative"),
});

// ── Credit packs ────────────────────────────────────────────────────

export const CreateCreditPackSchema = z.object({
  creditTypeId: z.string().uuid("Pick a credit type"),
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  creditAmount: z
    .number()
    .int("Must be a whole number")
    .min(1, "At least 1 credit"),
  price: z.number().nonnegative("Price cannot be negative"),
});

export const SetPackageIncludedCreditSchema = z.object({
  creditTypeId: z.string().uuid("Pick a credit type"),
  monthlyAmount: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative"),
});
