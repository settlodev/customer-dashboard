"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import { getCurrentBusinessId } from "@/lib/actions/business/get-current-business";
import { SettloApiError } from "@/lib/settlo-api-error-handler";
import type { FormResponse } from "@/types/types";
import type {
  LoanApplication,
  PreQualifiedProduct,
} from "@/types/loans/applications";
import type {
  FinancingTermsStatus,
  SupplierFinancingEligibility,
} from "@/types/loans/supplier-financing";

import { loansUrl } from "./loans-client";

/**
 * Borrower-facing loan APPLICATION actions — talks to the LMS's live
 * borrower endpoints directly (`LoanApplicationController`'s `/mine` routes
 * + `PreQualificationController`). Unlike `loans-actions.ts` (the loan BOOK:
 * eligibility, list/detail, repayments), there is no mock fallback and no
 * `*_BACKEND_READY` gate here — these endpoints are live.
 */

const BASE = "/api/v1/loan-applications";

// ── Reads ───────────────────────────────────────────────────────────

/**
 * The caller's own applications, newest first (server's default page/sort).
 * `[]` means a genuinely empty account (a real 200 with no content) — never a
 * failure. Every error, boundary or not, is rethrown: the list page wraps
 * this call in `softFetch()` (`lib/list-fallback.ts`), which needs the
 * rejection to reach it in order to render `DataLoadError` (with retry).
 * Swallowing a transport failure (LMS outage, gateway 502, timeout, …) into
 * `[]` here would render as "No loan applications" — indistinguishable from
 * an empty account — instead of a visible, retryable error.
 */
export async function listMyApplications(): Promise<LoanApplication[]> {
  try {
    const apiClient = new ApiClient("loans");
    const data = await apiClient.get(loansUrl(`${BASE}/mine`));
    // Backend returns a Spring page; the list view only needs the content.
    const page = parseStringify(data) as
      | { content?: LoanApplication[] }
      | LoanApplication[];
    return Array.isArray(page) ? page : (page.content ?? []);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listMyApplications failed", error);
    throw error;
  }
}

/** A single application the caller owns, or `null` if it doesn't exist / isn't theirs (404). */
export async function getMyApplication(
  id: string,
): Promise<LoanApplication | null> {
  try {
    const apiClient = new ApiClient("loans");
    const data = await apiClient.get(loansUrl(`${BASE}/mine/${id}`));
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/**
 * Catalog of PUBLISHED loan products the caller's active business qualifies
 * for, before they apply. `businessId` is resolved the same ambient way
 * `getLoanEligibility`'s callers resolve it elsewhere in the loans feature —
 * from the `currentBusiness` cookie, via `getCurrentBusinessId` — read here
 * directly since this action (unlike `getLoanEligibility`) takes no
 * parameters. Returns `null` when no business is selected or the call fails
 * (soft signal — same contract as the rest of the loans reads).
 *
 * Deliberately does NOT use `rethrowIfBoundary` — unlike the rest of this
 * file, this action's callers span permission-diverse personas (it has been
 * called from permissionless surfaces such as the retired LPO create-form
 * financing card), so a FORBIDDEN here is an expected outcome, not an
 * exceptional one. Catch everything and return `null`.
 */
export async function getPreQualification(): Promise<
  PreQualifiedProduct[] | null
> {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) return null;

    const apiClient = new ApiClient("loans");
    const data = await apiClient.get(
      loansUrl(
        `/api/v1/pre-qualification?businessId=${encodeURIComponent(businessId)}`,
      ),
    );
    return parseStringify(data);
  } catch (error) {
    console.error("getPreQualification failed", error);
    return null;
  }
}

// ── Mutations ──────────────────────────────────────────────────────

/**
 * Accept an APPROVED offer, booking the loan. The LMS rejects this with a
 * clear conflict message when the offer already expired or the application
 * isn't APPROVED (e.g. "This loan offer has expired and can no longer be
 * accepted", "Only APPROVED applications can be accepted (was ...)")  —
 * `error.message` on the thrown `SettloApiError` already carries that
 * backend message through `handleSettloApiError`, so it's surfaced directly
 * rather than mapped through a generic fallback.
 */
