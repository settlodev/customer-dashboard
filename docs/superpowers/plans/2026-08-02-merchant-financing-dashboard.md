# Merchant Financing Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The merchant-facing pay-via-Settlo flow: a payment card on LPO creation (full/partial financing with soft limit signals), a financing timeline on the purchase order, the payment split on the supplier's public accept page, and the borrower application pages with real offer acceptance.

**Architecture:** Extends the existing LPO form/detail and adds the missing borrower half of the loans module against real LMS endpoints (`/loan-applications/mine`, `/{id}/accept`, `/pre-qualification`). New server actions call real endpoints directly (no mock flags); the legacy mock-flagged loans surfaces are untouched. All soft eligibility signals warn, never block — server gates are authoritative.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, zod, react-hook-form, Tailwind/shadcn.

**Spec:** `/Users/Peter/Settlo/Settlo Loan Management Service/docs/superpowers/specs/2026-08-02-supplier-financing-dashboard-design.md` §3. **Depends on** the Inventory + LMS delta plans being merged (they are, if you're reading this after 2026-08-02).

## Global Constraints

- Repo `/Users/Peter/Settlo/Customer-Dashboard` (npm). Per task: `npx tsc --noEmit` + lint on touched files + full `npm run build` — all green before commit.
- Customer-side conventions: pages under `app/(protected)/`, `PageShell`/`PageHeader`/`PageBody`, server actions `"use server"` + zod safeParse + `FormResponse` + `parseStringify`, reads via `softFetch` + `DataLoadError`, `rethrowIfBoundary` in catches. Tenant headers are ambient (`ApiClient` audience "user").
- Loans guards: `LOANS_ENABLED` + `ensureLoanAccess(LOAN_PERMISSIONS.read|apply)` per the existing loans pages. LPO pages have no extra guard (nav-level `purchasing:read`).
- Wire enums verbatim: `LpoPaymentMethod = DIRECT|SETTLO_FINANCING`; `OrderFinancingStatus = NONE|REQUESTED|OFFER_MADE|DECLINED|PAID`; `ApplicationStatus = DRAFT|SUBMITTED|COMPLIANCE_HOLD|IN_REVIEW|APPROVED|ACCEPTED|REJECTED|WITHDRAWN|EXPIRED`.
- Soft signals never block submission; server gate errors surface via the existing toast + inline Alert pattern.
- Commit per task; repo's existing message style + trailer:

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

### Task 1: Types, schema, and actions groundwork

**Files:**
- Modify: `types/lpo/type.ts`, `types/lpo/schema.ts`, `lib/actions/lpo-actions.ts`, `lib/actions/loans-client.ts`
- Create: `types/loans/applications.ts`, `lib/actions/loan-applications-actions.ts`
- (Read first: `lib/actions/loans-actions.ts` for the loans action conventions + the ambient businessId helper it uses for eligibility; `types/admin/loans.ts` for the label/tone shape to mirror.)

**Interfaces (produced, consumed by Tasks 2-4):**

```ts
// types/lpo/type.ts additions
export type LpoPaymentMethod = "DIRECT" | "SETTLO_FINANCING";
export type OrderFinancingStatus = "NONE" | "REQUESTED" | "OFFER_MADE" | "DECLINED" | "PAID";
export const FINANCING_STATUS_LABELS: Record<OrderFinancingStatus, string> = {
  NONE: "—", REQUESTED: "Underwriting", OFFER_MADE: "Offer ready", DECLINED: "Declined", PAID: "Paid by Settlo",
};
// Lpo gains: paymentMethod?: LpoPaymentMethod; financedAmount?: number | null;
//   merchantPayableAmount?: number | null; financingStatus?: OrderFinancingStatus | null;
//   supplierOrderId?: string | null; loanApplicationId?: string | null;
// PublicLpo gains: paymentMethod?, financedAmount?, merchantPayableAmount?

// types/lpo/schema.ts — CreateLpoSchema gains:
//   paymentMethod: z.enum(["DIRECT", "SETTLO_FINANCING"]).optional(),
//   financedAmount: z.coerce.number().positive().optional(),
// + .superRefine: financedAmount only allowed when paymentMethod === "SETTLO_FINANCING"

// lib/actions/lpo-actions.ts
export async function getSupplierFinancingPreview(supplierId: string):
  Promise<{ financeable: boolean; reason: string | null; maxLoanPerOrder: number | null } | null>;
// GET {inventory}/api/v1/suppliers/{id}/financing-preview — returns null on any failure (soft signal)
// createLpo: payload passes paymentMethod + financedAmount through when present.

// types/loans/applications.ts
export type ApplicationStatus = /* the 9-value union above */;
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string>;  // borrower-friendly wording
export const APPLICATION_STATUS_TONES: Record<ApplicationStatus, string>;   // semantic badge tokens like types/admin/loans.ts
export interface LoanApplication {  // mirror CustomerApplicationResponse — READ THE LMS DTO:
  // /Users/Peter/Settlo/Settlo Loan Management Service/src/main/java/co/tz/settlo/lms/application/dto/CustomerApplicationResponse.java
  // Include at least: id, applicationNumber, status, requestedAmount, approvedAmount, requestedTermDays,
  // approvedTermDays, purpose, rejectionReason, decisionNotes, loanId, supplierOrderId, createdAt.
}

// lib/actions/loan-applications-actions.ts ("use server", ApiClient("loans"), loansUrl())
export async function listMyApplications(): Promise<LoanApplication[]>;          // GET /api/v1/loan-applications/mine
export async function getMyApplication(id: string): Promise<LoanApplication | null>; // GET /mine/{id}
export async function acceptOffer(id: string): Promise<FormResponse<LoanApplication>>; // POST /{id}/accept + revalidatePath("/loans/applications")
export async function getPreQualification(): Promise<PreQualifiedProduct[] | null>;   // GET /api/v1/pre-qualification?businessId=… (ambient businessId, same helper getLoanEligibility uses); null on failure
// PreQualifiedProduct: READ the LMS PreQualifiedProductResponse DTO and mirror it (find via
// grep -rn "PreQualifiedProductResponse" in the LMS repo); include product name/code/type + limit fields.
```

- Fix `lib/actions/loans-client.ts` `LOAN_ENDPOINTS.apply` → `"/api/v1/loan-applications"` (comment: corrected path; legacy mock surfaces unaffected).
- `getMyApplication` returns null on 404 (the `SettloApiError.status` idiom from `lib/actions/admin/settlo-suppliers.ts`).

- [ ] **Step 1:** Read the four "read first" files; write all files per the interfaces (real DTO shapes from the LMS source — exact field names).
- [ ] **Step 2:** `npx tsc --noEmit` + lint clean; `npm run build` green.
- [ ] **Step 3: Commit** — `git commit -m "feat(financing): lpo financing types + borrower application actions"`

---

### Task 2: LPO create — the Pay with Settlo card

**Files:**
- Create: `components/widgets/lpo/financing-option-card.tsx`
- Modify: `components/forms/lpo-form.tsx`, `components/widgets/supplier-selector.tsx`
- (Read first: `lpo-form.tsx` end-to-end; `supplier-selector.tsx`; the form-shell section idiom.)

**Interfaces:**
- `SupplierSelector` gains optional `onSupplierSelected?: (supplier: Supplier | null) => void` fired with the full object on change (existing `onChange(id)` untouched — additive).
- `FinancingOptionCard` props: `{ supplier: Supplier | null; orderTotal: number; value: { paymentMethod: LpoPaymentMethod; financedAmount?: number }; onChange(v): void }` — a controlled card the form embeds; the form registers `paymentMethod`/`financedAmount` into RHF via `setValue` on card changes and includes them in submit values.

Card behavior (per spec §3.2):
- Radio: "Pay supplier directly" (default) / "Pay with Settlo financing" — the latter `disabled` with hint "Link this supplier to a Settlo-approved supplier to enable financing" unless `supplier?.linkedToSettloSupplier`.
- On selecting financing: `useEffect` fires `getSupplierFinancingPreview(supplier.id)` and `getPreQualification()` in parallel (client → server actions; loading spinners; failures → the "couldn't check eligibility — you can still submit" line).
- Renders: financeable verdict or `preview.reason`; "Supplier financing cap: TZS {maxLoanPerOrder}" when present; "You're pre-qualified up to TZS {limit}" using the best-matching pre-qual product (prefer a product whose type/name matches stock/supplier financing, else max limit; label "estimate").
- Amount: default full (`orderTotal`, live — recompute as items change); "Finance part of it" switch reveals a numeric input clamped `> 0`, `≤ orderTotal` with the remainder line "You'll pay TZS {orderTotal − financed} to the supplier directly."
- Amber `<Alert>` warnings (non-blocking): financed > maxLoanPerOrder; financed > pre-qual limit.
- Footer explainer: "The supplier reviews and accepts your order first; underwriting starts after acceptance. You'll review and accept the loan terms on the Loans page."

- [ ] **Step 1:** implement; wire into `lpo-form.tsx` after the items section (mirroring the STEP badge section style). Ensure `CreateLpoSchema` refinement errors surface inline (financedAmount without financing etc.).
- [ ] **Step 2:** tsc + lint + `npm run build` green. Manual: form renders both radio states; financed amount math correct (spot-check via the running dev server if available, else static).
- [ ] **Step 3: Commit** — `git commit -m "feat(financing): pay-with-Settlo card on the purchase order form"`

---

### Task 3: LPO detail timeline + list badge + supplier split panel

**Files:**
- Create: `components/widgets/lpo/financing-card.tsx`
- Modify: `app/(protected)/purchase-orders/[id]/page.tsx` (mount), the LPO list table columns file (find it from `purchase-orders/page.tsx`), `components/lpo/public-acknowledge.tsx`, `app/(shareables)/po/[token]/page.tsx` (pass the new PublicLpo fields through)

**Interfaces:**
- `FinancingCard` props `{ lpo: Lpo }`; renders nothing for non-SETTLO_FINANCING.
- Timeline stages + mapping (spec §3.3): Awaiting supplier acceptance (`supplierAcknowledgement === "PENDING"`), Underwriting (`financingStatus === "REQUESTED"`), Offer ready (`OFFER_MADE`), Paid (`PAID`); DECLINED → terminal panel "Financing was declined — you can pay this order directly." + reason line when the API supplies one; order CANCELLED (supplier rejected) → cancelled state. Use the loans timeline visual idiom from `loan-apply-client.tsx`'s `Submitted` component (read it) — simple dots + connector, `pos`/`muted` tones.
- The split rows: "Settlo finances: TZS {financedAmount ?? total}" / "You pay directly: TZS {merchantPayableAmount ?? 0}" (hide the second when 0).
- Handoff button: `loanApplicationId && ["REQUESTED","OFFER_MADE"].includes(financingStatus)` → `<Link href={`/loans/applications/${lpo.loanApplicationId}`}>Review offer in Loans</Link>` (primary when OFFER_MADE, subtle otherwise).
- List badge: financed LPOs get a small `Badge` with `FINANCING_STATUS_LABELS[financingStatus]` (skip NONE) in the list table.
- Public accept page: when `paymentMethod === "SETTLO_FINANCING"`, a panel above the accept/decline actions: "**Settlo pays you TZS {financedAmount ?? total} directly** once the merchant's financing completes." + "TZS {merchantPayableAmount} is payable by the merchant directly." (second line hidden when 0). Accept/decline behavior unchanged.

- [ ] **Step 1:** implement all four surfaces.
- [ ] **Step 2:** tsc + lint + build green.
- [ ] **Step 3: Commit** — `git commit -m "feat(financing): purchase-order financing timeline + supplier payment-split panel"`

---

### Task 4: Borrower applications pages + offer acceptance

**Files:**
- Create: `app/(protected)/loans/applications/page.tsx`, `app/(protected)/loans/applications/[id]/page.tsx`, `app/(protected)/loans/applications/[id]/application-detail-client.tsx`, `components/loans/application-status-badge.tsx`, `components/loans/offer-panel.tsx`
- Modify: `types/menu_items.ts` (Financing group nav entry "Loan applications" → `/loans/applications`), `lib/actions/lpo-actions.ts` IF a supplier-order lookup is needed for the back-link (see below)
- (Read first: `app/(protected)/loans/page.tsx` for guards/softFetch idiom; `loan-apply-client.tsx`'s `AcceptanceRow` + `Submitted` components; `loan-detail-client.tsx` for client patterns.)

**Interfaces & behavior (spec §3.5):**
- List page: `LOANS_ENABLED` gate + `ensureLoanAccess(LOAN_PERMISSIONS.read)`; `softFetch(listMyApplications())`; cards/rows: applicationNumber, status badge, requestedAmount (approvedAmount when set), createdAt, purpose; row → detail. Empty state via `NoItems`.
- Detail page: `getMyApplication(id)` → `notFound()` on null. Status timeline (Submitted → Under review → Offer → Accepted; COMPLIANCE_HOLD renders as "Additional checks"; terminal REJECTED/WITHDRAWN/EXPIRED panels with `rejectionReason`/`decisionNotes` when present).
- Purchase-order back-link: when `supplierOrderId` present → new small action `getSupplierOrderLpoId(orderId)` in `lib/actions/lpo-actions.ts` calling `GET {inventory}/api/v1/supplier-orders/{id}` and returning `lpoId ?? null` (the response now exposes it) → link "View purchase order" → `/purchase-orders/{lpoId}`; hidden on null/failure.
- `OfferPanel` (client) shown only when `status === "APPROVED"`: approved amount, term (`approvedTermDays ?? requestedTermDays` days), any fee/interest/total fields the DTO exposes (render what exists; no client-side recomputation), two required acceptance checkboxes (reuse the `AcceptanceRow` idiom): loan agreement + repayment obligation ("I agree to repay TZS … over … days per the loan agreement"), and **Accept offer** button (`disabled` until both checked; `useTransition`): `acceptOffer(id)` → success → in-place success state "Loan {loanNumber ?? ''} is being prepared — Settlo pays your supplier directly." with `<Link href={`/loans/${loanId}`}>View loan</Link>` when the response carries `loanId`, plus `router.refresh()`. Failure → toast the FormResponse message (offer expired/conflict comes through here) + refresh.
- Accept requires `ensureLoanAccess(LOAN_PERMISSIONS.apply)` at the page level for rendering the panel's active state; without apply permission the panel renders read-only with a hint.

- [ ] **Step 1:** implement; nav entry mirrors the Financing group's existing item shape.
- [ ] **Step 2:** tsc + lint + full `npm run build` green.
- [ ] **Step 3: Commit** — `git commit -m "feat(loans): borrower application pages with real offer acceptance"`

---

## Verification (whole plan)

- Build/lint/type gates green at HEAD.
- Manual walkthrough (backend services running locally): create a financed-partial LPO (soft signals visible) → approve → open the share link (split panel visible) → accept as supplier → LPO timeline advances to Underwriting → application appears under /loans/applications → officer approves (admin) → timeline "Offer ready" + merchant accepts terms → staff disburse (admin/API) → LPO shows Paid by Settlo; loan visible via the application's loan link.
- Grep guard: `grep -rn "loans/applications" app/(protected)` shows the new routes; `LOAN_ENDPOINTS.apply` corrected.
