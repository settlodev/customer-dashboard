# Settlo Suppliers Admin Section — Customer-Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An internal-staff admin section at `/settlo-suppliers` (admin host) to manage the Settlo-approved supplier directory: approval states, disbursement-ready payment accounts, and financing caps.

**Architecture:** Server components under `app/(admin)/admin/settlo-suppliers/`, staff-audience server actions (`ApiClient("inventory", "staff")`) against the Inventory Service's `INTERNAL_`-guarded `/api/v1/settlo-suppliers` endpoints. Follows three in-repo exemplars: `support-agents` (list + dialog + row actions), `loans/applications` (status tabs + decision panel), `funding-sources` (forms).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind + shadcn, zod, next-auth staff cookie.

**Spec:** `/Users/Peter/Settlo/Settlo Loan Management Service/docs/superpowers/specs/2026-07-31-supplier-paid-stock-loans-design.md` §5

## Global Constraints

- Repo: `/Users/Peter/Settlo/Customer-Dashboard`. Detect the package manager from the lockfile before running anything (`pnpm-lock.yaml` → pnpm, else npm) and use it consistently for `build`/`lint`.
- Admin pages live in `app/(admin)/admin/settlo-suppliers/`, but every `href`/`redirect` is written **without** the `/admin` prefix (middleware host-rewrite). Example: `href="/settlo-suppliers"`.
- Permissions: view requires `internal:accounts:read`, mutations `internal:accounts:manage` — use the existing `PERM` keys in `lib/admin/permissions.ts` (`hasInternalPermission(token, PERM.ACCOUNTS_READ)` etc. — read the file for exact constant names; do NOT invent new permission keys).
- Server actions: `"use server"`, private `staffClient()` factory returning `new ApiClient("inventory", "staff")`, zod `safeParse`, return `FormResponse<T>` via `parseStringify`, `revalidatePath("/admin/settlo-suppliers")` after writes — exactly the shape of `lib/actions/admin/inventory-operations.ts` and `lib/actions/admin/loans.ts`.
- Page guard pattern (copy verbatim from `app/(admin)/admin/support-agents/page.tsx`): `getStaffAuthToken()` → redirect to `/login` when missing → permission check → `AdminShell`/`PageShell`/`PageHeader`.
- States: backend enum values `PENDING | VERIFIED | REJECTED | SUSPENDED`; UI labels **Pending approval / Approved / Declined / Suspended** (extend the existing `SETTLO_SUPPLIER_STATUS_LABELS` in `types/supplier/type.ts` if the labels differ).
- Commit per task with the repo's existing message style.

---

### Task 1: Admin types + directory server actions

**Files:**
- Create: `types/admin/settlo-suppliers.ts`
- Create: `lib/actions/admin/settlo-suppliers.ts`

**Interfaces (produced, consumed by every later task):**

```ts
// types/admin/settlo-suppliers.ts
export type SettloSupplierVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export const SUPPLIER_STATUS_LABELS: Record<SettloSupplierVerificationStatus, string> = {
  PENDING: "Pending approval", VERIFIED: "Approved", REJECTED: "Declined", SUSPENDED: "Suspended",
};
// Tones follow the semantic badge tokens used in components/admin/shared/onboarding-badge.tsx
export const SUPPLIER_STATUS_TONES: Record<SettloSupplierVerificationStatus, string> = {
  PENDING: "bg-warn-tint text-warn", VERIFIED: "bg-pos-tint text-pos",
  REJECTED: "bg-neg-tint text-neg", SUSPENDED: "bg-muted text-muted-foreground",
};

export const MOBILE_PROVIDERS = ["VODACOM", "TIGO", "AIRTEL", "HALOTEL", "TTCL", "AZAM", "YAS"] as const;
export const BANK_PROVIDERS = ["CRDB", "NMB", "MWANGA_HAKIKA_BANK"] as const;
export type DisbursementProvider = (typeof MOBILE_PROVIDERS)[number] | (typeof BANK_PROVIDERS)[number];

export interface AdminSettloSupplier {
  id: string; name: string; contactPerson: string | null; phone: string | null;
  email: string | null; address: string | null; city: string | null; country: string | null;
  registrationNumber: string | null; tinNumber: string | null;
  verificationStatus: SettloSupplierVerificationStatus;
  financingEligible: boolean; marketplaceEnabled: boolean;
  paymentAccounts: SupplierPaymentAccount[];
  financingProfile: SupplierFinancingProfile | null;
  archivedAt: string | null; createdAt: string; updatedAt: string;
}
export interface SupplierPaymentAccount {
  id: string; settloSupplierId: string;
  paymentMethod: "BANK_TRANSFER" | "MOBILE_MONEY" | "CASH" | "CHEQUE";
  provider: DisbursementProvider | null; accountName: string | null; accountNumber: string | null;
  bankName: string | null; mobileProvider: string | null; mobileNumber: string | null;
  verified: boolean; defaultAccount: boolean; verifiedAt: string | null; disbursementReady: boolean;
}
export interface SupplierFinancingProfile {
  id: string; settloSupplierId: string; maxLoanPerOrder: number | null;
  maxOutstandingExposure: number | null; currentExposure: number; allowFinancing: boolean;
}
```

