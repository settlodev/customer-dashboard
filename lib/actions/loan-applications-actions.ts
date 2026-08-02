"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import { getCurrentBusinessId } from "@/lib/actions/business/get-current-business";
import type { FormResponse } from "@/types/types";
import type {
  LoanApplication,
  PreQualifiedProduct,
} from "@/types/loans/applications";

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
 * file, this action's callers span permission-diverse personas.
 * `financing-option-card.tsx` calls it for anyone opening the LPO form,
 * including purchasing-only staff with no `loans:apply`, so a FORBIDDEN here
 * is an expected outcome, not an exceptional one. That caller also awaits
 * this inside a bare `Promise.all` with no boundary around it, so rethrowing
 * would surface as an unhandled rejection that leaves its loading flags
 * spinning forever instead of resolving to the "couldn't check eligibility"
 * fallback. Catch everything and return `null`.
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
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
