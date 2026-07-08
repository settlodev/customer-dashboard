"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { getAdminBusinessDetail } from "@/lib/actions/admin/businesses";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import {
  FundingSourceFormSchema,
  LoanProductFormSchema,
  type AllocationPriority,
  type ApplicationStatus,
  type ConfirmDisbursementRequest,
  type CreateFundingSourceRequest,
  type CreateLoanProductRequest,
  type DisbursementResponse,
  type FundingSourceFormOutput,
  type FundingSourceFormValues,
  type FundingSourceResponse,
  type InitiateDisbursementRequest,
  type LoanActionResponse,
  type LoanApplicationResponse,
  type LoanDecisionRequest,
  type LoanProductFormOutput,
  type LoanProductFormValues,
  type LoanProductResponse,
  type LoanResponse,
  type LoanStatus,
  type PayoutAccountResponse,
  type RestructureRequest,
  type RestructureResponse,
  type UpdateFundingSourceRequest,
  type UpdateLoanProductRequest,
  type WaiverRequest,
  type WriteOffRequest,
} from "@/types/admin/loans";

/**
 * Admin (lender-side) Loan Management actions — call the Loan Management Service
 * with the internal staff token. Authorization is the LMS `@PreAuthorize`
 * (`PERM_loans:*`), satisfied by the caller's `internal_permissions` claim.
 * Requires `LOAN_MANAGEMENT_SERVICE_URL` (see settlo-api-client).
 */
function loansClient() {
  return new ApiClient("loans", "staff");
}

const PRODUCTS_PATH = "/api/v1/loan-products";
const APPLICATIONS_PATH = "/api/v1/loan-applications";
const BUSINESS_DIRECTORY_CAP = 40;

export interface BusinessRef {
  name: string;
  owner: string | null;
}

/**
 * Best-effort resolution of LMS `businessId`s to display names (+ owner), by
 * joining the Accounts admin API. Dedups and caps the number of lookups. Fails
 * soft per-id — a loan officer without Accounts access simply gets no names, so
 * callers fall back to the raw id. Returns a plain map keyed by businessId.
 */
export async function resolveBusinessDirectory(
  ids: string[],
): Promise<Record<string, BusinessRef>> {
  const distinct = Array.from(new Set(ids.filter(Boolean))).slice(
    0,
    BUSINESS_DIRECTORY_CAP,
  );
  const entries = await Promise.all(
    distinct.map(async (id) => {
      try {
        const b = await getAdminBusinessDetail(id);
        return [
          id,
          { name: b.name, owner: b.accountFullName ?? b.accountEmail ?? null },
        ] as const;
      } catch {
        return null;
      }
    }),
  );
  const dir: Record<string, BusinessRef> = {};
  for (const e of entries) if (e) dir[e[0]] = e[1];
  return dir;
}
const LOANS_PATH = "/api/v1/loans";
const DISBURSEMENTS_PATH = "/api/v1/disbursements";
const FUNDING_SOURCES_PATH = "/api/v1/funding-sources";
const PAYOUT_ACCOUNTS_PATH = "/api/v1/payout-accounts";

interface ListOpts {
  page?: number;
  size?: number;
}

/** Paged loan products (LMS returns a Spring `Page`). Requires `loans:read`. */
export async function listLoanProducts(
  opts: ListOpts = {},
): Promise<ApiResponse<LoanProductResponse>> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 0));
  params.set("size", String(opts.size ?? 50));
  params.set("sort", "createdAt,desc");
  const data = await loansClient().get<ApiResponse<LoanProductResponse>>(
    `${PRODUCTS_PATH}?${params.toString()}`,
  );
  return parseStringify(data);
}

/** A single loan product. Requires `loans:read`. */
export async function getLoanProduct(
  id: string,
): Promise<LoanProductResponse> {
  const data = await loansClient().get<LoanProductResponse>(
    `${PRODUCTS_PATH}/${id}`,
  );
  return parseStringify(data);
}

// ── Mutations (require `loans:product_manage`) ─────────────────────────

const strOrUndefined = (s: string): string | undefined => {
  const t = s.trim();
  return t.length ? t : undefined;
};

