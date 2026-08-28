import { z } from "zod";

/**
 * Admin (internal-ops) Settlo Supplier directory types — mirror the Inventory
 * Service `settlo-suppliers` admin API 1:1 (do not rename fields; the shapes
 * below are the live response contract, not a UI convenience wrapper).
 * `*At` timestamps are `OffsetDateTime` ISO strings.
 *
 * Powers the internal admin.localhost supplier directory (gated on the
 * internal `internal:accounts:read:all` / `internal:accounts:manage`
 * permissions — see lib/admin/permissions.ts).
 */

export type SettloSupplierVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export const SUPPLIER_STATUS_LABELS: Record<
  SettloSupplierVerificationStatus,
  string
> = {
  PENDING: "Pending approval",
  VERIFIED: "Approved",
  REJECTED: "Declined",
  SUSPENDED: "Suspended",
};

// Tones follow the semantic badge tokens used in components/admin/shared/onboarding-badge.tsx
export const SUPPLIER_STATUS_TONES: Record<
  SettloSupplierVerificationStatus,
  string
> = {
  PENDING: "bg-warn-tint text-warn",
  VERIFIED: "bg-pos-tint text-pos",
  REJECTED: "bg-neg-tint text-neg",
  SUSPENDED: "bg-muted text-muted-foreground",
};

export const MOBILE_PROVIDERS = [
  "VODACOM",
  "TIGO",
  "AIRTEL",
  "HALOTEL",
  "TTCL",
  "AZAM",
  "YAS",
] as const;
export const BANK_PROVIDERS = ["CRDB", "NMB", "MWANGA_HAKIKA_BANK"] as const;
export type DisbursementProvider =
  | (typeof MOBILE_PROVIDERS)[number]
  | (typeof BANK_PROVIDERS)[number];

export interface AdminSettloSupplier {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  registrationNumber: string | null;
  tinNumber: string | null;
  verificationStatus: SettloSupplierVerificationStatus;
  financingEligible: boolean;
  marketplaceEnabled: boolean;
  paymentAccounts: SupplierPaymentAccount[];
  financingProfile: SupplierFinancingProfile | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPaymentAccount {
  id: string;
  settloSupplierId: string;
  paymentMethod: "BANK_TRANSFER" | "MOBILE_MONEY" | "CASH" | "CHEQUE";
  provider: DisbursementProvider | null;
  accountName: string | null;
  accountNumber: string | null;
  bankName: string | null;
  mobileProvider: string | null;
  mobileNumber: string | null;
  verified: boolean;
  // NOTE: the management API's default-account flag key is `defaultAccount`
  // (NOT `isDefault` — that key exists only on a different internal endpoint).
  defaultAccount: boolean;
  verifiedAt: string | null;
  disbursementReady: boolean;
}

export interface SupplierFinancingProfile {
  id: string;
  settloSupplierId: string;
  maxLoanPerOrder: number | null;
  maxOutstandingExposure: number | null;
  currentExposure: number;
  allowFinancing: boolean;
}

// ── Create/update form ──────────────────────────────────────────────
// Empty string is accepted (and treated as "not provided") on optional
// fields so a zodResolver-bound <input> can round-trip cleanly — same
// `.optional().or(z.literal(""))` idiom used across types/admin/schemas.ts.

const optionalText = (max: number) =>
  z.string().max(max, `Max ${max} characters`).optional().or(z.literal(""));

export const supplierFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Max 200 characters"),
  contactPerson: optionalText(255),
  phone: optionalText(20),
  email: z
    .string()
    .email("Enter a valid email")
    .max(255, "Max 255 characters")
    .optional()
    .or(z.literal("")),
  address: optionalText(500),
  city: optionalText(120),
  country: optionalText(120),
  registrationNumber: optionalText(100),
  tinNumber: optionalText(100),
});

export type SupplierFormInput = z.infer<typeof supplierFormSchema>;

