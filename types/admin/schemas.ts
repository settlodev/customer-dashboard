import { z } from "zod";

// ── Internal users (Auth Service) ───────────────────────────────────
// Roles are dynamic (managed in the role manager), so `role` is any non-empty
// role CODE rather than a fixed enum.

export const CreateInternalUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(100, "Password is too long"),
  role: z.string().min(1, "Select a role").max(100),
});

export const UpdateInternalRoleSchema = z.object({
  role: z.string().min(1, "Select a role").max(100),
});

// ── Internal roles (RBAC role manager) ──────────────────────────────

const ASSIGNABLE_AS = ["", "SALES", "SUPPORT"] as const;

export const CreateInternalRoleSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(100)
    .regex(/^[A-Za-z0-9_]+$/, "Use letters, numbers and underscore only"),
  name: z.string().min(1, "Name is required").max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  assignableAs: z.enum(ASSIGNABLE_AS).optional(),
  permissions: z.array(z.string()).default([]),
});

export const UpdateInternalRoleDefinitionSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  assignableAs: z.enum(ASSIGNABLE_AS).optional(),
  permissions: z.array(z.string()).default([]),
  active: z.boolean().optional(),
});

// Edit an internal staff member's name + HRM-seed details (Accounts Service).
// Empty string clears the optional fields; names are required.
export const UpdateInternalStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  phoneNumber: z.string().max(20).optional().or(z.literal("")),
  jobTitle: z.string().max(120).optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
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
  proofKey: z.string().min(1, "Payment proof is required"),
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
  /**
   * What `basePrice` is the price OF. The service prices a term as
   * `(basePrice ÷ intervalMonths) × termMonths`, so this decides whether the
   * figure above is a monthly or an annual charge — the same number bills 12×
   * differently either way.
   */
  billingInterval: z.enum(["MONTHLY", "YEARLY"], {
    errorMap: () => ({ message: "Pick a billing interval" }),
  }),
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

// ── Cross-tenant entity edits (Accounts Service, internal staff) ─────
//
// PATCH/PUT semantics: an empty string clears the field. Email/phone of the
// ACCOUNT owner are deliberately NOT here — those are identity fields changed
// via ChangeEmailSchema (while the email is unverified) / ChangePhoneSchema
// (while the phone is unverified).

const optionalShort = z.string().max(255).optional().or(z.literal(""));
const optionalLong = z.string().max(2000).optional().or(z.literal(""));

export const UpdateAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  region: optionalShort,
  district: optionalShort,
  ward: optionalShort,
  areaCode: z.string().max(10).optional().or(z.literal("")),
  municipal: optionalShort,
  bio: optionalLong,
});

export const ChangeEmailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const ChangePhoneSchema = z.object({
  phoneNumber: z.string().min(5, "Enter a valid phone number").max(20),
});

export const UpdateBusinessSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: optionalLong,
  phoneNumber: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  website: optionalShort,
  region: optionalShort,
  district: optionalShort,
  ward: optionalShort,
  address: z.string().max(500).optional().or(z.literal("")),
  postalCode: z.string().max(10).optional().or(z.literal("")),
});

export const UpdateLocationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: optionalLong,
  phoneNumber: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  region: optionalShort,
  district: optionalShort,
  ward: optionalShort,
  address: z.string().max(500).optional().or(z.literal("")),
  postalCode: z.string().max(10).optional().or(z.literal("")),
  timezone: z.string().max(64).optional().or(z.literal("")),
});

export const UpdateStoreSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: optionalLong,
  code: z.string().max(50).optional().or(z.literal("")),
});

export const UpdateWarehouseSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: optionalLong,
  code: z.string().max(50).optional().or(z.literal("")),
  capacity: z.coerce
    .number()
    .int("Must be a whole number")
    .nonnegative("Cannot be negative")
    .optional(),
  primary: z.boolean().optional(),
});

export const UpdateCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().max(255).optional().or(z.literal("")),
  phoneNumber: z.string().min(5, "Enter a valid phone number").max(20),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  notes: optionalLong,
});