```ts
// lib/actions/admin/settlo-suppliers.ts — action signatures (all return FormResponse-style results)
export async function listSettloSuppliers(status?: SettloSupplierVerificationStatus): Promise<AdminSettloSupplier[]>;
export async function getSettloSupplier(id: string): Promise<AdminSettloSupplier | null>;
export async function createSettloSupplier(input: SupplierFormInput): Promise<FormResponse<AdminSettloSupplier>>;
export async function updateSettloSupplier(id: string, input: SupplierFormInput): Promise<FormResponse<AdminSettloSupplier>>;
export async function setSupplierVerificationStatus(id: string, status: SettloSupplierVerificationStatus): Promise<FormResponse<AdminSettloSupplier>>;
```

Backend routes: `GET/POST /api/v1/settlo-suppliers`, `GET/PUT /api/v1/settlo-suppliers/{id}`, `PUT /api/v1/settlo-suppliers/{id}/verification-status` body `{"status": "..."}`. `SupplierFormInput` is the zod-inferred type of `supplierFormSchema` (name required max 200; contactPerson/phone/email/address/city/country/registrationNumber/tinNumber optional; email `.email()` when present).

- [ ] **Step 1:** Read `lib/actions/admin/inventory-operations.ts` end-to-end (it is the exact `ApiClient("inventory","staff")` precedent) and `lib/actions/admin/loans.ts` for the `FormResponse`/zod/`revalidatePath` shape.
- [ ] **Step 2:** Write both files with the real implementations (list/get return plain data for server components; create/update/status return `FormResponse`; every write calls `revalidatePath("/admin/settlo-suppliers")`).
- [ ] **Step 3:** `tsc --noEmit` via the repo's lint/typecheck script → clean.
- [ ] **Step 4: Commit** — `git commit -m "feat(admin): settlo supplier admin types + directory actions"`

---

### Task 2: Payment-account + financing server actions

**Files:**
- Modify: `lib/actions/admin/settlo-suppliers.ts`

**Interfaces:**

```ts
export async function addSupplierPaymentAccount(supplierId: string, input: PaymentAccountInput): Promise<FormResponse<SupplierPaymentAccount>>;
export async function updateSupplierPaymentAccount(accountId: string, input: PaymentAccountInput): Promise<FormResponse<SupplierPaymentAccount>>;
export async function deleteSupplierPaymentAccount(accountId: string): Promise<FormResponse<void>>;
export async function verifySupplierPaymentAccount(accountId: string): Promise<FormResponse<SupplierPaymentAccount>>;
export async function setDefaultSupplierPaymentAccount(accountId: string): Promise<FormResponse<SupplierPaymentAccount>>;
export async function updateSupplierFinancingProfile(supplierId: string, input: FinancingProfileInput): Promise<FormResponse<SupplierFinancingProfile>>;
```

Backend routes (Inventory): `POST /api/v1/settlo-suppliers/{id}/payment-accounts`, `PUT/DELETE /api/v1/settlo-suppliers/payment-accounts/{accountId}`, `POST .../payment-accounts/{accountId}/verify`, `POST .../payment-accounts/{accountId}/default`, `PUT /api/v1/settlo-suppliers/{id}/financing-profile` body `{maxLoanPerOrder?, maxOutstandingExposure?, allowFinancing?}`.

`paymentAccountSchema` (zod, superRefine): `paymentMethod` enum required; when `MOBILE_MONEY` → `provider` must be in `MOBILE_PROVIDERS` and `mobileNumber` required; when `BANK_TRANSFER` → `provider` in `BANK_PROVIDERS` and `accountNumber` required; `accountName` required for both. `financingProfileSchema`: two optional non-negative numbers + `allowFinancing` boolean.

