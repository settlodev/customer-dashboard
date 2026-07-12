"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import type { FormResponse } from "@/types/types";
import type {
  Loan,
  LoanApplicationResult,
  LoanEligibility,
} from "@/types/loans/type";
import {
  LoanApplicationSchema,
  LoanPaymentSchema,
  type LoanApplicationDraft,
  type LoanPaymentFormValues,
} from "@/types/loans/schema";
import {
  getMockEligibility,
  getMockLoan,
  getMockLoans,
} from "@/lib/loans/mock-data";

import {
  ELIGIBILITY_BACKEND_READY,
  FINANCING_BACKEND_READY,
  LOAN_ENDPOINTS,
  loansUrl,
} from "./loans-client";

/*
 * NOTE: the LMS doesn't yet expose the borrower-facing endpoints these actions
 * expect (see `loans-client.ts`), so every read below falls back to
 * `lib/loans/mock-data.ts`. Each action already contains the live call guarded
 * by `FINANCING_BACKEND_READY` — to go live, wire those calls to the real LMS
 * endpoints and set `LOANS_BORROWER_BACKEND_READY=true`; the admin console URL
 * `LOAN_MANAGEMENT_SERVICE_URL` is already shared.
 */

const EMPTY_ELIGIBILITY: LoanEligibility = {
  currencyCode: "TZS",
  limit: 0,
  available: 0,
  onTimeRatePct: null,
  loansRepaid: 0,
  customerSince: null,
  hasActiveLoan: false,
  activeLoanId: null,
};

/**
 * `businessId` is optional so the other still-mock-only callers of this action — the
 * loans list/apply/detail pages and the main dashboard — keep compiling and stay on
 * mock data even if `ELIGIBILITY_BACKEND_READY` is flipped on. Only a caller that
 * passes a businessId (currently just /business-overview) can reach the real endpoint.
 */
export async function getLoanEligibility(
  businessId?: string,
): Promise<LoanEligibility> {
  try {
    if (ELIGIBILITY_BACKEND_READY && businessId) {
      const apiClient = new ApiClient();
      const data = await apiClient.get(
        `${loansUrl(LOAN_ENDPOINTS.eligibility)}?businessId=${encodeURIComponent(businessId)}`,
      );
      return parseStringify(data);
    }
    return parseStringify(getMockEligibility());
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getLoanEligibility failed", error);
    return EMPTY_ELIGIBILITY;
  }
}

export async function listLoans(): Promise<Loan[]> {
  try {
    if (FINANCING_BACKEND_READY) {
      const apiClient = new ApiClient();
      const data = await apiClient.get(loansUrl(LOAN_ENDPOINTS.list));
      // Backend returns a Spring page; the list view only needs the content.
      const page = parseStringify(data) as { content?: Loan[] } | Loan[];
      return Array.isArray(page) ? page : (page.content ?? []);
    }
    return parseStringify(getMockLoans());
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listLoans failed", error);
    return [];
  }
}

export async function getLoan(id: string): Promise<Loan | null> {
  try {
    if (FINANCING_BACKEND_READY) {
      const apiClient = new ApiClient();
      const data = await apiClient.get(loansUrl(LOAN_ENDPOINTS.detail(id)));
      return parseStringify(data);
    }
    return parseStringify(getMockLoan(id));
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getLoan failed", error);
    return null;
  }
}

export async function applyForLoan(
  values: LoanApplicationDraft,
): Promise<FormResponse<LoanApplicationResult>> {
  const parsed = LoanApplicationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }

  try {
    const v = parsed.data;
    let result: LoanApplicationResult;

    if (FINANCING_BACKEND_READY) {
      const apiClient = new ApiClient();
      const data = (await apiClient.post(loansUrl(LOAN_ENDPOINTS.apply), {
        productKey: v.productKey,
        amount: v.amount,
        termMonths: v.termMonths,
        purpose: v.purpose,
        disbursementChannel: v.disbursementChannel,
      })) as LoanApplicationResult;
      result = parseStringify(data);
    } else {
      // Stub: pretend the application was accepted into review.
      result = {
        reference: `LN-${String(4900 + Math.floor(Math.random() * 99)).padStart(6, "0")}`,
        status: "IN_REVIEW",
        submittedAt: new Date().toISOString(),
      };
    }

    revalidatePath("/loans");
    return {
      responseType: "success",
      message: "Application submitted",
      data: result,
    };
  } catch (error: unknown) {
    return errorResponse<LoanApplicationResult>(
      error,
      "Failed to submit application",
    );
  }
}

export async function recordLoanPayment(
  loanId: string,
  values: LoanPaymentFormValues,
): Promise<FormResponse<Loan>> {
  const parsed = LoanPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }

  try {
    const v = parsed.data;
    let loan: Loan | null;

    if (FINANCING_BACKEND_READY) {
      const apiClient = new ApiClient();
      const data = (await apiClient.post(loansUrl(LOAN_ENDPOINTS.pay(loanId)), {
        amount: v.amount,
        channel: v.channel,
        reference: v.reference || undefined,
      })) as Loan;
      loan = parseStringify(data);
    } else {
      // Stub: echo the loan back unchanged.
      loan = parseStringify(getMockLoan(loanId));
    }

    revalidatePath("/loans");
    revalidatePath(`/loans/${loanId}`);
    return {
      responseType: "success",
      message: "Payment received",
      data: loan ?? undefined,
    };
  } catch (error: unknown) {
    return errorResponse<Loan>(error, "Failed to record payment");
  }
}

function errorResponse<T>(error: unknown, fallback: string): FormResponse<T> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