/** Fields shared by the create + update payloads (everything but identity). */
function sharedProductFields(v: LoanProductFormOutput) {
  return {
    name: v.name,
    description: strOrUndefined(v.description),
    pricingType: v.pricingType,
    interestMethod: v.interestMethod,
    repaymentFrequency: v.repaymentFrequency,
    flatFeeRate: v.flatFeeRate,
    factorRate: v.factorRate,
    annualInterestRate: v.annualInterestRate,
    originationFeeRate: v.originationFeeRate,
    minPrincipal: v.minPrincipal,
    maxPrincipal: v.maxPrincipal,
    minTermDays: v.minTermDays,
    maxTermDays: v.maxTermDays,
    maxConcurrentLoansPerBorrower: v.maxConcurrentLoansPerBorrower,
    holdbackPercent: v.holdbackPercent,
    processingFee: v.processingFee,
    minInterestRate: v.minInterestRate,
    allocationOrder: strOrUndefined(v.allocationOrder),
    gracePeriodDays: v.gracePeriodDays,
    penaltyRatePerDay: v.penaltyRatePerDay,
    lateFeeFlat: v.lateFeeFlat,
    defaultThresholdDays: v.defaultThresholdDays,
    termsTemplate: strOrUndefined(v.termsTemplate),
  };
}

function invalidPayload(
  message: string,
): FormResponse<LoanProductResponse> {
  return { responseType: "error", message };
}