- [ ] **Step 1:** Implement the six actions + two schemas. **Step 2:** typecheck clean. **Step 3: Commit** — `git commit -m "feat(admin): supplier payment-account + financing actions"`

---

### Task 3: List page, status tabs, create dialog, sidebar entry

**Files:**
- Create: `app/(admin)/admin/settlo-suppliers/page.tsx`
- Create: `components/admin/settlo-suppliers/settlo-suppliers-view.tsx`
- Create: `components/admin/settlo-suppliers/supplier-form-dialog.tsx`
- Create: `components/admin/settlo-suppliers/supplier-status-badge.tsx`
- Modify: `components/sidebar/admin-sidebar.tsx`

**Interfaces:**
- Consumes: Task 1 actions/types.
- Produces: `SupplierStatusBadge({ status })` (pill using `SUPPLIER_STATUS_LABELS`/`_TONES`) and `SupplierFormDialog({ open, onOpenChange, supplier?, onSaved })` reused by the detail page in Task 4.

Implementation notes (real code, mirroring named exemplars):
- `page.tsx` is a server component, `export const dynamic = "force-dynamic"`. Guard per Global Constraints. Reads `searchParams.status`, validates against the enum, calls `listSettloSuppliers(status)`, renders the tab strip exactly like `app/(admin)/admin/loans/applications/page.tsx` builds its `?status=` tabs — tab set: All (no param) + the four states with friendly labels — then `<SettloSuppliersView suppliers={...} canManage={hasInternalPermission(token, PERM_MANAGE_KEY)} />`.
- `settlo-suppliers-view.tsx` (client): mirrors `components/admin/support-agents-view.tsx` — count line, "New supplier" button gated on `canManage`, `DataTable` from `components/tables/data-table.tsx` in `clientMode` with columns: name (link to `/settlo-suppliers/${id}`), contact person, phone, city/country, `SupplierStatusBadge`, financing-eligible dot. Row click navigates to the detail page (`rowClickBasePath="/settlo-suppliers"`).
- `supplier-form-dialog.tsx`: mirrors `components/admin/catalog/credit-pack-form-dialog.tsx` — `Dialog` + `react-hook-form` + `zodResolver(supplierFormSchema)` + `FormError` + toast on success, calls `createSettloSupplier` or `updateSettloSupplier`, then `onSaved()` → `router.refresh()`.
- Sidebar: add to the **Financing** `NavGroup` in `components/sidebar/admin-sidebar.tsx`: `{ title: "Settlo suppliers", href: "/settlo-suppliers", icon: <appropriate lucide icon, e.g. Truck>, permissions: [<the read key used by accounts pages>] }`.

- [ ] **Step 1:** Read the three exemplar files. **Step 2:** implement the four files + sidebar entry. **Step 3:** `build` passes; manual check on `http://admin.localhost:3000/settlo-suppliers` (login as staff) shows the empty list + tabs. **Step 4: Commit** — `git commit -m "feat(admin): settlo suppliers list page with status tabs + create dialog"`

---

### Task 4: Detail page — decision panel + profile

**Files:**
- Create: `app/(admin)/admin/settlo-suppliers/[id]/page.tsx`
- Create: `components/admin/settlo-suppliers/supplier-decision-panel.tsx`

**Interfaces:**
- Consumes: `getSettloSupplier`, `setSupplierVerificationStatus`, `SupplierFormDialog`, `SupplierStatusBadge`.

Notes:
- `[id]/page.tsx`: server component, guard, `getSettloSupplier(id)` → `notFound()` when null. Layout: `PageHeader` (name + `SupplierStatusBadge`, breadcrumbs back to `/settlo-suppliers`), then a two-column grid: left = profile `section-card` (`components/admin/shared/section-card` + `def-list` for contact/registration/TIN fields, Edit button opening `SupplierFormDialog`), right = `<SupplierDecisionPanel supplier={...} canManage={...} />` + placeholder slots where Tasks 5's cards mount.
- `supplier-decision-panel.tsx`: mirrors `components/admin/loan-application-decision-panel.tsx` (client, `useTransition`, `useToast`, `router.refresh()`): available actions derived from current state — PENDING → Approve / Decline; VERIFIED → Suspend; REJECTED → Approve (re-review); SUSPENDED → Reactivate (→ VERIFIED). Each button calls `setSupplierVerificationStatus(id, targetStatus)`; destructive actions use the `neg` tone and a confirm `AlertDialog`. Approving shows the helper text "Approving enables marketplace listing and financing eligibility" (backend auto-flips both).

