# Supplier Nominations — Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merchants submit a supplier for Settlo approval from their supplier page and watch it through to "financing available"; staff triage the queue against existing directory entries and approve by creating or matching.

**Architecture:** A five-state financing card on the merchant's supplier detail page backed by new real-endpoint server actions, plus a sibling admin route under the existing `/settlo-suppliers` section whose detail page pairs the submitted snapshot with match candidates.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, zod, Tailwind/shadcn.

**Spec:** `/Users/Peter/Settlo/Settlo Inventory Service/docs/superpowers/specs/2026-08-03-supplier-nomination-design.md` §5. **Depends on** the Inventory plan being merged.

## Global Constraints

- Repo `/Users/Peter/Settlo/Customer-Dashboard` (npm). Per task: `npx tsc --noEmit` + lint on touched files + full `npm run build`, all green before commit.
- Merchant pages live under `app/(protected)/`; admin under `app/(admin)/admin/`, with **all admin hrefs written without the `/admin` prefix** (host-rewrite convention).
- Server actions: `"use server"`, zod `safeParse`, `FormResponse` + `parseStringify`, `revalidatePath` after writes, reads soft-fail via the repo's `softFetch`/`DataLoadError` convention. **A `"use server"` module may export only async functions** — schemas and types belong in `types/`.
- Merchant actions use `new ApiClient("inventory")` (user audience — ambient `X-Business-Id`); admin actions use `new ApiClient("inventory", "staff")`.
- Admin gating: `internal:accounts:read` to view, `internal:accounts:manage` to act, via `hasInternalPermission` + the existing `PERM` constants. **Add no new permission keys.**
- Wire enums verbatim: `NominationStatus = SUBMITTED | APPROVED | REJECTED | WITHDRAWN`; `NominationResolution = CREATED | MATCHED`; approval `mode = CREATE | MATCH`.
- Commit per task; trailer:

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

### Task 1: Types + merchant and admin actions

**Files:**
- Create: `types/supplier/nomination.ts`
- Create: `lib/actions/supplier-nomination-actions.ts` (merchant)
- Create: `lib/actions/admin/supplier-nominations.ts` (staff)
- Modify: `types/supplier/type.ts` (+ `contactPersonEmail` on `Supplier`), `types/supplier/schema.ts` + `lib/actions/supplier-actions.ts` if the form's `normalise()` currently drops it

**Interfaces (produced; Tasks 2-3 build against these names):**

```ts
// types/supplier/nomination.ts
export type NominationStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "WITHDRAWN";
export type NominationResolution = "CREATED" | "MATCHED";

export const NOMINATION_STATUS_LABELS: Record<NominationStatus, string> = {
  SUBMITTED: "Under review", APPROVED: "Approved", REJECTED: "Not approved", WITHDRAWN: "Withdrawn",
};
export const NOMINATION_STATUS_TONES: Record<NominationStatus, string> = {
  SUBMITTED: "bg-warn-tint text-warn", APPROVED: "bg-pos-tint text-pos",
  REJECTED: "bg-neg-tint text-neg", WITHDRAWN: "bg-muted text-muted-foreground",
};

export interface SupplierNomination {
  id: string; sourceSupplierId: string;
  status: NominationStatus; resolution: NominationResolution | null;
  settloSupplierId: string | null; note: string | null; rejectionReason: string | null;
  submittedAt: string; reviewedAt: string | null;
  name: string; contactPerson: string | null; phone: string | null;
  contactPersonEmail: string | null; email: string | null; address: string | null;
  city: string | null; country: string | null;
  registrationNumber: string | null; tinNumber: string | null;
}

export interface MatchCandidate {
  id: string; name: string; verificationStatus: string;
  financingEligible: boolean; matchedOn: string[];
}

export interface NominationReview extends SupplierNomination {
  businessId: string; submittedByUserId: string | null;
  sourceSupplierDeleted: boolean; matchCandidates: MatchCandidate[];
}
```

```ts
// lib/actions/supplier-nomination-actions.ts  — endpoints under {inventory}/api/v1/supplier-nominations
export async function getNominationsForSupplier(supplierId: string): Promise<SupplierNomination[]>; // GET ?sourceSupplierId=  (soft-fail [])
export async function submitNomination(input: { sourceSupplierId: string; note?: string }): Promise<FormResponse<SupplierNomination>>; // POST
export async function withdrawNomination(id: string): Promise<FormResponse<SupplierNomination>>;    // POST /{id}/withdraw
```

