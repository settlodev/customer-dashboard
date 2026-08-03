# LPO Financing — Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move LPO supplier-financing from a create-time radio to a post-acceptance opt-in on the purchase-order detail page: an eligibility banner plus a Terms → Verify phone → Offer modal that books the loan and auto-pays the supplier.

**Architecture:** A server-gated `FinancingBanner` (client component) on `/purchase-orders/[id]` resolves state precedence (financed → in-progress → declined → live eligibility call) and opens a `FinanceFlowModal` that orchestrates three step components (terms acceptance, existing-number OTP verification, offer polling + accept-with-retry). All backend calls are Next server actions over the existing `ApiClient` (loans client → LMS, inventory client → Inventory, `ApiClient(true)` → Auth). The existing `FinancingCard` tracker is re-staged to the design's four steps, and the create-form financing radio is retired.

**Tech Stack:** Next.js 15 (App Router, server actions), TypeScript strict, shadcn/ui primitives (`Dialog`, `input-otp`, `Checkbox`, `ScrollArea`, `Badge`, `Skeleton`), Tailwind with the repo's semantic tokens, axios-based `ApiClient`.

## Global Constraints

- Mirror backend DTO names/fields EXACTLY as specified in the 2026-08-03 LPO-financing spec: `SupplierFinancingEligibilityResponse { eligible, reasonCode, reason, quote{ financedAmount, feeAmount, feeRate, termDays, totalRepayable, indicativeDueDate, currency, availableLimit, limitAfter }, existingApplicationId, applicationStatus }`, financing-terms `{ currentVersion, accepted, acceptedAt }`, application `offerQuote { financedAmount, feeAmount, feeRate, termDays, totalRepayable, indicativeDueDate, offerExpiresAt }`. Money = plain JSON number, dates = ISO strings, UUIDs = strings.
- Endpoints consumed (no mocks, no new flags): LMS `GET /api/v1/supplier-financing/eligibility?lpoId=`, `GET /api/v1/financing-terms`, `POST /api/v1/financing-terms/accept`, `GET /api/v1/loan-applications/mine/{id}`, `POST /api/v1/loan-applications/{id}/accept`; Inventory `POST /api/v1/lpos/{id}/financing`; Auth `GET /auth/profile/phone`, `GET /auth/verify/phone/request/{userId}`, `POST /auth/verify/phone/code`.
- Style with the repo's semantic Tailwind tokens (`text-ink`, `text-ink-2`, `text-ink-3`, `bg-canvas`, `border-line`, `border-line-2`, `bg-pos`/`bg-pos-tint`/`text-pos`, `bg-primary-light`/`text-primary-dark`, `Badge` variants `pos`/`warn`/`neg`/`soft`) — NEVER raw design CSS, hex values, or new tokens.
- The `FINANCING_BADGE_VARIANT` export in `components/widgets/lpo/financing-card.tsx` MUST keep its name, type, and values — `components/tables/lpo/columns.tsx` imports it.
- Gating is the EXISTING `LOANS_ENABLED` flag + `loans:read`/`loans:apply` permissions (`getLoanAccess`). No new env flags.
- OTP is 6 digits with a 60-second resend cooldown (ratified decision D3) — never the design mock's 4-digit/30s variant.
- The new flow is full-order financing only: the dashboard never sends `financedAmount`, and LPO creation is always DIRECT.
- Accept-gate error codes arrive as LMS wire codes (`ERR-62xx` strings in `SettloApiError.code`), not names. `PHONE_VERIFICATION_UNAVAILABLE` is retryable with backoff totalling ≤ 10s (spec §4.4).
- After every task: `npx tsc --noEmit` and targeted `npx next lint --file …` must pass. Final gate: `npm run lint` + production build with `NODE_OPTIONS=--max-old-space-size=8192 npm run build` (build OOMs without it; if a build is killed, `rm -rf .next` before rebuilding — a corrupted `.next` throws `/_document` PageNotFoundError).
- Commit after every task, conventional style matching `git log` (`feat(financing): …`, `fix(loans): …`), body optional, always ending with the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Match the approved design's flow and copy register (banner with 4 states: checking skeleton / eligible with quote + "Finance this order" / not-eligible with reason / financed hero with 4-step tracker; modal: Terms with scrollable copy + checkbox → Verify phone with masked number + send code + 6 OTP boxes + resend cooldown → Offer with total-repayable hero + fee/term/limit-after rows + Accept). Final visual QA is against the design source (claude.ai/design project `019dd974-e60d-78f5-9a35-a8ae67b2f90a`, `Settlo LPO Financing.html`).

---

### Task 1: Supplier-financing wire types

**Files:**
- Create: `types/loans/supplier-financing.ts`
- Modify: `types/loans/applications.ts` (add `OfferQuote` + `offerQuote` field)

**Interfaces:**
- Consumes: nothing (first task).
- Produces (imported by Tasks 2, 7, 8, 9):
  - `interface SupplierFinancingQuote { financedAmount: number; feeAmount: number; feeRate: number; termDays: number; totalRepayable: number; indicativeDueDate: string; currency: string; availableLimit: number; limitAfter: number }`
  - `interface SupplierFinancingEligibility { eligible: boolean | null; reasonCode: string | null; reason: string | null; quote: SupplierFinancingQuote | null; existingApplicationId: string | null; applicationStatus: string | null }`
  - `interface FinancingTermsStatus { currentVersion: string; accepted: boolean; acceptedAt: string | null }`
  - `const SUPPLIER_FINANCING_GATE_CODES: { TERMS_NOT_ACCEPTED: string; TERMS_VERSION_STALE: string; PHONE_NOT_VERIFIED: string; PHONE_VERIFICATION_UNAVAILABLE: string }`
  - `function formatFeeRate(feeRate: number | null | undefined): string`
  - `interface OfferQuote { financedAmount: number; feeAmount: number; feeRate: number; termDays: number; totalRepayable: number; indicativeDueDate: string; offerExpiresAt: string }` (in `types/loans/applications.ts`)
  - `LoanApplication` gains `offerQuote?: OfferQuote | null`

- [ ] **Step 1: Verify the LMS gate-code allocations before hardcoding them**

The four new accept-gate codes take "the next free ERR-62xx slots" on the LMS (spec §4.4). Today ERR-6201…ERR-6211 are taken, so the expected allocation, in spec order, is 6212–6215. Confirm against the LMS source (the backend plan lands them in the same change train):

Run: `rg -n "TERMS_NOT_ACCEPTED|TERMS_VERSION_STALE|PHONE_NOT_VERIFIED|PHONE_VERIFICATION_UNAVAILABLE" "/Users/Peter/Settlo/Settlo Loan Management Service/src/main/java/co/tz/settlo/lms/common/error/ErrorCodes.java"`

If the constants exist, use the exact `ERR-xxxx` strings you see. If they don't exist yet (backend not landed), use the values in Step 2 as written and leave the sync comment in place — it tells the next person exactly where the source of truth is.

- [ ] **Step 2: Create `types/loans/supplier-financing.ts`**

```ts
/**
 * Supplier-financing (LPO post-acceptance) types — mirror the Loan Management
 * Service's borrower-safe supplier-financing DTOs exactly (field names and
 * nullability), per the 2026-08-03 LPO-financing design.
 *
 * Source DTOs:
 *  - `SupplierFinancingEligibility` mirrors the LMS's
 *    `SupplierFinancingEligibilityResponse` (GET
 *    /api/v1/supplier-financing/eligibility?lpoId=). `eligible` is a
 *    TRI-state: true/false is a fresh check outcome; null means an
 *    application already exists — resume from `existingApplicationId`
 *    instead of re-checking.
 *  - `SupplierFinancingQuote` mirrors its nested `quote` block (present only
 *    when eligible).
 *  - `FinancingTermsStatus` mirrors the LMS financing-terms response
 *    (GET /api/v1/financing-terms → { currentVersion, accepted, acceptedAt }).
 *
 * Conventions: money is a plain JSON number (BigDecimal); dates are ISO
 * strings; UUIDs are strings.
 */

export interface SupplierFinancingQuote {
  /** Full order total — the new flow is full-order financing only (D6). */
  financedAmount: number;
  feeAmount: number;
  /** Fraction of principal (0.05 = 5%) — same convention as the LMS's
   *  `LoanProduct.flatFeeRate`. Render via {@link formatFeeRate}. */
  feeRate: number;
  termDays: number;
  totalRepayable: number;
  /** today + termDays; the real due date is fixed at disbursement. */
  indicativeDueDate: string;
  currency: string;
  availableLimit: number;
  limitAfter: number;
}

export interface SupplierFinancingEligibility {
  /** true/false = fresh check outcome; null = application already exists. */
  eligible: boolean | null;
  /** Machine code for the none-state (e.g. supplier not financeable). */
  reasonCode: string | null;
  /** Merchant-friendly text for the none-state. */
  reason: string | null;
  /** Present only when `eligible === true`. */
  quote: SupplierFinancingQuote | null;
  /** Set when `eligible === null` — resume the flow from this application. */
  existingApplicationId: string | null;
  applicationStatus: string | null;
}

export interface FinancingTermsStatus {
  currentVersion: string;
  /** Whether the caller's ACCOUNT accepted `currentVersion` (account-level fact). */
  accepted: boolean;
  acceptedAt: string | null;
}

/**
 * LMS wire codes for the supplier-product accept gates (spec §4.4). The LMS
 * serializes error codes as "ERR-xxxx" strings (see its
 * common/error/ErrorCodes.java), NOT constant names — keep these in sync
 * with that file. Allocated as the next free ERR-62xx slots after
 * OFFER_EXPIRED = ERR-6211.
 */
export const SUPPLIER_FINANCING_GATE_CODES = {
  TERMS_NOT_ACCEPTED: "ERR-6212",
  TERMS_VERSION_STALE: "ERR-6213",
  PHONE_NOT_VERIFIED: "ERR-6214",
  /** Accounts kyc-status unreachable — RETRYABLE: back off ≤10s total (spec §4.4). */
  PHONE_VERIFICATION_UNAVAILABLE: "ERR-6215",
} as const;

/** 0.05 → "5%", 0.125 → "12.5%". Null-safe for defensive rendering. */
export function formatFeeRate(feeRate: number | null | undefined): string {
  if (feeRate == null || Number.isNaN(feeRate)) return "—";
  const pct = feeRate * 100;
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}
```