export async function acceptOffer(
  id: string,
): Promise<FormResponse<LoanApplication>> {
  try {
    const apiClient = new ApiClient("loans");
    const data = await apiClient.post<LoanApplication, undefined>(
      loansUrl(`${BASE}/${id}/accept`),
      undefined,
    );
    revalidatePath("/loans/applications");
    return {
      responseType: "success",
      message: "Offer accepted",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to accept offer",
      // Wire code (e.g. the supplier accept gates TERMS_NOT_ACCEPTED /
      // PHONE_NOT_VERIFIED / PHONE_VERIFICATION_UNAVAILABLE, or
      // OFFER_EXPIRED) — the finance-flow modal branches on this to route
      // the user back to the right step or retry with backoff.
      errorCode: error instanceof SettloApiError ? error.code : undefined,
      // The LMS throws PHONE_VERIFICATION_UNAVAILABLE (ERR-6215) as a 503,
      // but `handleSettloApiError`'s 502/503/504 branch hard-codes
      // `SERVICE_UNAVAILABLE` as the errorCode (discarding the parsed
      // `serverCode`) — so ERR-6215 never actually reaches the client via
      // `errorCode`. Surfacing the raw HTTP status lets the caller retry on
      // transport-level unavailability too, independent of that collapse.
      status: error instanceof SettloApiError ? error.status : undefined,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ── Supplier financing (LPO post-acceptance flow) ───────────────────

/**
 * Stateless eligibility check for financing an accepted LPO — mirrors the
 * LMS's `GET /api/v1/supplier-financing/eligibility?lpoId=`. Declines are a
 * normal 200 with `eligible: false` + a friendly `reason`; `eligible: null`
 * means an application already exists (resume from `existingApplicationId`).
 * Returns `null` only on genuine failure (transport, 404 foreign/missing
 * LPO, permission) so the banner can show a "couldn't check" state with a
 * re-run affordance — same soft contract as `getPreQualification`.
 */
export async function getSupplierFinancingEligibility(
  lpoId: string,
): Promise<SupplierFinancingEligibility | null> {
  try {
    const apiClient = new ApiClient("loans");
    const data = await apiClient.get(
      loansUrl(
        `/api/v1/supplier-financing/eligibility?lpoId=${encodeURIComponent(lpoId)}`,
      ),
    );
    return parseStringify(data);
  } catch (error) {
    console.error("getSupplierFinancingEligibility failed", error);
    return null;
  }
}

/**
 * The caller's account-level financing-terms state — mirrors the LMS's
 * `GET /api/v1/financing-terms` → `{ currentVersion, accepted, acceptedAt }`.
 * `null` on failure (the modal shows an error state; the FinancingCard
 * tracker treats it as "not yet accepted").
 */
export async function getFinancingTerms(): Promise<FinancingTermsStatus | null> {
  try {
    const apiClient = new ApiClient("loans");
    const data = await apiClient.get(loansUrl(`/api/v1/financing-terms`));
    return parseStringify(data);
  } catch (error) {
    console.error("getFinancingTerms failed", error);
    return null;
  }
}

/**
 * Accept the current supplier-financing terms version for the caller's
 * account — `POST /api/v1/financing-terms/accept` body `{ version }`.
 * Idempotent on re-accept. A 409 TERMS_VERSION_STALE (version raced a
 * backend bump) surfaces through `errorCode` so the modal can re-fetch and
 * re-show the terms step.
 */
export async function acceptFinancingTerms(
  version: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient("loans");
    await apiClient.post<void, { version: string }>(
      loansUrl(`/api/v1/financing-terms/accept`),
      { version },
    );
    return { responseType: "success", message: "Terms accepted" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to accept the financing terms",
      errorCode: error instanceof SettloApiError ? error.code : undefined,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