- [ ] **Step 1:** read the decision-panel exemplar. **Step 2:** implement both files. **Step 3:** build + manual: approve a PENDING supplier, badge flips to Approved. **Step 4: Commit** — `git commit -m "feat(admin): supplier detail page with approval decision panel"`

---

### Task 5: Payment-accounts card + financing card

**Files:**
- Create: `components/admin/settlo-suppliers/payment-accounts-card.tsx`
- Create: `components/admin/settlo-suppliers/payment-account-dialog.tsx`
- Create: `components/admin/settlo-suppliers/financing-card.tsx`
- Modify: `app/(admin)/admin/settlo-suppliers/[id]/page.tsx` (mount both cards)

**Interfaces:**
- Consumes: Task 2 actions; `MOBILE_PROVIDERS`/`BANK_PROVIDERS`.

Notes:
- `payment-accounts-card.tsx` (client): section-card listing accounts — provider + method line, masked identifier (`accountNumber ?? mobileNumber`), badges: `Verified` (pos), `Default` (outline), `Not disbursable` (warn, when `!disbursementReady`). Row `DropdownMenu` (mirror `components/tables/admin-support-agents/cell-action.tsx`): Edit, Verify (hidden when verified), Make default (hidden when default; disabled with tooltip when `!verified || !disbursementReady`), Delete (disabled with tooltip when default). "Add account" button opens the dialog.
- `payment-account-dialog.tsx`: `react-hook-form` + `zodResolver(paymentAccountSchema)`. `paymentMethod` select drives the rest: MOBILE_MONEY → provider select from `MOBILE_PROVIDERS` + mobile number input; BANK_TRANSFER → provider select from `BANK_PROVIDERS` + account number + bank name; CASH/CHEQUE → note "Not usable for loan disbursement" and no provider field. Account name always shown.
- `financing-card.tsx` (client): `allowFinancing` switch + two numeric inputs (maxLoanPerOrder, maxOutstandingExposure) + read-only "Current exposure" stat; Save calls `updateSupplierFinancingProfile`, toast + refresh. Show an inline hint when the supplier is not VERIFIED: "Financing runs only for approved suppliers."

- [ ] **Step 1:** implement the three components and mount them. **Step 2:** build + manual: add a Vodacom MSISDN account → verify → make default; set caps; confirm `disbursementReady` badge logic. **Step 3: Commit** — `git commit -m "feat(admin): supplier payment accounts + financing cards"`

---

### Task 6: Catalog ride-along fix + full gate

**Files:**
- Modify: `types/supplier/type.ts`
- Modify: `components/widgets/supplier/link-settlo-dialog.tsx`
- Modify: `components/forms/supplier-form.tsx` (~line 219)

**Why:** the Inventory catalog (`/api/v1/supplier-catalog/*`) now returns a sanitized DTO **without** `verificationStatus`/`financingEligible`/`marketplaceEnabled`/`tinNumber`/`registrationNumber`. Catalog entries are all verified by construction.

- [ ] **Step 1:** Add a `SettloSupplierCatalogEntry` type (`id, name, contactPerson, phone, email, address, city, country`) in `types/supplier/type.ts`; point `fetchSettloSupplierCatalog()`/`getSettloSupplier()` result types at it (`lib/actions/settlo-supplier-actions.ts`).
- [ ] **Step 2:** In `link-settlo-dialog.tsx` and `supplier-form.tsx`, remove the `verificationStatus === "VERIFIED"` checks and the `· Verified` suffix logic — treat every catalog entry as linkable. Keep the full `SettloSupplier` type for the admin section only.
- [ ] **Step 3:** Run lint + typecheck + `build` — zero references to removed fields (`grep -rn "verificationStatus" components/widgets/supplier components/forms/supplier-form.tsx` returns nothing).
- [ ] **Step 4: Commit** — `git commit -m "fix(supplier): adapt catalog consumers to sanitized supplier-catalog DTO"`

---

## Verification (whole plan)

- Full `build` + lint green.
- Manual admin-host walkthrough: create supplier (Pending approval tab) → add + verify + default a payment account → set financing caps → Approve → supplier appears under the Approved tab; suspend/reactivate round-trip.
- Customer-side regression: business supplier form still links to a catalog supplier without errors.