- [ ] **Step 3: Add the `offerQuote` block to `types/loans/applications.ts`**

Append after the `LoanApplication` interface's closing brace is NOT enough — the field goes inside the interface, and the `OfferQuote` interface goes right above it. Insert above `/** Mirrors the LMS's \`CustomerApplicationResponse\` — see file header for what's deliberately excluded. */`:

```ts
/**
 * Re-quoted offer economics on an APPROVED supplier-product application —
 * mirrors the `offerQuote` block the LMS adds to
 * `CustomerApplicationResponse` on `GET /api/v1/loan-applications/mine/{id}`
 * (re-quoted via `LoanQuoteEngine` on read). Null/absent for non-approved
 * states and non-supplier products.
 */
export interface OfferQuote {
  financedAmount: number;
  feeAmount: number;
  /** Fraction of principal (0.05 = 5%) — same convention as `SupplierFinancingQuote.feeRate`. */
  feeRate: number;
  termDays: number;
  totalRepayable: number;
  indicativeDueDate: string;
  offerExpiresAt: string;
}
```

Then add this field at the END of the `LoanApplication` interface, after `settloSupplierId: string | null;`:

```ts
  /** See {@link OfferQuote}. Optional (`?`) because pre-rollout LMS responses omit the key entirely. */
  offerQuote?: OfferQuote | null;
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file types/loans/supplier-financing.ts --file types/loans/applications.ts`
Expected: no errors/warnings for these files.

- [ ] **Step 5: Commit**

```bash
git add types/loans/supplier-financing.ts types/loans/applications.ts
git commit -m "feat(financing): supplier-financing eligibility, terms, and offer-quote wire types

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: LMS server actions — eligibility, terms, accept-gate codes

**Files:**
- Modify: `lib/actions/loan-applications-actions.ts`

**Interfaces:**
- Consumes (Task 1): `SupplierFinancingEligibility`, `FinancingTermsStatus` from `@/types/loans/supplier-financing`.
- Produces (imported by Tasks 8, 9, 10):
  - `getSupplierFinancingEligibility(lpoId: string): Promise<SupplierFinancingEligibility | null>` — null ONLY on transport/permission failure; a decline is a normal response with `eligible: false`.
  - `getFinancingTerms(): Promise<FinancingTermsStatus | null>` — null on failure.
  - `acceptFinancingTerms(version: string): Promise<FormResponse>` — `errorCode` carries the LMS wire code (e.g. TERMS_VERSION_STALE) on error.
  - `acceptOffer(id: string): Promise<FormResponse<LoanApplication>>` — EXISTING signature unchanged; error responses now also populate `errorCode` with `SettloApiError.code`.

- [ ] **Step 1: Add imports**

In `lib/actions/loan-applications-actions.ts`, extend the imports (below the existing `import type { FormResponse } from "@/types/types";` block):

```ts
import { SettloApiError } from "@/lib/settlo-api-error-handler";
import type {
  FinancingTermsStatus,
  SupplierFinancingEligibility,
} from "@/types/loans/supplier-financing";
```

- [ ] **Step 2: Add the three new actions**

Append this section at the end of the file (after `acceptOffer`):

```ts
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
```

- [ ] **Step 3: Surface the gate codes from `acceptOffer`**

In the existing `acceptOffer` function, replace its catch-block return:

```ts
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to accept offer",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
```

with:

```ts
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to accept offer",
      // Wire code (e.g. the supplier accept gates TERMS_NOT_ACCEPTED /
      // PHONE_NOT_VERIFIED / PHONE_VERIFICATION_UNAVAILABLE, or
      // OFFER_EXPIRED) — the finance-flow modal branches on this to route
      // the user back to the right step or retry with backoff.
      errorCode: error instanceof SettloApiError ? error.code : undefined,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file lib/actions/loan-applications-actions.ts`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/loan-applications-actions.ts
git commit -m "feat(financing): eligibility + financing-terms actions, gate codes surfaced from acceptOffer

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Inventory server action — start LPO financing

**Files:**
- Modify: `lib/actions/lpo-actions.ts`

**Interfaces:**
- Consumes: existing `ApiClient`, `inventoryUrl`, `Lpo` type, `FormResponse`.
- Produces (imported by Task 8):
  - `startLpoFinancing(id: string): Promise<FormResponse<Lpo>>` — success carries the updated `Lpo`; a 200 when the LPO is ALREADY financed is still success (modal resume, per spec §5.2).

- [ ] **Step 1: Add the action**

In `lib/actions/lpo-actions.ts`, inside the `// ── Financing (pay-via-Settlo) ───` section (directly under `getSupplierFinancingPreview`, which Task 11 later removes), add:

```ts
/**
 * Merchant opt-in: flip an accepted LPO to Settlo financing — mirrors the
 * Inventory Service's `POST /api/v1/lpos/{id}/financing`. The backend
 * validates scope/status/acknowledgement, sets paymentMethod =
 * SETTLO_FINANCING with full-order financing (financedAmount null), mints
 * the shadow supplier order and publishes SUPPLIER_ORDER_CREATED — the LMS
 * consumer then creates + submits the loan application asynchronously.
 *
 * An already-financed LPO with a live shadow order returns 200 with the
 * current state (modal resume), so callers can treat every success the same
 * way. Requires purchasing:approve + an active location (X-Location-Id is
 * attached by ApiClient).
 */
export async function startLpoFinancing(id: string): Promise<FormResponse<Lpo>> {
  try {
    const apiClient = new ApiClient();
    const updated = (await apiClient.post(
      inventoryUrl(`${BASE}/${id}/financing`),
      {},
    )) as Lpo;
    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${id}`);
    return {
      responseType: "success",
      message: "Financing requested",
      data: parseStringify(updated),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to start financing for this order",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file lib/actions/lpo-actions.ts`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/lpo-actions.ts
git commit -m "feat(financing): startLpoFinancing action for the post-acceptance opt-in

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Phone-verify actions for the CURRENT number

**Files:**
- Modify: `lib/actions/phone-actions.tsx`

**Interfaces:**
- Consumes: existing `ApiClient`, `FormResponse`, `SettloApiError`/`getUIErrorMessage`, plus `getAuthToken` from `@/lib/auth-utils` (the auth cookie carries `userId` — the same value `ApiClient` stamps into `X-User-Id`).
- Produces (imported by Task 6):
  - `requestPhoneVerificationCode(): Promise<FormResponse>` — sends the SMS code to the user's EXISTING auth phone (`GET /auth/verify/phone/request/{userId}`; note it is a GET on the Auth service's `VerificationController`).
  - `verifyPhoneCode(code: string): Promise<FormResponse>` — `POST /auth/verify/phone/code` body `{ userId, code }`.
  - The existing `getPhoneStatus(): Promise<FormResponse<PhoneStatus>>` is reused unchanged by Tasks 6/8 (`PhoneStatus = { phoneNumber: string | null; phoneVerified: boolean }`).

Why new actions: the existing `submitPhone`/`confirmPhoneCode` pair is the CHANGE flow (`/auth/profile/phone/change*`) — it replaces the stored number. The financing modal must verify the number ALREADY on file without changing it, which is the Auth service's `/auth/verify/phone/*` family (spec §6). Verification propagates Auth → `PHONE_VERIFIED` Kafka → Accounts projection, which the LMS reads at accept time.

- [ ] **Step 1: Add the import**

At the top of `lib/actions/phone-actions.tsx`, alongside the existing imports:

```ts
import { getAuthToken } from "@/lib/auth-utils";
```

- [ ] **Step 2: Append the two verify actions**

Add at the end of the file:

```ts
// ── Verify the EXISTING auth phone (no change) ──────────────────────
// Used by the LPO financing modal: the LMS's supplier accept gate requires
// phoneVerified, and the merchant verifies the number already on file.
// These target the Auth service's VerificationController
// (`/auth/verify/phone/*`), which addresses the user BY ID — the id comes
// from the auth cookie (`getAuthToken().userId`), the same value ApiClient
// stamps into X-User-Id on every request. Distinct from submitPhone /
// confirmPhoneCode above, which run the CHANGE flow and replace the number.

/**
 * Text a 6-digit verification code to the user's existing auth phone.
 * The Auth endpoint is a GET keyed by userId. The backend enforces a 60s
 * resend cooldown; when hit it returns a RATE_LIMITED "please wait…"
 * message which is surfaced verbatim.
 */
