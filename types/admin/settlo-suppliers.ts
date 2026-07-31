import { z } from "zod";

/**
 * Admin (internal-ops) Settlo Supplier directory types — mirror the Inventory
 * Service `settlo-suppliers` admin API 1:1 (do not rename fields; the shapes
 * below are the live response contract, not a UI convenience wrapper).
 * `*At` timestamps are `OffsetDateTime` ISO strings.
 *
 * Powers the internal admin.localhost supplier directory (gated on the
 * internal `internal:accounts:read` / `internal:accounts:manage`
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