// ── Payment account create/update form ──────────────────────────────
// Lives here (not in lib/actions/admin/settlo-suppliers.ts) because that
// file is a `"use server"` module — Next only allows async function exports
// from those, so a `export const` zod schema there breaks `next build`
// ("A 'use server' file can only export async functions"). Client
// components (Task 5's dialogs) import these directly from this types file.

/**
 * All disbursement-rail provider codes (mobile money + bank), used to
 * validate `paymentAccountSchema`'s `provider` field against the enum the
 * backend's `DisbursementProviders` type accepts.
 */
const ALL_PROVIDERS = [...MOBILE_PROVIDERS, ...BANK_PROVIDERS] as const;

const optionalPaymentText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Max ${max} characters`)
    .optional()
    .or(z.literal(""));

/**
 * Payment-account create/update form. Shared by `addSupplierPaymentAccount`
 * and `updateSupplierPaymentAccount` — the backend's update DTO technically
 * allows a partial patch, but the admin dialog always submits the full set
 * (same create/update reuse as `supplierFormSchema` above).
 *
 * `provider` is the strongly-typed disbursement rail the backend validates
 * against `paymentMethod` (`DisbursementProviders` enum — MOBILE_PROVIDERS
 * for MOBILE_MONEY, BANK_PROVIDERS for BANK_TRANSFER, must be unset for
 * CASH/CHEQUE). `mobileProvider` is a separate, unvalidated free-text field
 * the backend stores independently (e.g. a display label) — it is never
 * cross-checked against `provider`.
 */
export const paymentAccountSchema = z
  .object({
    paymentMethod: z.enum(["BANK_TRANSFER", "MOBILE_MONEY", "CASH", "CHEQUE"], {
      required_error: "Payment method is required",
    }),
    provider: z.enum(ALL_PROVIDERS).optional(),
    accountName: optionalPaymentText(255),
    accountNumber: optionalPaymentText(50),
    bankName: optionalPaymentText(120),
    mobileProvider: optionalPaymentText(50),
    mobileNumber: optionalPaymentText(20),
  })
  .superRefine((v, ctx) => {
    const accountName = v.accountName?.trim();
    if (v.paymentMethod === "MOBILE_MONEY") {
      if (!v.provider || !(MOBILE_PROVIDERS as readonly string[]).includes(v.provider)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["provider"],
          message: "Select a mobile money provider",
        });
      }
      if (!v.mobileNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mobileNumber"],
          message: "Mobile number is required for mobile money accounts",
        });
      }
      if (!accountName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accountName"],
          message: "Account name is required",
        });
      }
    } else if (v.paymentMethod === "BANK_TRANSFER") {
      if (!v.provider || !(BANK_PROVIDERS as readonly string[]).includes(v.provider)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["provider"],
          message: "Select a bank",
        });
      }
      if (!v.accountNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accountNumber"],
          message: "Account number is required for bank transfer accounts",
        });
      }
      if (!accountName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accountName"],
          message: "Account name is required",
        });
      }
    } else if (v.provider) {
      // CASH / CHEQUE — the backend rejects a provider on these methods.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provider"],
        message: "Provider must not be set for cash or cheque payment accounts",
      });
    }
  });

export type PaymentAccountInput = z.infer<typeof paymentAccountSchema>;

// ── Financing profile form ───────────────────────────────────────────

const toOptionalNonNegativeNumber = (val: unknown): number | undefined => {
  if (val === null || val === undefined || val === "") return undefined;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  return undefined;
};

/** Financing caps + opt-in form for `updateSupplierFinancingProfile`. */
export const financingProfileSchema = z.object({
  maxLoanPerOrder: z.preprocess(
    toOptionalNonNegativeNumber,
    z.number().nonnegative("Must be zero or greater").optional(),
  ),
  maxOutstandingExposure: z.preprocess(
    toOptionalNonNegativeNumber,
    z.number().nonnegative("Must be zero or greater").optional(),
  ),
  allowFinancing: z.boolean(),
});

export type FinancingProfileInput = z.infer<typeof financingProfileSchema>;