export const requestPhoneVerificationCode = async (): Promise<FormResponse> => {
  const token = await getAuthToken();
  if (!token?.userId) {
    return {
      responseType: "error",
      message: "Your session has expired. Please log in again.",
      error: new Error("No userId on auth token"),
    };
  }
  try {
    const apiClient = new ApiClient(true);
    await apiClient.get(`/auth/verify/phone/request/${token.userId}`);
    return {
      responseType: "success",
      message: "We sent a verification code to your phone",
    };
  } catch (error) {
    const message =
      error instanceof SettloApiError
        ? getUIErrorMessage(
            error.code,
            error.message,
            "Couldn't send the verification code. Please try again.",
          )
        : "Couldn't send the verification code. Please try again.";
    return {
      responseType: "error",
      message,
      errorCode: error instanceof SettloApiError ? error.code : undefined,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Confirm the SMS code and mark the existing auth phone verified —
 * `POST /auth/verify/phone/code` with `{ userId, code }` (the Auth DTO is
 * `VerifyByCodeRequest`). On success Auth publishes PHONE_VERIFIED; the
 * Accounts projection the LMS reads at accept time follows shortly (the
 * accept path retries to absorb that lag).
 */
export const verifyPhoneCode = async (code: string): Promise<FormResponse> => {
  const token = await getAuthToken();
  if (!token?.userId) {
    return {
      responseType: "error",
      message: "Your session has expired. Please log in again.",
      error: new Error("No userId on auth token"),
    };
  }
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post<void, { userId: string; code: string }>(
      `/auth/verify/phone/code`,
      { userId: token.userId, code },
    );
    return { responseType: "success", message: "Phone number verified" };
  } catch (error) {
    const message =
      error instanceof SettloApiError
        ? getUIErrorMessage(error.code, error.message, "Invalid code. Please try again.")
        : "Invalid code. Please try again.";
    return {
      responseType: "error",
      message,
      errorCode: error instanceof SettloApiError ? error.code : undefined,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file lib/actions/phone-actions.tsx`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/phone-actions.tsx
git commit -m "feat(financing): verify-existing-phone actions (request + confirm code)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Terms copy + Terms step component

**Files:**
- Create: `components/widgets/lpo/finance-flow/terms-copy.ts`
- Create: `components/widgets/lpo/finance-flow/terms-step.tsx`

**Interfaces:**
- Consumes: `Checkbox`, `ScrollArea`, `Button` from `components/ui`; `FormError` from `@/components/widgets/form-error`.
- Produces (imported by Task 8):
  - `FINANCING_TERMS_CLAUSES: { title: string; body: string }[]` (from `terms-copy.ts`)
  - `function TermsStep(props: { termsVersion: string; submitting: boolean; error: string | null; onAgree: () => void }): JSX.Element` — presentational; the modal shell owns the `acceptFinancingTerms` + `startLpoFinancing` calls and passes `submitting`/`error` down.

Note on copy provenance: per spec §3.2 the terms copy LIVES IN THE DASHBOARD (the LMS records only a version string). The 8 clauses below are the design source's terms sheet (`lpo-financing.jsx`, `.fm-terms` block) VERBATIM, with two factual corrections because the mock hardcodes product-configured values: clause 2 drops "Terms run 30 days…" in favour of the offer's own term (term length comes from the product's `defaultTermDays`), and clause 4 drops the "1.5% monthly late fee" figure in favour of the loan agreement's configured penalties (`penaltyRatePerDay`/`lateFeeFlat` are product-level). Final legal wording needs business sign-off before go-live; any material edit ships with an LMS `lms.financing-terms.version` bump.

- [ ] **Step 1: Create `components/widgets/lpo/finance-flow/terms-copy.ts`**

```ts
/**
 * Settlo supplier-financing terms — the canonical clause copy rendered in
 * the FinanceFlowModal "Terms" step. Per the 2026-08-03 LPO-financing
 * design, this copy LIVES IN THE DASHBOARD; the LMS only records acceptance
 * of a version string (`GET/POST /api/v1/financing-terms`). Any material
 * edit here must ship together with a version bump on the LMS
 * (`lms.financing-terms.version`) so existing acceptances don't silently
 * cover new wording. The accept call always posts the `currentVersion` the
 * LMS reports — never a value hardcoded in the dashboard.
 */

export interface FinancingTermsClause {
  title: string;
  body: string;
}

export const FINANCING_TERMS_CLAUSES: FinancingTermsClause[] = [
  {
    title: "What we do",
    body:
      "Settlo pays your approved supplier invoice in full on your behalf. Goods and invoice disputes remain between you and the supplier.",
  },
  {
    title: "Repayment",
    body:
      "You repay Settlo the financed amount plus the disclosed fee on or before the due date shown on your offer. The term shown on your offer runs from the date the supplier is paid.",
  },
  {
    title: "Fees",
    body:
      "A one-off facility fee is quoted per order before you accept. There are no compounding interest charges.",
  },
  {
    title: "Late repayment",
    body:
      "Late balances attract the late-payment charges set out in your loan agreement and may pause your financing limit until settled.",
  },
  {
    title: "Collections",
    body:
      "Repayments are drawn from your Settlo settlement balance first, then from the mobile money or bank account on file.",
  },
  {
    title: "Limit reviews",
    body:
      "Your limit is reviewed against your Settlo sales and repayment history and may change over time.",
  },
  {
    title: "Data",
    body:
      "You authorise Settlo and its lending partners to assess your transaction history for credit decisions and to report repayment conduct to licensed credit bureaus.",
  },
  {
    title: "Cancellation",
    body:
      "You may cancel a financing request any time before the supplier is paid, at no cost.",
  },
];
```

- [ ] **Step 2: Create `components/widgets/lpo/finance-flow/terms-step.tsx`**

```tsx
"use client";

import { useId, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormError } from "@/components/widgets/form-error";
import { FINANCING_TERMS_CLAUSES } from "./terms-copy";

/**
 * Step 1 of the finance-flow modal: scrollable terms copy + explicit
 * agreement checkbox. Purely presentational — the modal shell owns the
 * acceptFinancingTerms → startLpoFinancing sequence and reports progress
 * through `submitting` / `error`. Shown only when the account has NOT yet
 * accepted the current terms version (account-level fact; re-opening the
 * modal later skips this step).
 */
export function TermsStep({
  termsVersion,
  submitting,
  error,
  onAgree,
}: {
  termsVersion: string;
  submitting: boolean;
  error: string | null;
  onAgree: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const checkboxId = useId();

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary-light text-primary-dark">
          <ScrollText className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">
            Supplier financing terms
          </div>
          <div className="text-xs text-muted-foreground">
            One-time acceptance for your account — version {termsVersion}
          </div>
        </div>
      </div>

      <ScrollArea className="h-64 rounded-lg border border-line bg-canvas/60">
        <ol className="space-y-3.5 p-4">
          {FINANCING_TERMS_CLAUSES.map((clause, i) => (
            <li key={clause.title} className="flex gap-2.5">
              <span className="font-mono text-[11px] font-semibold text-ink-3">
                {i + 1}.
              </span>
              <div>
                <div className="text-[12.5px] font-semibold text-ink">
                  {clause.title}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-2">
                  {clause.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </ScrollArea>

      <label
        htmlFor={checkboxId}
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-2 p-3.5 text-left has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-light"
      >
        <Checkbox
          id={checkboxId}
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          disabled={submitting}
          className="mt-0.5"
        />
        <span className="text-[13px] leading-relaxed text-ink-2">
          I have read and accept the{" "}
          <b className="font-semibold text-ink">Settlo financing terms</b> and{" "}
          <b className="font-semibold text-ink">privacy notice</b>.
        </span>
      </label>

      {error && <FormError message={error} />}

      <Button
        className="w-full justify-center"
        disabled={!agreed || submitting}
        onClick={onAgree}
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up financing…
          </span>
        ) : (
          "Agree & continue"
        )}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/widgets/lpo/finance-flow/terms-copy.ts --file components/widgets/lpo/finance-flow/terms-step.tsx`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/widgets/lpo/finance-flow/terms-copy.ts components/widgets/lpo/finance-flow/terms-step.tsx
git commit -m "feat(financing): finance-flow terms step with canonical 8-clause terms copy

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Verify-phone step component

**Files:**
- Create: `components/widgets/lpo/finance-flow/phone-step.tsx`

**Interfaces:**
- Consumes (Task 4): `requestPhoneVerificationCode()`, `verifyPhoneCode(code)` from `@/lib/actions/phone-actions`; `InputOTP`/`InputOTPGroup`/`InputOTPSlot` from `@/components/ui/input-otp`; `FormError`, `Button`.
- Produces (imported by Task 8):
  - `function PhoneStep(props: { phoneNumber: string | null; onVerified: () => void }): JSX.Element` — self-contained send/verify/resend logic; calls `onVerified()` exactly once after a successful code confirmation.

Pattern precedent: `app/(protected)/profile/phone_card.tsx` (auto-submit at 6 digits, backend cooldown surfaced). Difference: this step verifies the EXISTING number (never collects one) and adds a visible 60s resend countdown per D3.

- [ ] **Step 1: Create `components/widgets/lpo/finance-flow/phone-step.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { FormError } from "@/components/widgets/form-error";
import {
  requestPhoneVerificationCode,
  verifyPhoneCode,
} from "@/lib/actions/phone-actions";

/** "+255712345678" → "+255 ••• ••678" — country code + last 3 stay visible. */
function maskPhone(phone: string): string {
  const compact = phone.replace(/\s+/g, "");
  if (compact.length < 8) return phone;
  return `${compact.slice(0, 4)} ••• ••${compact.slice(-3)}`;
}

const RESEND_COOLDOWN_SECONDS = 60; // Auth-service cooldown (ratified D3)

/**
 * Step 2 of the finance-flow modal: verify the EXISTING auth phone via the
 * platform OTP flow (6-digit code, 60s resend cooldown, 10-min expiry —
 * D3). Never collects a number; changing it is the profile flow, linked
 * below. The shell mounts this step only when `phoneVerified` is false.
 */
export function PhoneStep({
  phoneNumber,
  onVerified,
}: {
  phoneNumber: string | null;
  onVerified: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Tick the resend countdown once a second while it's running.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(
      () => setCooldown((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendCode = async () => {
    if (sending || cooldown > 0) return;
    setError(null);
    setSending(true);
    const res = await requestPhoneVerificationCode();
    setSending(false);
    if (res.responseType === "success") {
      setSent(true);
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } else {
      // A backend RATE_LIMITED "please wait…" message is surfaced verbatim.
      setError(res.message);
    }
  };

  const submitCode = async (value: string) => {
    if (value.length !== 6 || verifying) return;
    setError(null);
    setVerifying(true);
    const res = await verifyPhoneCode(value);
    setVerifying(false);
    if (res.responseType === "success") {
      onVerified();
    } else {
      setError(res.message);
      setCode("");
    }
  };

  // No phone on file at all — verification is impossible until one is added
  // via the profile flow. Honest dead-end with a way out.
  if (!phoneNumber) {
    return (
      <div className="space-y-4">
        <Header subtitle="A verified phone number is required before you can accept a financing offer." />
        <div className="rounded-lg border border-line bg-canvas px-3.5 py-3 text-[12.5px] text-ink-2">
          Your account has no phone number yet. Add and verify one in your
          profile, then return here — your progress is saved.
        </div>
        <Button asChild variant="outline" className="w-full justify-center">
          <Link href="/profile">Add a phone number in Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        subtitle={
          sent
            ? `Enter the 6-digit code we sent to ${maskPhone(phoneNumber)}.`
            : `We'll text a 6-digit code to ${maskPhone(phoneNumber)} to confirm it's you.`
        }
      />

      {!sent ? (
        <Button
          className="w-full justify-center"
          onClick={() => void sendCode()}
          disabled={sending}
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </span>
          ) : (
            "Send code"
          )}
        </Button>
      ) : (
        <>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                if (value.length === 6 && !verifying) {
                  void submitCode(value);
                }
              }}
              disabled={verifying}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {verifying && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </div>
          )}

          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <span>Didn&apos;t get it?</span>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => void sendCode()}
              disabled={sending || verifying || cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </Button>
          </div>
        </>
      )}

      {error && <FormError message={error} />}

      <p className="text-center text-xs text-muted-foreground">
        Wrong number?{" "}
        <Link
          href="/profile"
          className="font-medium text-primary hover:underline"
        >
          Change it in Profile
        </Link>{" "}
        — then come back; your progress is saved.
      </p>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary-light text-primary-dark">
        <Smartphone className="h-4 w-4" />
      </span>
      <div>
        <div className="text-sm font-semibold text-ink">Verify your phone</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/widgets/lpo/finance-flow/phone-step.tsx`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/widgets/lpo/finance-flow/phone-step.tsx
git commit -m "feat(financing): finance-flow phone step — existing-number OTP with resend cooldown

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Offer step component — polling, quote, accept with retry

**Files:**
- Create: `components/widgets/lpo/finance-flow/offer-step.tsx`

**Interfaces:**
- Consumes: `getLpo` (Task 0 — existing, `lib/actions/lpo-actions.ts`), `getMyApplication` + `acceptOffer` (existing + Task 2's `errorCode`), `SUPPLIER_FINANCING_GATE_CODES`, `formatFeeRate`, `SupplierFinancingQuote` (Task 1), `LoanApplication`/`OfferQuote` types, `formatTzs` from `@/types/loans/type`, `Money` from `@/components/widgets/money`, `Button`, `FormError`.
- Produces (imported by Task 8):
  - `function OfferStep(props: { lpoId: string; initialApplicationId: string | null; canApply: boolean; phoneJustVerified: boolean; eligibilityQuote: SupplierFinancingQuote | null; onAccepted: (application: LoanApplication) => void; onNeedsTerms: () => void; onNeedsPhone: () => void }): JSX.Element`
  - Behavior contract: polls `getLpo` (~1.5s, ≤20s) for `loanApplicationId` when `initialApplicationId` is null, then `getMyApplication` until a decision state; APPROVED renders `offerQuote`; Accept runs `acceptOffer` with ≤10s backoff on `PHONE_VERIFICATION_UNAVAILABLE` (and on `PHONE_NOT_VERIFIED` when `phoneJustVerified`, absorbing projection lag); terminal `TERMS_NOT_ACCEPTED` → `onNeedsTerms()`, terminal `PHONE_NOT_VERIFIED` → `onNeedsPhone()`.

- [ ] **Step 1: Create `components/widgets/lpo/finance-flow/offer-step.tsx`**

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/widgets/form-error";
import { getLpo } from "@/lib/actions/lpo-actions";
import {
  acceptOffer,
  getMyApplication,
} from "@/lib/actions/loan-applications-actions";
import {
  SUPPLIER_FINANCING_GATE_CODES,
  formatFeeRate,
  type SupplierFinancingQuote,
} from "@/types/loans/supplier-financing";
import { formatTzs } from "@/types/loans/type";
import type { LoanApplication } from "@/types/loans/applications";

const POLL_INTERVAL_MS = 1500;
const POLL_BUDGET_MS = 20_000;
/** acceptOffer backoff on retryable gate codes — 2+3+4 = 9s ≤ the spec's 10s cap. */
const ACCEPT_RETRY_DELAYS_MS = [2000, 3000, 4000];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

type OfferPhase =
  | { kind: "locating" }
  | { kind: "deciding" }
  | { kind: "review" }
  | { kind: "offer"; application: LoanApplication }
  | { kind: "declined"; reason: string | null }
  | { kind: "timeout" }
  | { kind: "accepted"; application: LoanApplication };

/**
 * Step 3 of the finance-flow modal. The application is minted ASYNC by the
 * LMS consumer after start-financing publishes SUPPLIER_ORDER_CREATED, so
 * this step first polls the LPO for `loanApplicationId` (~1.5s, ≤20s), then
 * the application itself until a decision state (spec §3.4):
 *  - APPROVED  → real offer from `offerQuote`, Accept button.
 *  - IN_REVIEW → honest "offer being prepared" state (COMPLIANCE_HOLD is
 *                masked to IN_REVIEW on the borrower wire — no-tipping-off).
 *  - REJECTED  → friendly decline (`declineReason`).
 *  - ACCEPTED  → straight to the accepted state (resume after re-open).
 * Timeout is not a failure: closing the modal is safe, the banner resumes.
 */
export function OfferStep({
  lpoId,
  initialApplicationId,
  canApply,
  phoneJustVerified,
  eligibilityQuote,
  onAccepted,
  onNeedsTerms,
  onNeedsPhone,
}: {
  lpoId: string;
  initialApplicationId: string | null;
  canApply: boolean;
  phoneJustVerified: boolean;
  eligibilityQuote: SupplierFinancingQuote | null;
  onAccepted: (application: LoanApplication) => void;
  onNeedsTerms: () => void;
  onNeedsPhone: () => void;
}) {
  const [phase, setPhase] = useState<OfferPhase>({ kind: "locating" });
  const [retryNonce, setRetryNonce] = useState(0);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [accepting, startAccept] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: "locating" });

    const run = async () => {
      // Phase 1 — locate the application the event loop minted.
      let applicationId = initialApplicationId;
      if (!applicationId) {
        const deadline = Date.now() + POLL_BUDGET_MS;
        while (!cancelled && Date.now() < deadline) {
          const lpo = await getLpo(lpoId).catch(() => null);
          if (lpo?.loanApplicationId) {
            applicationId = lpo.loanApplicationId;
            break;
          }
          await sleep(POLL_INTERVAL_MS);
        }
      }
      if (cancelled) return;
      if (!applicationId) {
        setPhase({ kind: "timeout" });
        return;
      }

      // Phase 2 — wait for a decision state on the application.
      setPhase({ kind: "deciding" });
      const deadline = Date.now() + POLL_BUDGET_MS;
      while (!cancelled) {
        const app = await getMyApplication(applicationId).catch(() => null);
        if (cancelled) return;
        if (app) {
          if (app.status === "APPROVED") {
            setPhase({ kind: "offer", application: app });
            return;
          }
          if (app.status === "ACCEPTED") {
            setPhase({ kind: "accepted", application: app });
            return;
          }
          if (app.status === "REJECTED") {
            setPhase({ kind: "declined", reason: app.declineReason });
            return;
          }
          if (app.status === "IN_REVIEW" || app.status === "COMPLIANCE_HOLD") {
            setPhase({ kind: "review" });
            return;
          }
          // DRAFT/SUBMITTED — auto-decisioning still running; keep polling.
        }
        if (Date.now() >= deadline) {
          setPhase({ kind: "timeout" });
          return;
        }
        await sleep(POLL_INTERVAL_MS);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [lpoId, initialApplicationId, retryNonce]);

  const handleAccept = (application: LoanApplication) => {
    setAcceptError(null);
    startAccept(async () => {
      let res = await acceptOffer(application.id);
      for (const delayMs of ACCEPT_RETRY_DELAYS_MS) {
        if (res.responseType === "success") break;
        const code = res.errorCode;
        const retryable =
          code === SUPPLIER_FINANCING_GATE_CODES.PHONE_VERIFICATION_UNAVAILABLE ||
          // Right after in-modal OTP success, the Accounts PHONE_VERIFIED
          // projection may not have landed yet — the gate then reads
          // phoneVerified=false. Retry instead of bouncing the user back
          // to a step they just completed.
          (code === SUPPLIER_FINANCING_GATE_CODES.PHONE_NOT_VERIFIED &&
            phoneJustVerified);
        if (!retryable) break;
        await sleep(delayMs);
        res = await acceptOffer(application.id);
      }

      if (res.responseType === "success") {
        const accepted =
          res.data ?? { ...application, status: "ACCEPTED" as const };
        setPhase({ kind: "accepted", application: accepted });
        onAccepted(accepted);
        return;
      }
      if (res.errorCode === SUPPLIER_FINANCING_GATE_CODES.TERMS_NOT_ACCEPTED) {
        onNeedsTerms();
        return;
      }
      if (res.errorCode === SUPPLIER_FINANCING_GATE_CODES.PHONE_NOT_VERIFIED) {
        onNeedsPhone();
        return;
      }
      // Everything else (OFFER_EXPIRED, conflicts, transport) — surface the
      // backend's message and re-poll so a stale offer re-renders truthfully.
      setAcceptError(res.message);
      setRetryNonce((n) => n + 1);
    });
  };

  if (phase.kind === "locating" || phase.kind === "deciding") {
    return (
      <WaitingPanel
        title={
          phase.kind === "locating"
            ? "Setting up your financing request…"
            : "Preparing your offer…"
        }
        detail="This usually takes a few seconds. You can close this window — your progress is saved and the order page will show the latest state."
      />
    );
  }

  if (phase.kind === "timeout") {
    return (
      <div className="space-y-4">
        <WaitingPanel
          title="Still working on it"
          detail="Your request was submitted, but the decision is taking longer than usual. Check again, or close this window — the order page tracks progress."
          still
        />
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={() => setRetryNonce((n) => n + 1)}
        >
          Check again
        </Button>
      </div>
    );
  }

  if (phase.kind === "review") {
    return (
      <StatePanel
        icon={<Clock3 className="h-5 w-5" />}
        tone="warn"
        title="Your offer is being prepared"
        detail="This request needs a quick review by the Settlo team. We'll notify you as soon as a decision is ready — you can close this window."
      />
    );
  }

  if (phase.kind === "declined") {
    return (
      <StatePanel
        icon={<XCircle className="h-5 w-5" />}
        tone="neg"
        title="Financing wasn't approved this time"
        detail={
          phase.reason ??
          "This order doesn't qualify for financing right now. You can pay the supplier directly."
        }
      />
    );
  }

  if (phase.kind === "accepted") {
    return (
      <div className="rounded-xl border border-pos/30 bg-pos-tint p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-pos text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[14.5px] font-semibold leading-relaxed text-ink">
              Offer accepted — Settlo is paying your supplier directly.
            </div>
            <p className="mt-1 text-xs text-ink-2">
              You&apos;ll be notified when the payment lands. Track every step
              in the financing card on this order.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // phase.kind === "offer"
  const { application } = phase;
  const quote = application.offerQuote ?? null;
  const totalRepayable = quote?.totalRepayable ?? null;
  const financed = quote?.financedAmount ?? application.approvedAmount;
  const termDays = quote?.termDays ?? application.approvedTermDays;
  const limitAfter = eligibilityQuote?.limitAfter ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary-light text-primary-dark">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">Your offer</div>
          <div className="text-xs text-muted-foreground">
            {quote?.offerExpiresAt
              ? `Valid until ${formatDate(quote.offerExpiresAt)}`
              : "Review the terms and accept to continue"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-canvas/60 p-4 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
          Total repayable
        </div>
        <div className="mt-1 text-[26px] font-bold tracking-tight text-primary-dark">
          {totalRepayable != null ? formatTzs(totalRepayable) : formatTzs(financed)}
        </div>
        {quote?.indicativeDueDate && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            due around {formatDate(quote.indicativeDueDate)}
          </div>
        )}
      </div>

      <div className="divide-y divide-line rounded-xl border border-line">
        <QuoteRow label="Settlo pays your supplier" value={formatTzs(financed)} />
        {quote && (
          <QuoteRow
            label={`One-time fee (${formatFeeRate(quote.feeRate)})`}
            value={formatTzs(quote.feeAmount)}
          />
        )}
        <QuoteRow
          label="Term"
          value={termDays != null ? `${termDays} days` : "—"}
        />
        {limitAfter != null && (
          <QuoteRow
            label="Financing limit after this order"
            value={formatTzs(limitAfter)}
          />
        )}
      </div>

      {acceptError && <FormError message={acceptError} />}

      {canApply ? (
        <>
          <Button
            className="w-full justify-center"
            disabled={accepting}
            onClick={() => handleAccept(application)}
          >
            {accepting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            Accept offer
          </Button>
          <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
            By accepting you agree to repay{" "}
            {totalRepayable != null ? formatTzs(totalRepayable) : "the amount above"}{" "}
            under the supplier financing terms you accepted.
          </p>
        </>
      ) : (
        <div className="flex gap-2.5 rounded-xl bg-canvas p-3.5 text-[12.5px] leading-relaxed text-ink-3">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 text-ink-2" />
          <div>
            You can view this offer, but accepting it needs the{" "}
            <b className="font-semibold text-ink-2">loans:apply</b> permission.
            Ask an account owner to accept it, or request access.
          </div>
        </div>
      )}
    </div>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[12.5px] text-ink-2">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}

function WaitingPanel({
  title,
  detail,
  still,
}: {
  title: string;
  detail: string;
  still?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-canvas/60 px-4 py-8 text-center">
      {still ? (
        <Clock3 className="h-6 w-6 text-ink-3" />
      ) : (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      )}
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
  );
}

function StatePanel({
  icon,
  tone,
  title,
  detail,
}: {
  icon: React.ReactNode;
  tone: "warn" | "neg";
  title: string;
  detail: string;
}) {
  return (
    <div
      className={
        tone === "warn"
          ? "flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-tint p-5 text-warn"
          : "flex items-start gap-3 rounded-xl border border-neg/30 bg-neg-tint p-5 text-neg"
      }
    >
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-[14px] font-semibold text-ink">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-ink-2">{detail}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/widgets/lpo/finance-flow/offer-step.tsx`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/widgets/lpo/finance-flow/offer-step.tsx
git commit -m "feat(financing): finance-flow offer step — decision polling and accept with gate-code retry

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: FinanceFlowModal shell — step orchestration and resume

**Files:**
- Create: `components/widgets/lpo/finance-flow/finance-flow-modal.tsx`

**Interfaces:**
- Consumes: `TermsStep` (Task 5), `PhoneStep` (Task 6), `OfferStep` (Task 7); actions `getFinancingTerms`, `acceptFinancingTerms` (Task 2), `startLpoFinancing` (Task 3), `getPhoneStatus` (existing, `lib/actions/phone-actions`); types `FinancingTermsStatus`, `SUPPLIER_FINANCING_GATE_CODES`, `SupplierFinancingQuote` (Task 1), `Lpo`, `PhoneStatus`.
- Produces (imported by Task 9):
  - `function FinanceFlowModal(props: { lpo: Lpo; open: boolean; onOpenChange: (open: boolean) => void; canApply: boolean; eligibilityQuote: SupplierFinancingQuote | null; resumeApplicationId: string | null }): JSX.Element`
  - Behavior contract: on open it loads terms + phone status; skips Terms when already accepted (start-financing fires on open, spec §3.2); skips Verify phone when `phoneVerified`; `resumeApplicationId != null` skips terms/start entirely and resumes at phone/offer. Calls `router.refresh()` when closed after any state-changing progress.

- [ ] **Step 1: Create `components/widgets/lpo/finance-flow/finance-flow-modal.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/widgets/form-error";
import { cn } from "@/lib/utils";
import {
  acceptFinancingTerms,
  getFinancingTerms,
} from "@/lib/actions/loan-applications-actions";
import { startLpoFinancing } from "@/lib/actions/lpo-actions";
import { getPhoneStatus, type PhoneStatus } from "@/lib/actions/phone-actions";
import {
  SUPPLIER_FINANCING_GATE_CODES,
  type FinancingTermsStatus,
  type SupplierFinancingQuote,
} from "@/types/loans/supplier-financing";
import type { Lpo } from "@/types/lpo/type";

import { TermsStep } from "./terms-step";
import { PhoneStep } from "./phone-step";
import { OfferStep } from "./offer-step";

type FlowStep = "loading" | "terms" | "phone" | "offer" | "error";

const STEP_LABELS: { key: Exclude<FlowStep, "loading" | "error">; label: string }[] = [
  { key: "terms", label: "Terms" },
  { key: "phone", label: "Verify phone" },
  { key: "offer", label: "Offer" },
];

/**
 * Finance-this-order modal: Terms → Verify phone → Offer (spec §3).
 * Closing at ANY point is safe — terms acceptance and phone verification
 * are persisted account-level facts, and an in-flight application resumes
 * at the offer step next time (via `resumeApplicationId`).
 *
 * Step skipping on open:
 *  - resume (application exists): no terms, no start-financing — straight
 *    to phone (if unverified) or offer.
 *  - terms already accepted: start-financing fires immediately on open.
 *  - phone already verified: the phone step never mounts.
 */
export function FinanceFlowModal({
  lpo,
  open,
  onOpenChange,
  canApply,
  eligibilityQuote,
  resumeApplicationId,
}: {
  lpo: Lpo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canApply: boolean;
  eligibilityQuote: SupplierFinancingQuote | null;
  resumeApplicationId: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>("loading");
  const [terms, setTerms] = useState<FinancingTermsStatus | null>(null);
  const [phone, setPhone] = useState<PhoneStatus | null>(null);
  const [termsSubmitting, setTermsSubmitting] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [phoneJustVerified, setPhoneJustVerified] = useState(false);
  // True once anything server-side may have changed (financing started,
  // terms accepted, offer accepted) — closing then refreshes the page so
  // the banner and financing card re-render from fresh data.
  const [progressed, setProgressed] = useState(false);

  const startFinancing = useCallback(async (): Promise<boolean> => {
    const res = await startLpoFinancing(lpo.id);
    if (res.responseType === "error") {
      setFlowError(res.message);
      setStep("error");
      return false;
    }
    setProgressed(true);
    return true;
  }, [lpo.id]);

  // Entry sequencing on every open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStep("loading");
    setTermsError(null);
    setFlowError(null);

    void (async () => {
      const [termsRes, phoneRes] = await Promise.all([
        getFinancingTerms(),
        getPhoneStatus(),
      ]);
      if (cancelled) return;
      setTerms(termsRes);
      const phoneStatus =
        phoneRes.responseType === "success" ? (phoneRes.data ?? null) : null;
      setPhone(phoneStatus);

      if (!termsRes) {
        setFlowError(
          "Couldn't load the financing terms. Close this window and try again.",
        );
        setStep("error");
        return;
      }

      const resuming = Boolean(resumeApplicationId);
      if (!resuming && !termsRes.accepted) {
        setStep("terms");
        return;
      }
      if (!resuming) {
        // Terms already accepted → start-financing fires on open (§3.2).
        const started = await startFinancing();
        if (!started || cancelled) return;
      }
      // Fail-open to the phone step when the status read failed — sending
      // works by userId, and a verified user just re-verifies harmlessly
      // rather than being blocked.
      setStep(phoneStatus?.phoneVerified ? "offer" : "phone");
    })();

    return () => {
      cancelled = true;
    };
    // Rerun only when the modal (re)opens — resume state is read fresh then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAgree = () => {
    if (!terms) return;
    setTermsError(null);
    setTermsSubmitting(true);
    void (async () => {
      const res = await acceptFinancingTerms(terms.currentVersion);
      if (res.responseType === "error") {
        setTermsSubmitting(false);
        if (
          res.errorCode === SUPPLIER_FINANCING_GATE_CODES.TERMS_VERSION_STALE
        ) {
          const fresh = await getFinancingTerms();
          if (fresh) setTerms(fresh);
          setTermsError(
            "The terms were updated — please review and accept the latest version.",
          );
          return;
        }
        setTermsError(res.message);
        return;
      }
      setProgressed(true);
      const started = await startFinancing();
      setTermsSubmitting(false);
      if (!started) return;
      setStep(phone?.phoneVerified ? "offer" : "phone");
    })();
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen && progressed) {
      router.refresh();
    }
  };

  const activeIndex =
    step === "terms" ? 0 : step === "phone" ? 1 : step === "offer" ? 2 : -1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Finance this order</DialogTitle>
        </DialogHeader>

        {/* Stepper — Terms / Verify phone / Offer */}
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((s, i) => {
            const state =
              activeIndex === -1
                ? "todo"
                : i < activeIndex
                  ? "done"
                  : i === activeIndex
                    ? "now"
                    : "todo";
            return (
              <div key={s.key} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                    state === "done"
                      ? "bg-pos text-white"
                      : state === "now"
                        ? "bg-primary text-white"
                        : "border border-line-2 bg-canvas text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    state === "todo" ? "text-muted-foreground" : "text-ink",
                  )}
                >
                  {s.label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <span className="h-px flex-1 bg-line" />
                )}
              </div>
            );
          })}
        </div>

        {step === "loading" && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking your financing setup…
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 py-2">
            <FormError
              message={flowError ?? "Something went wrong. Please try again."}
            />
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => handleClose(false)}
            >
              Close
            </Button>
          </div>
        )}

        {step === "terms" && terms && (
          <TermsStep
            termsVersion={terms.currentVersion}
            submitting={termsSubmitting}
            error={termsError}
            onAgree={handleAgree}
          />
        )}

        {step === "phone" && (
          <PhoneStep
            phoneNumber={phone?.phoneNumber ?? null}
            onVerified={() => {
              setPhoneJustVerified(true);
              setStep("offer");
            }}
          />
        )}

        {step === "offer" && (
          <OfferStep
            lpoId={lpo.id}
            initialApplicationId={
              resumeApplicationId ?? lpo.loanApplicationId ?? null
            }
            canApply={canApply}
            phoneJustVerified={phoneJustVerified}
            eligibilityQuote={eligibilityQuote}
            onAccepted={() => setProgressed(true)}
            onNeedsTerms={() => {
              // The gate said terms are missing (e.g. version bumped since
              // this account accepted) — reload and re-show the terms step.
              void (async () => {
                const fresh = await getFinancingTerms();
                if (fresh) setTerms(fresh);
                setStep("terms");
              })();
            }}
            onNeedsPhone={() => setStep("phone")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/widgets/lpo/finance-flow/finance-flow-modal.tsx`
Expected: clean (the single `eslint-disable-next-line react-hooks/exhaustive-deps` is deliberate and commented).

- [ ] **Step 3: Commit**

```bash
git add components/widgets/lpo/finance-flow/finance-flow-modal.tsx
git commit -m "feat(financing): finance-flow modal shell — step orchestration, skip logic, safe resume

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: FinancingBanner + purchase-order page mount

**Files:**
- Create: `components/widgets/lpo/financing-banner.tsx`
- Modify: `app/(protected)/purchase-orders/[id]/page.tsx`

**Interfaces:**
- Consumes: `FinanceFlowModal` (Task 8), `getSupplierFinancingEligibility` (Task 2), `getMyApplication` (existing), `LOANS_ENABLED` (`@/lib/loans/config`), `getLoanAccess` (`@/lib/loans/access`), types from Task 1, `Skeleton`, `Button`, `Money`, `formatTzs`, `formatFeeRate`.
- Produces (used by Task 10's page edit, which appends props to the same page):
  - `function FinancingBanner(props: { lpo: Lpo; application: LoanApplication | null; canApply: boolean }): JSX.Element | null` — self-gates on acknowledgement/status; the page gates on `LOANS_ENABLED` + `loans:read` before mounting.
  - Page-level pattern: `const loanAccess = LOANS_ENABLED ? await getLoanAccess() : null;` / `const showFinancing = Boolean(LOANS_ENABLED && loanAccess?.canRead);` / `const application = …` — Task 10 extends this same block with the financing-terms fetch.

State precedence (spec §7, implemented top-down):
1. `financingStatus === "PAID"` or application `ACCEPTED` → financed hero (compact success strip; the DETAILED 4-step tracker lives in the `FinancingCard` mounted directly below — Task 10 — so the two surfaces read as one block without duplicating the tracker).
2. Live application, non-terminal (`DRAFT`/`SUBMITTED`/`IN_REVIEW`/`COMPLIANCE_HOLD`) → in-progress strip; `APPROVED` → offer-ready strip with "Review offer" (opens modal at the offer step).
3. `REJECTED` application (or `financingStatus === "DECLINED"` with no readable application) → none-state with the stored friendly `declineReason`.
4. Otherwise (including `WITHDRAWN`/`EXPIRED`, which may re-qualify) → call eligibility → checking skeleton / eligible quote + "Finance this order" / none + reason / failed + "Re-run check". `eligible === null` with `existingApplicationId` renders as in-progress and the modal resumes from that application.

- [ ] **Step 1: Create `components/widgets/lpo/financing-banner.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Info,
  RefreshCcw,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupplierFinancingEligibility } from "@/lib/actions/loan-applications-actions";
import {
  formatFeeRate,
  type SupplierFinancingEligibility,
} from "@/types/loans/supplier-financing";
import { formatTzs } from "@/types/loans/type";
import type { LoanApplication } from "@/types/loans/applications";
import type { Lpo } from "@/types/lpo/type";

import { FinanceFlowModal } from "./finance-flow/finance-flow-modal";

type EligibilityFetch =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "done"; result: SupplierFinancingEligibility }
  | { kind: "failed" };

/**
 * Post-acceptance financing banner on the PO detail page (spec §7). The
 * page mounts it only when LOANS_ENABLED and the viewer holds loans:read;
 * the component additionally self-gates on the LPO being supplier-accepted
 * and open (APPROVED / PARTIALLY_RECEIVED). State precedence:
 * financed → live application → declined → live eligibility check.
 * The stateless eligibility endpoint is only called when no application
 * exists — an in-flight application renders from its own status instead.
 */
export function FinancingBanner({
  lpo,
  application,
  canApply,
}: {
  lpo: Lpo;
  application: LoanApplication | null;
  canApply: boolean;
}) {
  const bannerEligible =
    lpo.supplierAcknowledgement === "ACCEPTED" &&
    (lpo.status === "APPROVED" || lpo.status === "PARTIALLY_RECEIVED");

  const financingStatus = lpo.financingStatus ?? "NONE";
  const financed =
    financingStatus === "PAID" || application?.status === "ACCEPTED";
  const offerReady = !financed && application?.status === "APPROVED";
  const inProgress =
    !financed &&
    !offerReady &&
    ((application != null &&
      ["DRAFT", "SUBMITTED", "IN_REVIEW", "COMPLIANCE_HOLD"].includes(
        application.status,
      )) ||
      // The LPO carries an application we couldn't read (transient LMS
      // failure server-side) — show honest in-progress, not a fresh check.
      (application == null &&
        Boolean(lpo.loanApplicationId) &&
        financingStatus !== "DECLINED"));
  const declined =
    !financed &&
    !offerReady &&
    !inProgress &&
    (application?.status === "REJECTED" ||
      (application == null && financingStatus === "DECLINED"));
  const needsEligibility =
    bannerEligible && !financed && !offerReady && !inProgress && !declined;

  // Named `check`, not `fetch`, to avoid shadowing the global fetch.
  const [check, setCheck] = useState<EligibilityFetch>({ kind: "idle" });
  const [rerunNonce, setRerunNonce] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const rerun = useCallback(() => setRerunNonce((n) => n + 1), []);

  useEffect(() => {
    if (!needsEligibility) return;
    let cancelled = false;
    setCheck({ kind: "checking" });
    void (async () => {
      const result = await getSupplierFinancingEligibility(lpo.id);
      if (cancelled) return;
      setCheck(result ? { kind: "done", result } : { kind: "failed" });
    })();
    return () => {
      cancelled = true;
    };
  }, [needsEligibility, lpo.id, rerunNonce]);

  if (!bannerEligible) return null;

  const eligibility = check.kind === "done" ? check.result : null;
  const resumeApplicationId =
    application?.id ??
    lpo.loanApplicationId ??
    eligibility?.existingApplicationId ??
    null;

  let body: React.ReactNode;

  if (financed) {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-pos text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        }
        title={
          financingStatus === "PAID"
            ? "Settlo has paid your supplier"
            : "Financing accepted — Settlo is paying your supplier"
        }
        detail="Track every step in the financing card below."
        tone="pos"
      />
    );
  } else if (offerReady) {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-primary-light text-primary-dark">
            <Sparkles className="h-5 w-5" />
          </span>
        }
        title="Your financing offer is ready"
        detail="Review the amount, fee and term, then accept to have Settlo pay this supplier."
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Review offer
          </Button>
        }
      />
    );
  } else if (
    inProgress ||
    (eligibility && eligibility.eligible === null)
  ) {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-warn-tint text-warn">
            <Clock3 className="h-5 w-5" />
          </span>
        }
        title="Financing request in progress"
        detail="Settlo is reviewing this order. You'll be notified when there's a decision."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalOpen(true)}
          >
            View progress
          </Button>
        }
      />
    );
  } else if (declined) {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-canvas text-ink-3">
            <Info className="h-5 w-5" />
          </span>
        }
        title="Financing isn't available for this order"
        detail={
          application?.declineReason ??
          "This order didn't qualify for financing — you can pay the supplier directly."
        }
      />
    );
  } else if (check.kind === "checking" || check.kind === "idle") {
    body = (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
      </div>
    );
  } else if (check.kind === "failed") {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-canvas text-ink-3">
            <Info className="h-5 w-5" />
          </span>
        }
        title="Couldn't check financing for this order"
        detail="Something went wrong while checking eligibility."
        action={
          <Button size="sm" variant="outline" onClick={rerun}>
            <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            Re-run check
          </Button>
        }
      />
    );
  } else if (eligibility?.eligible && eligibility.quote) {
    const q = eligibility.quote;
    body = (
      <div className="space-y-3">
        <Strip
          icon={
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-primary-light text-primary-dark">
              <BadgeCheck className="h-5 w-5" />
            </span>
          }
          title="This order qualifies for Settlo financing"
          detail={`Settlo pays ${formatTzs(q.financedAmount, q.currency)} to your supplier; you repay ${formatTzs(q.totalRepayable, q.currency)} over ${q.termDays} days (one-time fee ${formatFeeRate(q.feeRate)}).`}
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={rerun}>
                <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                Re-run check
              </Button>
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                disabled={!canApply}
                title={
                  canApply
                    ? undefined
                    : "Requesting financing needs the loans:apply permission"
                }
              >
                <Wallet className="mr-1.5 h-3.5 w-3.5" />
                Finance this order
              </Button>
            </div>
          }
        />
        {!canApply && (
          <p className="text-[11.5px] text-muted-foreground">
            You can see this check, but requesting financing needs the{" "}
            <b className="font-medium text-ink-2">loans:apply</b> permission.
          </p>
        )}
      </div>
    );
  } else {
    // Fresh check came back not-eligible — friendly reason from the LMS.
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-canvas text-ink-3">
            <Info className="h-5 w-5" />
          </span>
        }
        title="Financing isn't available for this order"
        detail={
          eligibility?.reason ??
          "This order doesn't qualify for financing right now — you can pay the supplier directly."
        }
        action={
          <Button size="sm" variant="ghost" onClick={rerun}>
            <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            Re-run check
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-5 pb-5">{body}</CardContent>
      </Card>
      <FinanceFlowModal
        lpo={lpo}
        open={modalOpen}
        onOpenChange={setModalOpen}
        canApply={canApply}
        eligibilityQuote={eligibility?.quote ?? null}
        resumeApplicationId={resumeApplicationId}
      />
    </>
  );
}