```ts
// lib/actions/admin/supplier-nominations.ts — {inventory}/api/v1/settlo-supplier-nominations, staff audience
export async function listNominations(status?: NominationStatus): Promise<NominationReview[]>;      // GET ?status=  (soft-fail [])
export async function getNomination(id: string): Promise<NominationReview | null>;                  // GET /{id}   (404 → null)
export async function approveNomination(id: string, input: { mode: "CREATE" | "MATCH"; settloSupplierId?: string }): Promise<FormResponse<NominationReview>>;
export async function rejectNomination(id: string, reason: string): Promise<FormResponse<NominationReview>>;
```

Both write paths `revalidatePath` their surfaces (`/suppliers` and `/admin/settlo-suppliers/nominations` respectively — note the admin revalidate path keeps the `/admin` prefix; only *hrefs* drop it). Backend messages surface through `FormResponse.message` via the repo's `handleSettloApiError` idiom (409s like "already under review" must reach the user verbatim).

- [ ] **Step 1:** Read `lib/actions/lpo-actions.ts` (merchant idioms incl. the soft-fail helpers) and `lib/actions/admin/settlo-suppliers.ts` (staff idioms) before writing anything; match them.
- [ ] **Step 2:** Write both action files + the types file; thread `contactPersonEmail` through the supplier form's schema/normalise so it stops being silently dropped now that the column exists.
- [ ] **Step 3:** `npx tsc --noEmit`, lint the touched files, `npm run build` — all green.
- [ ] **Step 4: Commit** — `git commit -m "feat(nominations): types and server actions for supplier nominations"`

---

### Task 2: Merchant financing card + submit dialog

**Files:**
- Create: `components/widgets/supplier/settlo-financing-card.tsx`, `components/widgets/supplier/submit-nomination-dialog.tsx`
- Modify: `app/(protected)/suppliers/[id]/page.tsx` (fetch + mount), `components/widgets/supplier/link-settlo-dialog.tsx` (empty-state CTA), `components/tables/supplier/columns.tsx` (status chip)

**Interfaces:**
- Consumes Task 1's actions/types; the existing `getSupplierFinancingPreview(supplierId)` from `lib/actions/lpo-actions.ts` (returns `{financeable, reason, maxLoanPerOrder} | null`).
- Produces: `<SettloFinancingCard supplier={supplier} nomination={latestNomination} preview={preview} />`, `<SubmitNominationDialog supplier open onOpenChange onSubmitted />`.

**Five states** (derive from `supplier.linkedToSettloSupplier` + the latest nomination; a `WITHDRAWN` latest nomination falls back to *not submitted*):

| State | Condition | Content |
|---|---|---|
| Not submitted | not linked; no nomination, or latest is `WITHDRAWN` | One-line explainer ("Settlo can pay this supplier directly for stock you finance") + **Submit for Settlo financing** button |
| Under review | latest is `SUBMITTED` | "Under review — submitted {date}" + **Withdraw** (confirm dialog) |
| Approved, onboarding | latest is `APPROVED` and not linked | "Approved — Settlo is setting {name} up. We'll tell you when financing is available." |
| Financing available | `supplier.linkedToSettloSupplier` | "Financing available" + the `maxLoanPerOrder` cap when `preview.financeable`, and a link to `/purchase-orders/new` to create a financed order |
| Not approved | latest is `REJECTED` | The `rejectionReason` + "Update the supplier's details and submit again" + **Submit** button |

**Submit dialog** shows the exact snapshot that will be sent — name, contact person, phone, email, TIN, registration number — reading from the supplier record, with any blank field rendered as a muted "Not set" so the merchant can close, fill it in, and resubmit. Plus a `note` textarea ("Tell us about your trading relationship — how often you order and roughly how much") and a short "what happens next: Settlo reviews and contacts the supplier; you'll be notified." Submit calls `submitNomination({sourceSupplierId, note})`, toasts the backend message on failure, and calls `onSubmitted` → `router.refresh()`.

