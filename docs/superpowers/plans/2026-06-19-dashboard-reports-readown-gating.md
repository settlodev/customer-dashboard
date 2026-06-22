# Dashboard `read_own` Reports Gating — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide every location-wide report (nav item + page + dashboard-home card) from Customer-Dashboard users who lack `reports:read_all`, so a `read_own` user sees only their own scoped reports.

**Architecture:** Derive one boolean `reportsReadAll` from the USER access token's `permissions` claim at login, store it on the auth-cookie `AuthToken` (read server-side via `getAuthToken()`). The active sidebar (`dashboard-sidebar.tsx`) is prop-drilled the flag from the server `(protected)/layout.tsx` and passes it to `menuItems()`, which drops the location-wide report links. Each location-wide report page calls a server guard `requireReportsReadAll()` that redirects to `/dashboard`. The dashboard home conditionally renders its three report-backed card groups.

**Tech Stack:** Next.js (App Router, RSC), NextAuth, TypeScript. Auth state lives in a chunked cookie (`AuthToken`), read via `getAuthToken()`.

## Global Constraints

- **Permission source:** the USER access token's **`permissions`** claim (string keys, e.g. `"reports:read_all"`) — confirmed backend-side (Accounts mints it from the user's roles; the analytics service reads it as strings). Decode it the same way `extractInternalPermissions` decodes `internal_permissions`. Store only the derived **boolean** `reportsReadAll`, not the array (avoids cookie bloat).
- **The flag default is `true`** wherever it's unknown/loading (mirrors the `hasDepartmentsModule` precedent), so owners/managers and any pre-flag session keep full access; only an explicit `false` gates down.
- **Location-wide report links** (the set that requires `reports:read_all`): `/report/sales`, `/report/cashflow`, `/report/top-selling`, `/report/credit`, `/report/refunds`, `/report/voids`, `/report/stock`, `/report/staff`, `/report/expense`. **Kept for everyone:** `/dashboard` (home — cards gated separately) and `/report/sold-items` (backend force-scopes it to the caller's own data).
- **Active sidebar:** `components/sidebar/dashboard-sidebar.tsx` (the `(protected)` layout renders `DashboardSidebarShell`). `components/sidebar/sidebar.tsx` is the warehouse sidebar — do NOT edit it.
- **No test runner exists** (package.json has only `dev/build/start/lint`; zero unit tests). Verification for every task is `npx tsc --noEmit` (no NEW errors referencing the touched files) + `npx next lint` + the documented manual check. This matches the repo's established model; adding a test runner is an explicit out-of-scope follow-up.
- **Client/server import safety:** `lib/reports-access.ts` is **pure** (constants only, no `next/*` or cookie imports) so the client sidebar can import `LOCATION_WIDE_REPORT_LINKS`. The server guard `requireReportsReadAll()` lives in `lib/auth-utils.ts` (already server-only via `cookies()`), never imported by a client component.

---

## Task 1: Permission foundation — surface `reportsReadAll`

**Files:**
- Modify: `lib/jwt-utils.ts` (add `extractPermissions`)
- Modify: `types/types.ts` (`AuthToken` += `reportsReadAll?`)
- Modify: `lib/auth-utils.ts` (`createAuthTokenFromLogin` derives it; add `requireReportsReadAll()` guard)
- Create: `lib/reports-access.ts` (pure constants)

**Interfaces:**
- Produces: `extractPermissions(accessToken: string): string[]`; `AuthToken.reportsReadAll?: boolean`; `requireReportsReadAll(): Promise<void>`; `LOCATION_WIDE_REPORT_LINKS: readonly string[]`; `REPORTS_READ_ALL: string`.

- [ ] **Step 1: Add `extractPermissions` to `lib/jwt-utils.ts`** — directly after `extractInternalPermissions` (mirror it, reading the `permissions` claim instead of `internal_permissions`):

```typescript
/**
 * Business-permission keys from a USER access token's `permissions` claim,
 * e.g. ["reports:read_all", "orders:read", …]. Mirror of
 * extractInternalPermissions (which reads the STAFF `internal_permissions`
 * claim). Returns [] if the claim is absent or not a string array.
 */
export function extractPermissions(accessToken: string): string[] {
  const claims = decodeJwtClaims(accessToken);
  if (!claims) return [];
  const perms = (claims as Record<string, unknown>).permissions;
  if (!Array.isArray(perms)) return [];
  return perms.filter((p): p is string => typeof p === "string");
}
```

- [ ] **Step 2: Add the field to `AuthToken`** in `types/types.ts` — after `impersonatorId?: string | null;`, before the closing brace:

```typescript
    /** True iff the user holds `reports:read_all` (location-wide reports). Derived at login. */
    reportsReadAll?: boolean;
```

- [ ] **Step 3: Derive it in `createAuthTokenFromLogin`** (`lib/auth-utils.ts`). Add `extractPermissions` to the existing `jwt-utils` import, then add one field to the `authTokenData` object literal (after `impersonatorId: opts?.impersonatorId ?? null,`):

```typescript
    reportsReadAll: extractPermissions(loginResponse.accessToken).includes("reports:read_all"),
```

- [ ] **Step 4: Add the server guard** to `lib/auth-utils.ts` (it already imports `cookies` / is server-only). Add at the end of the file, plus `import { redirect } from "next/navigation";` at the top:

```typescript
/**
 * Server guard for a location-wide report page: redirects a user without
 * `reports:read_all` back to /dashboard (they must not land on an all-staff
 * report). Call as the first statement of each location-wide report page.
 */
export const requireReportsReadAll = async (): Promise<void> => {
  const token = await getAuthToken();
  if (!token?.reportsReadAll) {
    redirect("/dashboard");
  }
};
```

- [ ] **Step 5: Create `lib/reports-access.ts`** (pure — no `next/*`, no cookie imports — safe for the client bundle):

```typescript
/** The business-permission key that grants location-wide (all-staff) reports. */
export const REPORTS_READ_ALL = "reports:read_all";

/**
 * Report nav links that show ALL-staff / all-location data and therefore
 * require `reports:read_all`. Hidden from a read_own user's nav and guarded
 * at the page. Everything NOT here (the Dashboard home + the Sold-items
 * report, which the backend force-scopes to the user's own data) stays.
 */
export const LOCATION_WIDE_REPORT_LINKS: readonly string[] = [
  "/report/sales",
  "/report/cashflow",
  "/report/top-selling",
  "/report/credit",
  "/report/refunds",
  "/report/voids",
  "/report/stock",
  "/report/staff",
  "/report/expense",
];
```

- [ ] **Step 6: Verify.** Run: `npx tsc --noEmit 2>&1 | grep -iE 'jwt-utils|auth-utils|reports-access|types.ts'`
Expected: empty (no new errors referencing the touched files).

- [ ] **Step 7: Commit.**

```bash
git add lib/jwt-utils.ts types/types.ts lib/auth-utils.ts lib/reports-access.ts
git commit -m "feat(reports): surface reportsReadAll permission + page guard"
```

---

## Task 2: Nav gating — hide location-wide report links

**Files:**
- Modify: `types/menu-item-type.ts` (`MenuItemArgType` += `reportsReadAll?`)
- Modify: `types/menu_items.ts` (filter the Reports items)
- Modify: `app/(protected)/layout.tsx` (pass the flag to the sidebar)
- Modify: `components/sidebar/dashboard-sidebar.tsx` (thread the prop → `menuItems`)

**Interfaces:**
- Consumes: `LOCATION_WIDE_REPORT_LINKS` (Task 1), `AuthToken.reportsReadAll` (Task 1).

- [ ] **Step 1: Extend `MenuItemArgType`** in `types/menu-item-type.ts` — after `hasDepartmentsModule?: boolean;`:

```typescript
    /** When false, location-wide report nav items are filtered out (read_own users). Default true. */
    reportsReadAll?: boolean;
```

- [ ] **Step 2: Filter the Reports items** in `types/menu_items.ts`. Add the import at the top:

```typescript
import { LOCATION_WIDE_REPORT_LINKS } from "@/lib/reports-access";
```

In `getNormalMenuItems`, alongside `const hasDepartmentsModule = args?.hasDepartmentsModule !== false;`, add:

```typescript
  const reportsReadAll = args?.reportsReadAll !== false; // default true
```

Then wrap the Reports section's `items: [ … ]` array with a `.filter(...)` (keep every non-location-wide link; drop location-wide links when `!reportsReadAll`):

```typescript
      items: [
        { title: "Dashboard", link: "/dashboard", current: args?.isCurrentItem, icon: "cart" },
        { title: "Sales report", link: "/report/sales", current: args?.isCurrentItem, icon: "cart" },
        { title: "Cashflow report", link: "/report/cashflow", current: args?.isCurrentItem, icon: "cart" },
        { title: "Top selling report", link: "/report/top-selling", current: args?.isCurrentItem, icon: "cart" },
        { title: "Sold items report", link: "/report/sold-items", current: args?.isCurrentItem, icon: "cart" },
        { title: "Credit report", link: "/report/credit", current: args?.isCurrentItem, icon: "cart" },
        { title: "Refund report", link: "/report/refunds", current: args?.isCurrentItem, icon: "cart" },
        { title: "Voids report", link: "/report/voids", current: args?.isCurrentItem, icon: "cart" },
        { title: "Stock report", link: "/report/stock", current: args?.isCurrentItem, icon: "cart" },
        { title: "Staff report", link: "/report/staff", current: args?.isCurrentItem, icon: "cart" },
        { title: "Expense report", link: "/report/expense", current: args?.isCurrentItem, icon: "cart" },
      ].filter((it) => reportsReadAll || !LOCATION_WIDE_REPORT_LINKS.includes(it.link)),
```

(Keep the existing item objects verbatim — only add the trailing `.filter(...)`.)

- [ ] **Step 3: Pass the flag from the server layout** `app/(protected)/layout.tsx`. It already does `const authToken = await getAuthToken();`. At the `DashboardSidebarShell` render site, add the prop:

```tsx
              <DashboardSidebarShell
                data={businessData}
                user={user}
                reportsReadAll={authToken?.reportsReadAll ?? true}
              />
```

- [ ] **Step 4: Thread the prop through `dashboard-sidebar.tsx`.** Add `reportsReadAll?: boolean;` to `DashboardSidebarShellProps` and `DashboardSidebarContentProps`; accept it in both function signatures (default `true`); pass it from `DashboardSidebarShell` → `DashboardSidebarContent`; and add it to the `menuItems({...})` call:

```tsx
// DashboardSidebarShell({ data, user, reportsReadAll = true }: DashboardSidebarShellProps)
//   → <DashboardSidebarContent data={data} user={user} reportsReadAll={reportsReadAll} ... />  (every render of it)
// DashboardSidebarContent({ data, user, onClose, isMobile, reportsReadAll = true }: DashboardSidebarContentProps)
  const sections = menuItems({
    menuType: "normal",
    isCurrentItem: false,
    hasMultipleDestinations: data.hasMultipleDestinations,
    reportsReadAll,
  });
```

(`DashboardSidebarShell` renders `DashboardSidebarContent` in both the desktop `<aside>` and the mobile drawer — pass `reportsReadAll` to BOTH.)

- [ ] **Step 5: Verify.** Run: `npx tsc --noEmit 2>&1 | grep -iE 'menu_items|menu-item-type|dashboard-sidebar|\(protected\)/layout'`
Expected: empty. Then `npx next lint` — no new errors in these files.

- [ ] **Step 6: Manual check** (on a dev env, with a `read_own` dashboard account — or temporarily force `reportsReadAll={false}` at the layout render site, verify, then revert): the sidebar's Reports section shows only **Dashboard** + **Sold items report**; the other 9 are hidden. With `read_all` (owner/manager) all 11 show.

- [ ] **Step 7: Commit.**

```bash
git add types/menu-item-type.ts types/menu_items.ts "app/(protected)/layout.tsx" components/sidebar/dashboard-sidebar.tsx
git commit -m "feat(reports): hide location-wide report nav items for read_own users"
```

---

## Task 3: Page guards — redirect read_own off location-wide reports

**Files (add the guard to each):**
- `app/(protected)/report/sales/page.tsx`
- `app/(protected)/report/cashflow/page.tsx`
- `app/(protected)/report/top-selling/page.tsx`
- `app/(protected)/report/credit/page.tsx`
- `app/(protected)/report/refunds/page.tsx`
- `app/(protected)/report/voids/page.tsx`
- `app/(protected)/report/stock/page.tsx`
- `app/(protected)/report/staff/page.tsx`
- `app/(protected)/report/expense/page.tsx`

**Interfaces:**
- Consumes: `requireReportsReadAll()` (Task 1).

- [ ] **Step 1: For each of the 9 pages, add the guard as the FIRST statement** of the default exported `async function` page component — immediately after `const resolved = await searchParams;` where present, otherwise as the first line of the body. Add the import at the top of each file:

```typescript
import { requireReportsReadAll } from "@/lib/auth-utils";
```

and the guard call (before ANY data fetch / `Promise.all`):

```typescript
  await requireReportsReadAll();
```

Example (`top-selling/page.tsx`):
```typescript
export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();        // ← added
  const q = resolved.search ?? "";
  // …
```

- [ ] **Step 2: Per-page caveat — confirm each is a server component.** Before editing, check the top of each file. If a page is `"use client"` (it can't call the async server guard), do NOT add the import there; instead note it and guard its data at the server boundary (its server action already runs server-side; the backend 403 + the existing `.catch(()=>null)` empty-state is the backstop). Report any page you handled this way. (Expectation: the data-fetching report pages are RSC `async function`s; `sold-items` is intentionally NOT in this list.)

- [ ] **Step 3: Verify.** Run: `npx tsc --noEmit 2>&1 | grep -iE 'report/(sales|cashflow|top-selling|credit|refunds|voids|stock|staff|expense)'`
Expected: empty. Then `npx next lint` clean on these.

- [ ] **Step 4: Manual check** (read_own account or temporary forced-false): navigating directly to e.g. `/report/top-selling` redirects to `/dashboard`; `/report/sold-items` still loads (shows own data); with `read_all`, all load normally.

- [ ] **Step 5: Commit.**

```bash
git add "app/(protected)/report/sales/page.tsx" "app/(protected)/report/cashflow/page.tsx" "app/(protected)/report/top-selling/page.tsx" "app/(protected)/report/credit/page.tsx" "app/(protected)/report/refunds/page.tsx" "app/(protected)/report/voids/page.tsx" "app/(protected)/report/stock/page.tsx" "app/(protected)/report/staff/page.tsx" "app/(protected)/report/expense/page.tsx"
git commit -m "feat(reports): redirect read_own users off location-wide report pages"
```

---

## Task 4: Dashboard home — gate the report-backed cards

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx` (read the flag, pass it down)
- Modify: `components/dashboard/Dashboard.tsx` (`Props` += `reportsReadAll`; conditionally render the report cards)

**Interfaces:**
- Consumes: `AuthToken.reportsReadAll` (Task 1).

- [ ] **Step 1: Read + pass the flag** in `app/(protected)/dashboard/page.tsx`. Add the import + read, and the prop:

```typescript
import { getAuthToken } from "@/lib/auth-utils";
// …
export default async function DashboardPage() {
  const authToken = await getAuthToken();
  // … existing Promise.all fetches …
  return (
    <PageShell>
      <Dashboard
        locationId={location?.id ?? null}
        inventorySummary={summary}
        prepaid={prepaid}
        reportsReadAll={authToken?.reportsReadAll ?? true}
      />
    </PageShell>
  );
}
```

- [ ] **Step 2: Add the prop + gate the report cards** in `components/dashboard/Dashboard.tsx`. Add to `Props`:

```typescript
  /** When false (read_own), the report-backed cards (overview/top-selling/payment) are hidden. */
  reportsReadAll?: boolean;
```

Accept it (default `true`): `({ locationId, inventorySummary, prepaid, reportsReadAll = true }) =>`. Then wrap ONLY the three **report-backed** render sites with `reportsReadAll && ( … )` — `DashboardHeroCards` (overview), `SalesKpiStrip` (overview + top seller), and the `TopSellingCard` + `PaymentMethodsCard` grid. **Leave `InventoryKpiStrip` and `PrepaymentKpiStrip` unconditional** — they read inventory/prepaid data, not the `reports:read_all`-gated endpoints:

```tsx
        {reportsReadAll && <DashboardHeroCards overview={overview} loading={isLoading} />}
        {reportsReadAll && (
          <SalesKpiStrip
            overview={overview}
            topSeller={topSelling?.items?.[0] ?? null}
            loading={isLoading}
          />
        )}
        <InventoryKpiStrip summary={inventorySummary} />
        <PrepaymentKpiStrip summary={prepaid} />
        {reportsReadAll && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TopSellingCard report={topSelling} loading={isLoading} />
            <PaymentMethodsCard data={payments} loading={isLoading} />
          </div>
        )}
```

(Match the exact existing element props — only add the `reportsReadAll && (…)` wrappers; keep `InventoryKpiStrip`/`PrepaymentKpiStrip` as they were.)

- [ ] **Step 3: Verify.** Run: `npx tsc --noEmit 2>&1 | grep -iE 'dashboard/page|dashboard/Dashboard'`
Expected: empty. Then `npx next lint` clean.

- [ ] **Step 4: Manual check** (read_own / forced-false): the home shows the Inventory + Prepayment strips but NOT the hero/sales KPIs, top-selling, or payment-methods cards; with `read_all`, all cards show.

- [ ] **Step 5: Commit.**

```bash
git add "app/(protected)/dashboard/page.tsx" components/dashboard/Dashboard.tsx
git commit -m "feat(reports): hide report-backed dashboard cards for read_own users"
```

---

## Verification (whole feature)
- `npx tsc --noEmit` — no NEW errors referencing any touched file.
- `npx next lint` — clean on the touched files.
- `npx next build` — succeeds (catches RSC/client-boundary issues, e.g. an accidental server import in the client sidebar).
- Manual, with a `read_own` dashboard user (Cashier/Server role) — or temporarily force `reportsReadAll={false}` at the layout + dashboard-page render sites, verify, then revert:
  - Sidebar Reports section shows only **Dashboard** + **Sold items report**.
  - Direct URL to any of the 9 location-wide reports → redirects to `/dashboard`.
  - `/report/sold-items` loads (own data); home shows Inventory + Prepayment strips only.
  - As owner/manager (`read_all`): everything visible/loads as before (no regression).

## Plan self-review notes (resolved)
- Spec §4.1 (permission surface) → Task 1; §4.2 (nav) → Task 2; §4.3 (page guard) → Task 3; §4.4 (home cards) → Task 4; §4.5 (backstop) → the existing `.catch(()=>null)` stays untouched.
- Spec §8.1 (claim format): resolved — `permissions` string-key claim, confirmed backend-side; decode mirrors `extractInternalPermissions`.
- Spec §8.2 (exact list): resolved — the 9 location-wide links in Global Constraints + `LOCATION_WIDE_REPORT_LINKS`; `sold-items` kept (force-scoped).
- Spec §8.3 (session readability): resolved — `getAuthToken()` is read in the server `(protected)/layout.tsx` and `dashboard/page.tsx` and prop-drilled to the client sidebar/Dashboard; the page guard reads `getAuthToken()` server-side directly.
- Spec testing line ("unit-test the helper + menu logic") is superseded by repo reality (no test runner) → verification is `tsc`/`lint`/`build`/manual per the Global Constraints. Adding a runner is an out-of-scope follow-up.
- Names cross-checked: `reportsReadAll` (AuthToken + props + MenuItemArgType), `requireReportsReadAll` (auth-utils → pages), `LOCATION_WIDE_REPORT_LINKS` (reports-access → menu_items), `extractPermissions` (jwt-utils → auth-utils) — consistent across tasks.