function Strip({
  icon,
  title,
  detail,
  action,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  action?: React.ReactNode;
  tone?: "pos";
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {icon}
      <div className="min-w-0 flex-1">
        <div
          className={
            tone === "pos"
              ? "text-[14px] font-semibold text-pos"
              : "text-[14px] font-semibold text-ink"
          }
        >
          {title}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Mount on the PO detail page**

In `app/(protected)/purchase-orders/[id]/page.tsx`, add imports after the existing `import { FinancingCard } from "@/components/widgets/lpo/financing-card";`:

```tsx
import { FinancingBanner } from "@/components/widgets/lpo/financing-banner";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { getLoanAccess } from "@/lib/loans/access";
import { getMyApplication } from "@/lib/actions/loan-applications-actions";
import type { LoanApplication } from "@/types/loans/applications";
```

Then, inside `LpoDetailPage`, directly after `const supplier = suppliers.find((s) => s.id === lpo.supplierId) ?? null;`, add:

```tsx
  // ── Financing gating + context (spec §7) ─────────────────────────
  // Banner + modal render only for viewers with the loans module enabled
  // AND loans:read. The application (when one exists) is read here so the
  // banner renders in-progress / offer-ready / declined states without a
  // client round-trip; a transient LMS failure degrades to null (the banner
  // then shows honest in-progress off financingStatus alone).
  const loanAccess = LOANS_ENABLED ? await getLoanAccess() : null;
  const showFinancing = Boolean(LOANS_ENABLED && loanAccess?.canRead);
  const application: LoanApplication | null =
    showFinancing && lpo.loanApplicationId
      ? await getMyApplication(lpo.loanApplicationId).catch(() => null)
      : null;
```

Finally, in the JSX, replace:

```tsx
        <LpoShareAcknowledgement lpo={lpo} supplier={supplier} />

        <FinancingCard lpo={lpo} />
```

with:

```tsx
        <LpoShareAcknowledgement lpo={lpo} supplier={supplier} />

        {showFinancing && (
          <FinancingBanner
            lpo={lpo}
            application={application}
            canApply={loanAccess?.canApply ?? false}
          />
        )}

        <FinancingCard lpo={lpo} />
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/widgets/lpo/financing-banner.tsx --file "app/(protected)/purchase-orders/[id]/page.tsx"`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/widgets/lpo/financing-banner.tsx "app/(protected)/purchase-orders/[id]/page.tsx"
git commit -m "feat(financing): post-acceptance financing banner on the purchase-order page

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: FinancingCard tracker re-staged to the design's four steps

**Files:**
- Modify: `components/widgets/lpo/financing-card.tsx`
- Modify: `app/(protected)/purchase-orders/[id]/page.tsx` (pass the two new props)

**Interfaces:**
- Consumes: `getFinancingTerms` (Task 2), `FinancingTermsStatus` (Task 1), `ApplicationStatus` type; page-level `showFinancing`/`application` block from Task 9.
- Produces:
  - `FinancingCard` props widen to `{ lpo: Lpo; termsAcceptedAt?: string | null; applicationStatus?: ApplicationStatus | null }` — both new props optional so other/legacy mounts stay valid.
  - `FINANCING_BADGE_VARIANT` export is UNCHANGED (name, type `Record<OrderFinancingStatus, BadgeProps["variant"]>`, values) — `components/tables/lpo/columns.tsx` keeps importing it.

New stage semantics (spec §7): *Supplier accepted* = `lpo.acknowledgedAt`; *Terms accepted* = financing-terms `acceptedAt` (account-level); *Offer accepted* = application `ACCEPTED`; *Supplier paid* = `financingStatus === "PAID"`, with the "Now" pill sitting on *Supplier paid* while the payout settles between accept and paid. Grandfathered create-time-financed LPOs (no terms acceptance, `OFFER_MADE` badge) index off `financingStatus` so they still render sensibly.

- [ ] **Step 1: Re-stage the STAGES array**

In `components/widgets/lpo/financing-card.tsx`, replace the whole `STAGES` constant:

```ts
const STAGES: { title: string; detail: string }[] = [
  {
    title: "Awaiting supplier acceptance",
    detail: "The supplier must accept the order before financing begins.",
  },
  {
    title: "Underwriting",
    detail: "Settlo is reviewing the financing request.",
  },
  {
    title: "Offer ready",
    detail: "Review and accept the loan terms on the Loans page.",
  },
  {
    title: "Paid",
    detail: "Settlo has paid the supplier on your behalf.",
  },
];
```

with:

```ts
const STAGES: { title: string; detail: string }[] = [
  {
    title: "Supplier accepted",
    detail: "The supplier confirmed this order — financing can begin.",
  },
  {
    title: "Terms accepted",
    detail: "You agreed to the Settlo supplier financing terms.",
  },
  {
    title: "Offer accepted",
    detail: "You accepted the financing offer for this order.",
  },
  {
    title: "Supplier paid",
    detail: "Settlo pays the supplier on your behalf.",
  },
];
```

- [ ] **Step 2: Widen the component props and thread them through**

Add the import at the top of the file, after the existing `types/lpo/type` import:

```ts
import type { ApplicationStatus } from "@/types/loans/applications";
```

Change the component signature from:

```tsx
export function FinancingCard({ lpo }: { lpo: Lpo }) {
```

to:

```tsx
export function FinancingCard({
  lpo,
  termsAcceptedAt = null,
  applicationStatus = null,
}: {
  lpo: Lpo;
  /** Account-level financing-terms acceptance timestamp (null = not accepted / unknown). */
  termsAcceptedAt?: string | null;
  /** Borrower-read status of the backing loan application, when readable. */
  applicationStatus?: ApplicationStatus | null;
}) {
```

Then change the `FinancingTimeline` call from:

```tsx
          <FinancingTimeline
            ack={lpo.supplierAcknowledgement}
            financingStatus={financingStatus}
          />
```

to:

```tsx
          <FinancingTimeline
            ack={lpo.supplierAcknowledgement}
            financingStatus={financingStatus}
            termsAcceptedAt={termsAcceptedAt}
            applicationStatus={applicationStatus}
          />
```

- [ ] **Step 3: Re-derive `stageIndex` in `FinancingTimeline`**

Replace the whole `FinancingTimeline` function signature and `stageIndex` block:

```tsx
function FinancingTimeline({
  ack,
  financingStatus,
}: {
  ack: SupplierAcknowledgement;
  financingStatus: OrderFinancingStatus;
}) {
  // Current stage index into STAGES. Supplier acceptance gates everything
  // else, so it's checked first. The backend resolves financingStatus
  // synchronously in the same transaction as acceptance (REQUESTED, or
  // DECLINED if the mint didn't happen) — by the time `ack` is ACCEPTED and
  // we're rendering the timeline (DECLINED/CANCELLED are handled by the
  // caller before this component is reached), financingStatus can only be
  // REQUESTED, OFFER_MADE, or PAID.
  const stageIndex = (() => {
    if (ack === "PENDING") return 0;
    if (financingStatus === "OFFER_MADE") return 2;
    if (financingStatus === "PAID") return STAGES.length; // past the last — all done
    return 1; // REQUESTED
  })();
```

with:

```tsx
function FinancingTimeline({
  ack,
  financingStatus,
  termsAcceptedAt,
  applicationStatus,
}: {
  ack: SupplierAcknowledgement;
  financingStatus: OrderFinancingStatus;
  termsAcceptedAt: string | null;
  applicationStatus: ApplicationStatus | null;
}) {
  // Current stage index into STAGES (design's four post-acceptance steps).
  // Supplier acceptance gates everything, so it's checked first (only
  // grandfathered create-time-financed LPOs can render this timeline while
  // still PENDING). Between offer-accept and PAID the payout is settling —
  // "Supplier paid" carries the "Now" pill (index 3). Terms acceptance is
  // an account-level fact; when it's unknown/null on a grandfathered
  // OFFER_MADE row, financingStatus alone advances the index so legacy
  // rows don't appear stuck on a step that never existed for them.
  const stageIndex = (() => {
    if (ack === "PENDING") return 0;
    if (financingStatus === "PAID") return STAGES.length; // past the last — all done
    if (applicationStatus === "ACCEPTED") return 3; // settling — "Now" on Supplier paid
    if (termsAcceptedAt || financingStatus === "OFFER_MADE") return 2;
    return 1;
  })();
```

The rest of `FinancingTimeline` (the render loop) is untouched.

- [ ] **Step 4: Fetch terms server-side and pass both props from the page**

In `app/(protected)/purchase-orders/[id]/page.tsx`, extend the imports added in Task 9:

```tsx
import {
  getMyApplication,
  getFinancingTerms,
} from "@/lib/actions/loan-applications-actions";
```

(replacing the Task 9 single-name import of `getMyApplication`).

Extend the financing block added in Task 9 — after the `const application …` statement, add:

```tsx
  // Terms acceptance drives the "Terms accepted" tracker stage on the
  // financing card; only worth a call once the LPO is actually financed.
  const financingTerms =
    showFinancing && lpo.paymentMethod === "SETTLO_FINANCING"
      ? await getFinancingTerms()
      : null;
```

Then change the card mount from:

```tsx
        <FinancingCard lpo={lpo} />
```

to:

```tsx
        <FinancingCard
          lpo={lpo}
          termsAcceptedAt={financingTerms?.acceptedAt ?? null}
          applicationStatus={application?.status ?? null}
        />
```

- [ ] **Step 5: Verify the badge export contract still holds**

Run: `rg -n "FINANCING_BADGE_VARIANT" components/tables/lpo/columns.tsx components/widgets/lpo/financing-card.tsx`
Expected: the import in `columns.tsx` and the unchanged `export const FINANCING_BADGE_VARIANT` in `financing-card.tsx` both still present.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/widgets/lpo/financing-card.tsx --file "app/(protected)/purchase-orders/[id]/page.tsx"`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add components/widgets/lpo/financing-card.tsx "app/(protected)/purchase-orders/[id]/page.tsx"
git commit -m "feat(financing): re-stage financing tracker to supplier-accepted/terms/offer/paid

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Create-form cleanup — retire the create-time financing choice

**Files:**
- Modify: `components/forms/lpo-form.tsx`
- Modify: `types/lpo/schema.ts`
- Modify: `types/lpo/type.ts`
- Modify: `lib/actions/lpo-actions.ts` (remove `getSupplierFinancingPreview`)
- Delete: `components/widgets/lpo/financing-option-card.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `CreateLpoSchema` no longer carries `paymentMethod`/`financedAmount` (create payload is always DIRECT — the backend rejects create-time `SETTLO_FINANCING` per spec §5.3 and defaults a missing method to DIRECT); `getSupplierFinancingPreview` no longer exists (its only consumer was the deleted card). `getSupplierOrderLpoId`, `startLpoFinancing` and everything else in `lpo-actions.ts` are untouched.

- [ ] **Step 1: Strip the financing state from `components/forms/lpo-form.tsx`**

Make these removals (the form's structure is otherwise untouched):

1. Delete the import block:

```tsx
import FinancingOptionCard, {
  type FinancingCardValue,
} from "../widgets/lpo/financing-option-card";
```

2. Delete `Wallet,` from the `lucide-react` import list (it was only used by the Payment section header).

3. Delete the supplier-tracking state and its wiring — remove:

```tsx
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
```

and in the `SupplierSelector` JSX remove the line:

```tsx
                        onSupplierSelected={setSelectedSupplier}
```

then remove the now-unused `import type { Supplier } from "@/types/supplier/type";`.

4. In `useForm` defaultValues, delete the line:

```tsx
      paymentMethod: "DIRECT",
```

5. Delete the financing change-handler and derived state — remove all of:

```tsx
  const handleFinancingChange = useCallback(
    (next: FinancingCardValue) => {
      form.setValue("paymentMethod", next.paymentMethod, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("financedAmount", next.financedAmount, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const paymentMethod = form.watch("paymentMethod") ?? "DIRECT";
  const financedAmount = form.watch("financedAmount");
  const financingErrorMessage =
    form.formState.errors.financedAmount?.message ??
    form.formState.errors.paymentMethod?.message;
```

6. Delete the entire `STEP 03` Payment `<section className={styles.formCard}>…</section>` (the one whose header reads "Payment" / "Settle this order directly with the supplier, or pay with Settlo financing if they're linked." and whose body renders `<FinancingOptionCard …/>` and the `financingErrorMessage` paragraph).

- [ ] **Step 2: Simplify `CreateLpoSchema` in `types/lpo/schema.ts`**

Replace:

```ts
export const CreateLpoSchema = z
  .object({
    supplierId: z
      .string({ required_error: "Supplier is required" })
      .uuid("Supplier is required"),
    notes: z.string().optional(),
    items: z.array(CreateLpoItemSchema).min(1, "Add at least one item"),
    paymentMethod: z.enum(["DIRECT", "SETTLO_FINANCING"]).optional(),
    financedAmount: z.coerce.number().positive().optional(),
  })
  // Mirrors the backend: CreateLpoRequest.financedAmount is "rejected outright
  // on a DIRECT (or unset) payment method" — only meaningful alongside
  // SETTLO_FINANCING, where omitting it just requests full financing.
  .superRefine((data, ctx) => {
    if (
      data.financedAmount !== undefined &&
      data.paymentMethod !== "SETTLO_FINANCING"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financedAmount"],
        message:
          "Financed amount can only be set when paying via Settlo financing",
      });
    }
  });
```

with:

```ts
// Create-time financing is retired (2026-08-03 LPO-financing design, D1):
// the backend rejects SETTLO_FINANCING at POST /api/v1/lpos, and financing
// is requested from the order page after supplier acceptance. New LPOs are
// always DIRECT — the payload simply omits paymentMethod and the backend
// defaults it.
export const CreateLpoSchema = z.object({
  supplierId: z
    .string({ required_error: "Supplier is required" })
    .uuid("Supplier is required"),
  notes: z.string().optional(),
  items: z.array(CreateLpoItemSchema).min(1, "Add at least one item"),
});
```

- [ ] **Step 3: Drop the retired fields from `CreateLpoPayload` in `types/lpo/type.ts`**

Replace:

```ts
export interface CreateLpoPayload {
  supplierId: string;
  locationType: DestinationType;
  notes?: string;
  items: CreateLpoItemPayload[];
  /** Null/omitted defaults to DIRECT server-side — only SETTLO_FINANCING triggers the financing-eligibility checks. */
  paymentMethod?: LpoPaymentMethod;
  /** Only meaningful with paymentMethod SETTLO_FINANCING. Omitted requests full financing of the order. */
  financedAmount?: number;
}
```

with:

```ts
export interface CreateLpoPayload {
  supplierId: string;
  locationType: DestinationType;
  notes?: string;
  items: CreateLpoItemPayload[];
  // paymentMethod / financedAmount are deliberately absent: create-time
  // financing is retired (D1) — omitting the method makes the backend
  // default to DIRECT, and financing is opted into post-acceptance via
  // POST /api/v1/lpos/{id}/financing.
}
```

- [ ] **Step 4: Retire `getSupplierFinancingPreview` and update the create comment in `lib/actions/lpo-actions.ts`**

1. Delete the whole `getSupplierFinancingPreview` function together with its doc comment (the block starting `/** * Merchant-facing soft signal for the pay-via-Settlo LPO form: …` down to its closing `}`). `startLpoFinancing` (Task 3) and `getSupplierOrderLpoId` stay.

2. In `createLpo`, replace the stale payload comment:

```ts
  const payload: CreateLpoPayload = {
    // paymentMethod / financedAmount pass through here when present — the
    // schema only allows financedAmount alongside SETTLO_FINANCING, and the
    // backend defaults a missing/undefined paymentMethod to DIRECT.
    ...validated.data,
```

with:

```ts
  const payload: CreateLpoPayload = {
    // Always DIRECT: create-time financing is retired (D1). The schema no
    // longer carries paymentMethod/financedAmount, so the backend defaults
    // the method; financing is opted into post-acceptance on the order page.
    ...validated.data,
```

- [ ] **Step 5: Delete the card and confirm nothing else references the removed pieces**

```bash
git rm components/widgets/lpo/financing-option-card.tsx
```

Run: `rg -n "financing-option-card|FinancingOptionCard|getSupplierFinancingPreview|FinancingCardValue" --glob '!docs/**'`
Expected: the ONLY remaining hit is the historical mention inside the `getPreQualification` doc comment in `lib/actions/loan-applications-actions.ts`. Update that comment's first sentence — replace:

```ts
 * Deliberately does NOT use `rethrowIfBoundary` — unlike the rest of this
 * file, this action's callers span permission-diverse personas.
 * `financing-option-card.tsx` calls it for anyone opening the LPO form,
 * including purchasing-only staff with no `loans:apply`, so a FORBIDDEN here
 * is an expected outcome, not an exceptional one. That caller also awaits
 * this inside a bare `Promise.all` with no boundary around it, so rethrowing
 * would surface as an unhandled rejection that leaves its loading flags
 * spinning forever instead of resolving to the "couldn't check eligibility"
 * fallback. Catch everything and return `null`.
```

with:

```ts
 * Deliberately does NOT use `rethrowIfBoundary` — unlike the rest of this
 * file, this action's callers span permission-diverse personas (it has been
 * called from permissionless surfaces such as the retired LPO create-form
 * financing card), so a FORBIDDEN here is an expected outcome, not an
 * exceptional one. Catch everything and return `null`.
```

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors (this catches any missed reference to the deleted card/fields).

Run: `npx next lint --file components/forms/lpo-form.tsx --file types/lpo/schema.ts --file types/lpo/type.ts --file lib/actions/lpo-actions.ts --file lib/actions/loan-applications-actions.ts`
Expected: clean — in particular no unused-import warnings left in `lpo-form.tsx`.

- [ ] **Step 7: Commit**

```bash
git add -A components/forms/lpo-form.tsx types/lpo/schema.ts types/lpo/type.ts lib/actions/lpo-actions.ts lib/actions/loan-applications-actions.ts components/widgets/lpo/financing-option-card.tsx
git commit -m "feat(financing): retire create-time financing choice — LPO creation is always DIRECT

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Full verification — typecheck, lint, production build

**Files:**
- No source changes expected (fixes only if verification fails).

**Interfaces:**
- Consumes: everything above.
- Produces: a green tree ready for review/merge.

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Expected: "No ESLint warnings or errors" (or pre-existing warnings only — nothing referencing the files this plan touched).

- [ ] **Step 3: Production build (memory-boosted)**

The clean `next build` OOMs at default heap; it needs the bumped heap. If a previous build was killed mid-way, the `.next` cache can be corrupted (`/_document` PageNotFoundError) — remove it first.

```bash
rm -rf .next
NODE_OPTIONS=--max-old-space-size=8192 npm run build
echo "exit: $?"
test -f .next/BUILD_ID && echo "BUILD_ID present"
```

Expected: unpiped exit code 0 and `BUILD_ID present`. Do not pipe the build output through anything that could mask the exit code.

- [ ] **Step 4: Fix-forward if anything failed**

Any failure gets fixed in the file that owns it and amended into a small `fix(financing): …` commit — do not weaken types or delete checks to get green.

- [ ] **Step 5: Manual visual pass (human checkpoint)**

Compare against the design source (claude.ai/design project `019dd974-e60d-78f5-9a35-a8ae67b2f90a`, `Settlo LPO Financing.html` + `lpo-financing.jsx`):
- Banner: checking skeleton → eligible (quote line + "Finance this order" + "Re-run check") → none (reason) → financed hero; in-progress and offer-ready strips for live applications.
- Modal: Terms (scrollable 8-clause copy, checkbox, Agree & continue) → Verify phone (masked number, Send code, 6 OTP boxes, resend countdown, Change link) → Offer (total-repayable hero, fee/term/limit-after rows, Accept). Terms wording may be aligned to the design sheet here — clause count and semantics must not change (bump requires an LMS version change).
- Tracker: Supplier accepted → Terms accepted → Offer accepted → Supplier paid, "Now" pill on Supplier paid while settling.
- Create form: no payment section; LPO creates as DIRECT.
- Everything renders with repo tokens in both light and dark themes.

- [ ] **Step 6: Commit (only if fixes were made)**

```bash
git add -A
git commit -m "fix(financing): post-verification polish for the LPO financing flow

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