Link-dialog empty state (no catalog matches) gains: "Not in the directory? Submit this supplier for review" opening the same dialog. Suppliers list gains a compact chip: linked → "Settlo" (pos), latest `SUBMITTED` → "Under review" (warn), else nothing.

- [ ] **Step 1:** Read `app/(protected)/suppliers/[id]/page.tsx` and `link-settlo-dialog.tsx` end-to-end, plus one existing card widget for the visual idiom.
- [ ] **Step 2:** Implement both components; mount the card in the detail page (server-fetch `getNominationsForSupplier(id)` + `getSupplierFinancingPreview(id)` in parallel with the existing supplier fetch, taking the newest nomination as `latest`).
- [ ] **Step 3:** tsc + lint + `npm run build` green.
- [ ] **Step 4: Commit** — `git commit -m "feat(nominations): merchant financing card and submit dialog"`

---

### Task 3: Admin review queue + decision page

**Files:**
- Create: `app/(admin)/admin/settlo-suppliers/nominations/page.tsx`, `.../nominations/[id]/page.tsx`, `.../nominations/[id]/nomination-decision-client.tsx`, `components/admin/settlo-suppliers/match-candidates-panel.tsx`
- Modify: `components/sidebar/admin-sidebar.tsx` (nav entry)

**Interfaces:** consumes Task 1's admin actions/types.

- **List** (`page.tsx`): `force-dynamic`; guard exactly as the sibling `/settlo-suppliers/page.tsx` does (staff token → `redirect("/login")` → `hasInternalPermission(token, PERM.ACCOUNTS_READ)`, `canManage` from `ACCOUNTS_MANAGE`); `?status=` pill tabs **Submitted** (default) / Approved / Not approved, validated against the enum; table columns: supplier name, submitting business (`businessId` until a name is available — render the id truncated with a `title` attribute), TIN, submitted date, status badge; row → detail. `NoItems` empty state, `DataLoadError` on failure.
- **Detail** (`[id]/page.tsx` + client): `getNomination(id)` → `notFound()` on null. Sections: the submitted snapshot (def-list), the merchant's note, a warning banner when `sourceSupplierDeleted` ("The merchant's supplier record was deleted — approving still creates the directory entry, but nothing will be linked back"), then:
  - `<MatchCandidatesPanel candidates={...} canManage onMatch={(id) => ...} />` — one row per candidate with name, a verification-status badge, `matchedOn` chips ("TIN", "Phone", "Similar name"), and a **Match to this** button. Empty state: "No similar suppliers found."
  - **Approve as new directory entry** button → `approveNomination(id, {mode: "CREATE"})` → on success `router.push('/settlo-suppliers/' + data.settloSupplierId)` so staff continue straight into payment accounts → verify → caps.
  - **Match to this** → `approveNomination(id, {mode: "MATCH", settloSupplierId})` → success toast + `router.refresh()`.
  - **Reject** → dialog with a required reason textarea → `rejectNomination(id, reason)`.
  - All action buttons hidden when `!canManage`; already-decided nominations render the decision (resolution, reviewer timestamp, reason) instead of buttons.
- **Nav**: an entry in the sidebar's Financing group — `{ title: "Supplier nominations", href: "/settlo-suppliers/nominations", icon: <a lucide icon such as UserPlus>, permissions: [<the same read key the settlo-suppliers entry uses>] }`, mirroring that entry's shape exactly.

- [ ] **Step 1:** Read `app/(admin)/admin/settlo-suppliers/page.tsx` + `[id]/page.tsx` + `components/admin/settlo-suppliers/supplier-decision-panel.tsx` for the guard/tab/decision idioms.
- [ ] **Step 2:** Implement list, detail, decision client, candidates panel, nav entry.
- [ ] **Step 3:** tsc + lint + `npm run build` green.
- [ ] **Step 4: Commit** — `git commit -m "feat(nominations): admin review queue with match candidates"`

---

## Verification (whole plan)

- Build/lint/type gates green at HEAD.
- Manual walkthrough with the backends running: supplier page → Submit → card shows "Under review" → admin queue shows it → open detail, see candidates → Approve as new → lands on the new PENDING directory entry → add a verified payment account + caps → Verify → merchant's supplier page shows "Financing available" and a notification arrives.
- Second walkthrough for MATCH: nominate a supplier that already exists in the directory as VERIFIED → "Match to this" → merchant links immediately.