/** Create a loan product. Requires `loans:product_manage`. */
export async function createLoanProduct(
  values: LoanProductFormValues,
): Promise<FormResponse<LoanProductResponse>> {
  const parsed = LoanProductFormSchema.safeParse(values);
  if (!parsed.success) {
    return invalidPayload(
      parsed.error.errors[0]?.message ?? "Invalid loan product.",
    );
  }
  const v = parsed.data;
  const body: CreateLoanProductRequest = {
    code: v.code,
    ...sharedProductFields(v),
    productType: v.productType,
    payeeType: v.payeeType,
    repaymentType: v.repaymentType,
    currency: v.currency.toUpperCase(),
  };
  try {
    const result = await loansClient().post<
      LoanProductResponse,
      CreateLoanProductRequest
    >(PRODUCTS_PATH, body);
    revalidatePath("/admin/loans/products");
    return parseStringify({
      responseType: "success",
      message: "Loan product created",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create loan product",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Update a loan product. Identity fields are immutable. Requires `loans:product_manage`. */
export async function updateLoanProduct(
  id: string,
  values: LoanProductFormValues,
): Promise<FormResponse<LoanProductResponse>> {
  const parsed = LoanProductFormSchema.safeParse(values);
  if (!parsed.success) {
    return invalidPayload(
      parsed.error.errors[0]?.message ?? "Invalid loan product.",
    );
  }
  const v = parsed.data;
  const body: UpdateLoanProductRequest = {
    ...sharedProductFields(v),
    active: v.active,
  };
  try {
    const result = await loansClient().put<
      LoanProductResponse,
      UpdateLoanProductRequest
    >(`${PRODUCTS_PATH}/${id}`, body);
    revalidatePath("/admin/loans/products");
    revalidatePath(`/admin/loans/products/${id}`);
    return parseStringify({
      responseType: "success",
      message: "Loan product updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update loan product",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Deactivate (soft-delete) a loan product. Requires `loans:product_manage`. */
export async function deactivateLoanProduct(
  id: string,
): Promise<FormResponse<null>> {
  try {
    await loansClient().delete<void>(`${PRODUCTS_PATH}/${id}`);
    revalidatePath("/admin/loans/products");
    revalidatePath(`/admin/loans/products/${id}`);
    return parseStringify({
      responseType: "success",
      message: "Loan product deactivated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate loan product",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Loan applications ─────────────────────────────────────────────────

interface ListApplicationsOpts {
  status?: ApplicationStatus;
  page?: number;
  size?: number;
}

/** Admin review queue (paged, optional status filter). Requires `loans:applications:read`. */
export async function listLoanApplications(
  opts: ListApplicationsOpts = {},
): Promise<ApiResponse<LoanApplicationResponse>> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 0));
  params.set("size", String(opts.size ?? 50));
  params.set("sort", "createdAt,desc");
  if (opts.status) params.set("status", opts.status);
  const data = await loansClient().get<ApiResponse<LoanApplicationResponse>>(
    `${APPLICATIONS_PATH}?${params.toString()}`,
  );
  return parseStringify(data);
}

/** A single application. Requires `loans:read` or `loans:applications:read`. */
export async function getLoanApplication(
  id: string,
): Promise<LoanApplicationResponse> {
  const data = await loansClient().get<LoanApplicationResponse>(
    `${APPLICATIONS_PATH}/${id}`,
  );
  return parseStringify(data);
}

export interface DecideApplicationInput {
  approve: boolean;
  approvedAmount?: number;
  approvedTermDays?: number;
  notes?: string;
  rejectionReason?: string;
}

/**
 * Approve or decline an application. Requires `loans:approve`. The deciding
 * staff id is resolved from the session token (never trusted from the client).
 */
export async function decideLoanApplication(
  id: string,
  input: DecideApplicationInput,
): Promise<FormResponse<LoanApplicationResponse>> {
  const token = await getStaffAuthToken();
  if (!token?.userId) {
    return {
      responseType: "error",
      message: "Your staff session has expired — sign in again.",
    };
  }
  if (input.approve) {
    const amt = input.approvedAmount;
    const term = input.approvedTermDays;
    if (!amt || amt <= 0 || !term || term <= 0) {
      return {
        responseType: "error",
        message: "Approved amount and term are required to approve.",
      };
    }
  }
  const body: LoanDecisionRequest = {
    approve: input.approve,
    decisionedById: token.userId,
    approvedAmount: input.approve ? input.approvedAmount : undefined,
    approvedTermDays: input.approve ? input.approvedTermDays : undefined,
    notes: input.notes?.trim() || undefined,
    rejectionReason: input.approve
      ? undefined
      : input.rejectionReason?.trim() || undefined,
  };
  try {
    const result = await loansClient().post<
      LoanApplicationResponse,
      LoanDecisionRequest
    >(`${APPLICATIONS_PATH}/${id}/decision`, body);
    revalidatePath("/admin/loans/applications");
    revalidatePath(`/admin/loans/applications/${id}`);
    return parseStringify({
      responseType: "success",
      message: input.approve ? "Application approved" : "Application declined",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to record decision",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Loans (book) ──────────────────────────────────────────────────────

interface ListLoansOpts {
  status?: LoanStatus;
  page?: number;
  size?: number;
}

/** Admin loan book (paged, optional status filter). Requires `loans:applications:read`. */
export async function listLoans(
  opts: ListLoansOpts = {},
): Promise<ApiResponse<LoanResponse>> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 0));
  params.set("size", String(opts.size ?? 50));
  params.set("sort", "createdAt,desc");
  if (opts.status) params.set("status", opts.status);
  const data = await loansClient().get<ApiResponse<LoanResponse>>(
    `${LOANS_PATH}?${params.toString()}`,
  );
  return parseStringify(data);
}

/** A single loan. Requires `loans:read`. */
export async function getLoan(id: string): Promise<LoanResponse> {
  const data = await loansClient().get<LoanResponse>(`${LOANS_PATH}/${id}`);
  return parseStringify(data);
}

// ── Disbursement ──────────────────────────────────────────────────────

/** Active + historical funding sources. Requires `loans:funding_manage`. */
export async function listFundingSources(
  opts: { page?: number; size?: number } = {},
): Promise<ApiResponse<FundingSourceResponse>> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 0));
  params.set("size", String(opts.size ?? 100));
  const data = await loansClient().get<ApiResponse<FundingSourceResponse>>(
    `${FUNDING_SOURCES_PATH}?${params.toString()}`,
  );
  return parseStringify(data);
}

/** A business's payout accounts. Requires `loans:disburse` (or `loans:apply`). */
export async function listPayoutAccounts(
  businessId: string,
): Promise<ApiResponse<PayoutAccountResponse>> {
  const params = new URLSearchParams();
  params.set("businessId", businessId);
  params.set("size", "50");
  const data = await loansClient().get<ApiResponse<PayoutAccountResponse>>(
    `${PAYOUT_ACCOUNTS_PATH}?${params.toString()}`,
  );
  return parseStringify(data);
}

/** Disbursements for a loan (newest first). Requires `loans:disburse`. */
export async function listLoanDisbursements(
  loanId: string,
): Promise<DisbursementResponse[]> {
  const data = await loansClient().get<DisbursementResponse[]>(
    `${DISBURSEMENTS_PATH}/loans/${loanId}`,
  );
  return parseStringify(data);
}

/** Initiate a disbursement on a PENDING_DISBURSEMENT loan. Requires `loans:disburse`. */
export async function initiateDisbursement(
  loanId: string,
  input: InitiateDisbursementRequest,
): Promise<FormResponse<DisbursementResponse>> {
  if (!input.fundingSourceId || !input.payoutAccountId) {
    return {
      responseType: "error",
      message: "Select a funding source and a payout account.",
    };
  }
  try {
    const result = await loansClient().post<
      DisbursementResponse,
      InitiateDisbursementRequest
    >(`${DISBURSEMENTS_PATH}/loans/${loanId}`, input);
    revalidatePath("/admin/loans/portfolio");
    revalidatePath(`/admin/loans/portfolio/${loanId}`);
    return parseStringify({
      responseType: "success",
      message: "Disbursement initiated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to initiate disbursement",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Confirm a manual (INITIATED) disbursement with the treasury reference. The
 * confirming staff id is resolved from the session token. Requires `loans:disburse`.
 */
export async function confirmDisbursement(
  disbursementId: string,
  input: { externalRef: string; loanId?: string },
): Promise<FormResponse<DisbursementResponse>> {
  const ref = input.externalRef?.trim();
  if (!ref) {
    return {
      responseType: "error",
      message: "Enter the payment reference to confirm.",
    };
  }
  const token = await getStaffAuthToken();
  if (!token?.userId) {
    return {
      responseType: "error",
      message: "Your staff session has expired — sign in again.",
    };
  }
  const body: ConfirmDisbursementRequest = {
    externalRef: ref,
    confirmedById: token.userId,
  };
  try {
    const result = await loansClient().post<
      DisbursementResponse,
      ConfirmDisbursementRequest
    >(`${DISBURSEMENTS_PATH}/${disbursementId}/confirm`, body);
    revalidatePath("/admin/loans/portfolio");
    if (input.loanId) {
      revalidatePath(`/admin/loans/portfolio/${input.loanId}`);
    }
    return parseStringify({
      responseType: "success",
      message: "Disbursement confirmed",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to confirm disbursement",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Funding sources (CRUD; require `loans:funding_manage`) ────────────

/** A single funding source. Requires `loans:funding_manage`. */
export async function getFundingSource(
  id: string,
): Promise<FundingSourceResponse> {
  const data = await loansClient().get<FundingSourceResponse>(
    `${FUNDING_SOURCES_PATH}/${id}`,
  );
  return parseStringify(data);
}

function sharedFundingFields(v: FundingSourceFormOutput) {
  return {
    name: v.name,
    capitalLimit: v.capitalLimit,
    glAccountRef: strOrUndefined(v.glAccountRef),
    disbursementMethod: v.disbursementMethod,
    bankGatewayKey: strOrUndefined(v.bankGatewayKey),
  };
}

/** Create a funding source. Requires `loans:funding_manage`. */
export async function createFundingSource(
  values: FundingSourceFormValues,
): Promise<FormResponse<FundingSourceResponse>> {
  const parsed = FundingSourceFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid funding source.",
    };
  }
  const v = parsed.data;
  const body: CreateFundingSourceRequest = {
    ...sharedFundingFields(v),
    type: v.type,
    currency: v.currency.toUpperCase(),
  };
  try {
    const result = await loansClient().post<
      FundingSourceResponse,
      CreateFundingSourceRequest
    >(FUNDING_SOURCES_PATH, body);
    revalidatePath("/admin/loans/funding-sources");
    return parseStringify({
      responseType: "success",
      message: "Funding source created",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create funding source",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Update a funding source. `type` + `currency` are immutable. Requires `loans:funding_manage`. */
export async function updateFundingSource(
  id: string,
  values: FundingSourceFormValues,
): Promise<FormResponse<FundingSourceResponse>> {
  const parsed = FundingSourceFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid funding source.",
    };
  }
  const v = parsed.data;
  const body: UpdateFundingSourceRequest = {
    ...sharedFundingFields(v),
    active: v.active,
  };
  try {
    const result = await loansClient().put<
      FundingSourceResponse,
      UpdateFundingSourceRequest
    >(`${FUNDING_SOURCES_PATH}/${id}`, body);
    revalidatePath("/admin/loans/funding-sources");
    revalidatePath(`/admin/loans/funding-sources/${id}`);
    return parseStringify({
      responseType: "success",
      message: "Funding source updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update funding source",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Deactivate a funding source. Requires `loans:funding_manage`. */
export async function deactivateFundingSource(
  id: string,
): Promise<FormResponse<null>> {
  try {
    await loansClient().delete<void>(`${FUNDING_SOURCES_PATH}/${id}`);
    revalidatePath("/admin/loans/funding-sources");
    revalidatePath(`/admin/loans/funding-sources/${id}`);
    return parseStringify({
      responseType: "success",
      message: "Funding source deactivated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate funding source",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Loan lifecycle (require `loans:write_off`) ────────────────────────
// Valid only on live loans (ACTIVE / IN_ARREARS / DEFAULTED) — the LMS
// enforces the state guard; the FE gates the panel with `isLiveLoan`.

function revalidateLoan(id: string): void {
  revalidatePath("/admin/loans/portfolio");
  revalidatePath(`/admin/loans/portfolio/${id}`);
}

/** Write off a loan's outstanding balance (irreversible). Requires `loans:write_off`. */
export async function writeOffLoan(
  id: string,
  input: { reference: string; reason?: string },
): Promise<FormResponse<LoanActionResponse>> {
  const reference = input.reference?.trim();
  if (!reference) {
    return { responseType: "error", message: "A reference is required." };
  }
  const body: WriteOffRequest = {
    reference,
    reason: input.reason?.trim() || undefined,
  };
  try {
    const result = await loansClient().post<LoanActionResponse, WriteOffRequest>(
      `${LOANS_PATH}/${id}/write-off`,
      body,
    );
    revalidateLoan(id);
    return parseStringify({
      responseType: "success",
      message: "Loan written off",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to write off loan",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Waive part of a loan's outstanding component. Requires `loans:write_off`. */
export async function waiveLoan(
  id: string,
  input: {
    component: AllocationPriority;
    amount: number;
    reference: string;
    reason?: string;
  },
): Promise<FormResponse<LoanActionResponse>> {
  const reference = input.reference?.trim();
  if (!reference) {
    return { responseType: "error", message: "A reference is required." };
  }
  if (!input.amount || input.amount <= 0) {
    return { responseType: "error", message: "Waiver amount must be greater than 0." };
  }
  const body: WaiverRequest = {
    component: input.component,
    amount: input.amount,
    reference,
    reason: input.reason?.trim() || undefined,
  };
  try {
    const result = await loansClient().post<LoanActionResponse, WaiverRequest>(
      `${LOANS_PATH}/${id}/waivers`,
      body,
    );
    revalidateLoan(id);
    return parseStringify({
      responseType: "success",
      message: "Amount waived",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to waive amount",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Restructure a loan's term/installments. Requires `loans:write_off`. */
export async function restructureLoan(
  id: string,
  input: {
    newTermDays: number;
    newInstallmentCount: number;
    reference: string;
    reason?: string;
  },
): Promise<FormResponse<RestructureResponse>> {
  const reference = input.reference?.trim();
  if (!reference) {
    return { responseType: "error", message: "A reference is required." };
  }
  if (
    !input.newTermDays ||
    input.newTermDays <= 0 ||
    !input.newInstallmentCount ||
    input.newInstallmentCount <= 0
  ) {
    return {
      responseType: "error",
      message: "New term and installment count must be greater than 0.",
    };
  }
  const body: RestructureRequest = {
    newTermDays: input.newTermDays,
    newInstallmentCount: input.newInstallmentCount,
    reference,
    reason: input.reason?.trim() || undefined,
  };
  try {
    const result = await loansClient().post<
      RestructureResponse,
      RestructureRequest
    >(`${LOANS_PATH}/${id}/restructure`, body);
    revalidateLoan(id);
    return parseStringify({
      responseType: "success",
      message: "Loan restructured",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to restructure loan",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Quick active toggle (list rows) ───────────────────────────────────
// Symmetric activate/deactivate: fetch the current entity, round-trip its
// values through the update DTO with the new `active` flag. The stored
// values were valid at create/update time, so the PUT re-validates cleanly.

function productToUpdateBody(
  p: LoanProductResponse,
): Omit<UpdateLoanProductRequest, "active"> {
  return {
    name: p.name,
    description: p.description ?? undefined,
    pricingType: p.pricingType,
    interestMethod: p.interestMethod,
    repaymentFrequency: p.repaymentFrequency,
    flatFeeRate: p.flatFeeRate ?? undefined,
    factorRate: p.factorRate ?? undefined,
    annualInterestRate: p.annualInterestRate ?? undefined,
    originationFeeRate: p.originationFeeRate ?? undefined,
    minPrincipal: p.minPrincipal,
    maxPrincipal: p.maxPrincipal,
    minTermDays: p.minTermDays,
    maxTermDays: p.maxTermDays,
    maxConcurrentLoansPerBorrower: p.maxConcurrentLoansPerBorrower,
    holdbackPercent: p.holdbackPercent ?? undefined,
    processingFee: p.processingFee ?? undefined,
    minInterestRate: p.minInterestRate ?? undefined,
    allocationOrder: p.allocationOrder ?? undefined,
    gracePeriodDays: p.gracePeriodDays ?? undefined,
    penaltyRatePerDay: p.penaltyRatePerDay ?? undefined,
    lateFeeFlat: p.lateFeeFlat ?? undefined,
    defaultThresholdDays: p.defaultThresholdDays ?? undefined,
    termsTemplate: p.termsTemplate ?? undefined,
  };
}

/** Toggle a loan product's availability. Requires `loans:product_manage`. */
export async function setLoanProductActive(
  id: string,
  active: boolean,
): Promise<FormResponse<LoanProductResponse>> {
  try {
    const current = await getLoanProduct(id);
    const body: UpdateLoanProductRequest = {
      ...productToUpdateBody(current),
      active,
    };
    const result = await loansClient().put<
      LoanProductResponse,
      UpdateLoanProductRequest
    >(`${PRODUCTS_PATH}/${id}`, body);
    revalidatePath("/admin/loans/products");
    revalidatePath(`/admin/loans/products/${id}`);
    return parseStringify({
      responseType: "success",
      message: active ? "Product reactivated" : "Product deactivated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update product",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

function fundingToUpdateBody(
  s: FundingSourceResponse,
): Omit<UpdateFundingSourceRequest, "active"> {
  return {
    name: s.name,
    capitalLimit: s.capitalLimit ?? undefined,
    glAccountRef: s.glAccountRef ?? undefined,
    disbursementMethod: s.disbursementMethod,
    bankGatewayKey: s.bankGatewayKey ?? undefined,
  };
}

/** Toggle a funding source's availability. Requires `loans:funding_manage`. */
export async function setFundingSourceActive(
  id: string,
  active: boolean,
): Promise<FormResponse<FundingSourceResponse>> {
  try {
    const current = await getFundingSource(id);
    const body: UpdateFundingSourceRequest = {
      ...fundingToUpdateBody(current),
      active,
    };
    const result = await loansClient().put<
      FundingSourceResponse,
      UpdateFundingSourceRequest
    >(`${FUNDING_SOURCES_PATH}/${id}`, body);
    revalidatePath("/admin/loans/funding-sources");
    revalidatePath(`/admin/loans/funding-sources/${id}`);
    return parseStringify({
      responseType: "success",
      message: active ? "Source reactivated" : "Source deactivated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update funding source",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
