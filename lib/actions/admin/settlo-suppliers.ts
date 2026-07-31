"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import {
  BANK_PROVIDERS,
  MOBILE_PROVIDERS,
  SUPPLIER_STATUS_LABELS,
  supplierFormSchema,
  type AdminSettloSupplier,
  type SettloSupplierVerificationStatus,
  type SupplierFinancingProfile,
  type SupplierFormInput,
  type SupplierPaymentAccount,
} from "@/types/admin/settlo-suppliers";

/**
 * Admin (internal-ops) Settlo Supplier directory — calls the Inventory
 * Service's `settlo-suppliers` admin API with the internal staff token.
 * Authorization is the Inventory Service's server-side check on
 * `internal:accounts:read` / `internal:accounts:manage`, satisfied by the
 * caller's `internalPermissions` claim — see lib/admin/permissions.ts.
 */
function suppliersClient() {
  return new ApiClient("inventory", "staff");
}

const SUPPLIERS_PATH = "/api/v1/settlo-suppliers";

const strOrUndefined = (s: string | undefined): string | undefined => {
  const t = s?.trim();
  return t && t.length ? t : undefined;
};

/** Fields shared by the create + update payloads. */
function sharedSupplierFields(v: SupplierFormInput) {
  return {
    name: v.name,
    contactPerson: strOrUndefined(v.contactPerson),
    phone: strOrUndefined(v.phone),
    email: strOrUndefined(v.email),
    address: strOrUndefined(v.address),
    city: strOrUndefined(v.city),
    country: strOrUndefined(v.country),
    registrationNumber: strOrUndefined(v.registrationNumber),
    tinNumber: strOrUndefined(v.tinNumber),
  };
}

/** Directory listing, optionally filtered by verification status. Requires `internal:accounts:read`. */
export async function listSettloSuppliers(
  status?: SettloSupplierVerificationStatus,
): Promise<AdminSettloSupplier[]> {
  const params = new URLSearchParams();
  if (status) params.set("verificationStatus", status);
  const qs = params.toString();
  const data = await suppliersClient().get<AdminSettloSupplier[]>(
    qs ? `${SUPPLIERS_PATH}?${qs}` : SUPPLIERS_PATH,
  );
  return parseStringify(data);
}

/** A single supplier, or `null` if it doesn't exist. Requires `internal:accounts:read`. */
export async function getSettloSupplier(
  id: string,
): Promise<AdminSettloSupplier | null> {
  try {
    const data = await suppliersClient().get<AdminSettloSupplier>(
      `${SUPPLIERS_PATH}/${id}`,
    );
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/** Create a supplier. Requires `internal:accounts:manage`. */
export async function createSettloSupplier(
  input: SupplierFormInput,
): Promise<FormResponse<AdminSettloSupplier>> {
  const parsed = supplierFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid supplier details.",
    };
  }
  const body = sharedSupplierFields(parsed.data);
  try {
    const result = await suppliersClient().post<
      AdminSettloSupplier,
      typeof body
    >(SUPPLIERS_PATH, body);
    revalidatePath("/admin/settlo-suppliers");
    return parseStringify({
      responseType: "success",
      message: "Supplier created",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Update a supplier's details. Requires `internal:accounts:manage`. */
export async function updateSettloSupplier(
  id: string,
  input: SupplierFormInput,
): Promise<FormResponse<AdminSettloSupplier>> {
  const parsed = supplierFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid supplier details.",
    };
  }
  const body = sharedSupplierFields(parsed.data);
  try {
    const result = await suppliersClient().put<
      AdminSettloSupplier,
      typeof body
    >(`${SUPPLIERS_PATH}/${id}`, body);
    revalidatePath("/admin/settlo-suppliers");
    return parseStringify({
      responseType: "success",
      message: "Supplier updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Approve/decline/suspend a supplier. Requires `internal:accounts:manage`. */
export async function setSupplierVerificationStatus(
  id: string,
  status: SettloSupplierVerificationStatus,
): Promise<FormResponse<AdminSettloSupplier>> {
  try {
    const result = await suppliersClient().put<
      AdminSettloSupplier,
      { status: SettloSupplierVerificationStatus }
    >(`${SUPPLIERS_PATH}/${id}/verification-status`, { status });
    revalidatePath("/admin/settlo-suppliers");
    return parseStringify({
      responseType: "success",
      message: `Supplier marked as "${SUPPLIER_STATUS_LABELS[status]}"`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update verification status",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Payment accounts + financing profile ────────────────────────────
// The Inventory Service's payment-account endpoints are account-scoped
// (`/payment-accounts/{accountId}`, no supplier id in the path) except for
// create, which is nested under the supplier. Every mutation response
// carries `settloSupplierId`, so detail-page revalidation piggy-backs on
// that instead of requiring callers to pass the supplier id around.

const PAYMENT_ACCOUNTS_PATH = `${SUPPLIERS_PATH}/payment-accounts`;

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
 * (same create/update reuse as `supplierFormSchema` in Task 1).
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

/** Fields shared by the add + update payment-account payloads. */
function paymentAccountFields(v: PaymentAccountInput) {
  const isCashOrCheque = v.paymentMethod === "CASH" || v.paymentMethod === "CHEQUE";
  return {
    paymentMethod: v.paymentMethod,
    provider: isCashOrCheque ? undefined : v.provider,
    accountName: strOrUndefined(v.accountName),
    accountNumber: strOrUndefined(v.accountNumber),
    bankName: strOrUndefined(v.bankName),
    mobileProvider: strOrUndefined(v.mobileProvider),
    mobileNumber: strOrUndefined(v.mobileNumber),
  };
}

function revalidateSupplierDetail(supplierId: string): void {
  revalidatePath("/admin/settlo-suppliers");
  revalidatePath(`/admin/settlo-suppliers/${supplierId}`);
}

/** Add a payment account to a supplier. Requires `internal:accounts:manage`. */
export async function addSupplierPaymentAccount(
  supplierId: string,
  input: PaymentAccountInput,
): Promise<FormResponse<SupplierPaymentAccount>> {
  const parsed = paymentAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid payment account details.",
    };
  }
  const body = paymentAccountFields(parsed.data);
  try {
    const result = await suppliersClient().post<SupplierPaymentAccount, typeof body>(
      `${SUPPLIERS_PATH}/${supplierId}/payment-accounts`,
      body,
    );
    revalidateSupplierDetail(supplierId);
    return parseStringify({
      responseType: "success",
      message: "Payment account added",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to add payment account",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Update a payment account's details. Requires `internal:accounts:manage`.
 *
 * IMPORTANT backend behavior: changing `provider`, `accountNumber`, or
 * `mobileNumber` un-verifies the account (`verified` → false, `verifiedAt` →
 * null) and clears its default flag — the payee identity changed, so it must
 * be re-verified and re-promoted to default before it can receive
 * disbursements again. Changing `paymentMethod` while the account is the
 * supplier's current default is rejected with a 409 (the backend message is
 * surfaced verbatim in the returned `FormResponse.message`) — set another
 * account as default first.
 */
export async function updateSupplierPaymentAccount(
  accountId: string,
  input: PaymentAccountInput,
): Promise<FormResponse<SupplierPaymentAccount>> {
  const parsed = paymentAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid payment account details.",
    };
  }
  const body = paymentAccountFields(parsed.data);
  try {
    const result = await suppliersClient().put<SupplierPaymentAccount, typeof body>(
      `${PAYMENT_ACCOUNTS_PATH}/${accountId}`,
      body,
    );
    revalidateSupplierDetail(result.settloSupplierId);
    return parseStringify({
      responseType: "success",
      message: "Payment account updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update payment account",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Delete a payment account. Requires `internal:accounts:manage`.
 *
 * The backend returns a 409 (surfaced verbatim in `FormResponse.message`)
 * when the account is the supplier's current default — set another account
 * as default before deleting this one.
 */
export async function deleteSupplierPaymentAccount(
  accountId: string,
): Promise<FormResponse<void>> {
  try {
    await suppliersClient().delete<void>(`${PAYMENT_ACCOUNTS_PATH}/${accountId}`);
    // The delete response carries no body, so unlike the other mutations
    // below we can't target the supplier's detail page directly — fall back
    // to the list path (matches Task 1's write actions).
    revalidatePath("/admin/settlo-suppliers");
    return parseStringify({
      responseType: "success",
      message: "Payment account deleted",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to delete payment account",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Mark a payment account as verified. Requires `internal:accounts:manage`. */
export async function verifySupplierPaymentAccount(
  accountId: string,
): Promise<FormResponse<SupplierPaymentAccount>> {
  try {
    const result = await suppliersClient().post<SupplierPaymentAccount, undefined>(
      `${PAYMENT_ACCOUNTS_PATH}/${accountId}/verify`,
      undefined,
    );
    revalidateSupplierDetail(result.settloSupplierId);
    return parseStringify({
      responseType: "success",
      message: "Payment account verified",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to verify payment account",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Set a payment account as the supplier's default disbursement account.
 * Requires `internal:accounts:manage`.
 *
 * The backend returns a 400 (surfaced verbatim in `FormResponse.message`)
 * unless the account is already verified AND disbursement-ready.
 */
export async function setDefaultSupplierPaymentAccount(
  accountId: string,
): Promise<FormResponse<SupplierPaymentAccount>> {
  try {
    const result = await suppliersClient().post<SupplierPaymentAccount, undefined>(
      `${PAYMENT_ACCOUNTS_PATH}/${accountId}/default`,
      undefined,
    );
    revalidateSupplierDetail(result.settloSupplierId);
    return parseStringify({
      responseType: "success",
      message: "Default payment account updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to set default payment account",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

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

/** Update a supplier's financing caps / opt-in. Requires `internal:accounts:manage`. */
export async function updateSupplierFinancingProfile(
  supplierId: string,
  input: FinancingProfileInput,
): Promise<FormResponse<SupplierFinancingProfile>> {
  const parsed = financingProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid financing profile.",
    };
  }
  const body = parsed.data;
  try {
    const result = await suppliersClient().put<SupplierFinancingProfile, typeof body>(
      `${SUPPLIERS_PATH}/${supplierId}/financing-profile`,
      body,
    );
    revalidateSupplierDetail(supplierId);
    return parseStringify({
      responseType: "success",
      message: "Financing profile updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update financing profile",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
