# Dashboard — `read_own` Reports Gating

> Spec — generated 2026-06-19, Customer-Dashboard (Next.js App Router). Status: **DESIGN APPROVED, awaiting spec review → plan.**

---

## 1. Goal / context

The Analytics/Reports Service now enforces `reports:read_all` vs `reports:read_own` (a POS-reports port + cross-service permission fix). The dashboard's location-wide report endpoints now **403 for a `read_own` token** (e.g. a dashboard-access cashier/server whose role carries only `reports:read_own`). The dashboard already degrades a 403 gracefully (server actions `.catch(() => null)` → empty state, no crash), so this is about **experience, not breakage**: a `read_own` user should not see location-wide reports they can't use — they should see only their own scoped reports.

Per the Accounts role grants: owner = all perms (read_all); Manager/Location-Manager → `read_all`; Cashier/Server → `read_own` only; generic Staff role → neither. So **owners/managers (the typical dashboard users) are unaffected** — they keep every report. Only the uncommon `read_own`/none dashboard user is gated down.

## 2. Scope

**In scope** (UI-level gating in the dashboard):
- Surface the user's `reports:read_all` permission into the session.
- Hide every **location-wide** report (nav item + page + home card) from users without `read_all`.
- Keep **scoped** reports (the backend force-scopes them to the user's own data) visible to everyone with dashboard access.
- Redirect a `read_own` user who hits a location-wide report URL directly.

**Out of scope:**
- Server-side guarding of the remaining analytics domains (by-table, credit, refunds, voids, stock, expense, cashflow-daily) — that's a separate backend hardening follow-up. The dashboard gates these **UI-side** now; the API-level over-read on those un-guarded endpoints is tracked separately.
- Any change to the scoped reports' behavior (they already force-scope server-side).
- A full permissions framework — we surface exactly the one flag this needs (extensible later).

## 3. Permission model

A single derived boolean **`reportsReadAll`** drives all gating:
- `reportsReadAll === true` → user sees ALL reports (location-wide + scoped).
- `reportsReadAll === false` (i.e. `read_own` or none) → user sees ONLY scoped reports.

**Location-wide vs scoped — the rule:** a report is *location-wide* (gate by `read_all`) if it shows all-staff / all-location aggregates; it is *scoped* (keep) if it shows the user's own data (the backend force-scopes it via `resolveEffectiveStaffId`).

| Report | Class | Action for `read_own` |
|---|---|---|
| Sales (category / department / product / table tabs) | location-wide | hide |
| Top-selling | location-wide | hide |
| Cashflow | location-wide | hide |
| Credit, Refunds, Voids, Stock, Expense | location-wide | hide |
| Staff report (all-staff leaderboard) | location-wide | hide |
| Dashboard home — overview KPIs + top-selling card | location-wide | hide the cards (keep the page) |
| Sold-items (server force-scopes to own) | scoped | keep |
| Any "my own performance" view | scoped | keep |

The exact page/route list is pinned in the implementation plan via a quick per-page verification (each report page's server action → which endpoint → location-wide or force-scoped).

## 4. Architecture (5 components)

### 4.1 Permission surface
- Add `extractPermissions(accessToken: string): string[]` in `lib/jwt-utils.ts` — reads the JWT **`permissions`** claim (the business-permission keys), mirroring the existing `extractInternalPermissions` (which reads `internal_permissions`). (Open item 8.1: confirm the claim is string keys, not numeric perm-ids.)
- In `lib/auth-utils.ts` `createAuthTokenFromLogin` (the USER-login path that currently skips permissions), derive `reportsReadAll = extractPermissions(accessToken).includes('reports:read_all')` and set it on the `AuthToken`.
- Add `reportsReadAll?: boolean` to the `AuthToken` type (`types/types.ts`) and thread it through the NextAuth `jwt` + `session` callbacks (`auth.ts`) so it's readable server-side (`getAuthToken()`) and in the session.
- One server helper, e.g. `hasReportsReadAll(): Promise<boolean>` (reads `getAuthToken()`), in a small `lib/permissions.ts`.

### 4.2 Nav gating
- `types/menu_items.ts`: `getNormalMenuItems` accepts `hasReportsReadAll: boolean` and conditionally includes the location-wide report items (mirrors the existing `hasDepartmentsModule` conditional spread). Scoped report items stay unconditionally.
- `components/sidebar/sidebar.tsx`: compute `hasReportsReadAll` (from the session/auth token, same shape as the `hasDepartmentsModule` plumb) and pass it to `menuItems(...)`.

### 4.3 Page guard
- A server helper `requireReportsReadAll()` in `lib/permissions.ts`: `if (!(await hasReportsReadAll())) redirect('/dashboard')`.
- Call it at the top of each location-wide report page's server component (App Router). Per-page guards (not middleware) — explicit, colocated, and the location-wide set lives next to the pages.

### 4.4 Home cards
- `/dashboard` (the landing page) can't be redirected. Conditionally render its location-wide widgets (overview KPIs, top-selling card) behind `hasReportsReadAll`. A `read_own` user gets a leaner home (scoped widgets / a "limited access" note).

### 4.5 Defense-in-depth backstop
- Keep the existing `.catch(() => null)` → empty-state on the report server actions. If any location-wide call slips through the gating, it still degrades to empty rather than erroring.

## 5. Data flow

```
login (USER) → decode access-token `permissions` claim → reportsReadAll on AuthToken/session
   → sidebar: hide location-wide report nav items when !reportsReadAll
   → location-wide report page: requireReportsReadAll() → redirect('/dashboard') when !reportsReadAll
   → /dashboard: render location-wide cards only when reportsReadAll
```

## 6. Error handling
- The gating prevents a `read_own` user from reaching location-wide reports, so the 403 path is mostly avoided. The existing `.catch(() => null)` empty-state remains as the backstop for any un-gated call.
- No new error UI is required (a permission denial degrades to "hidden" / redirect, not an error banner).

## 7. Testing
- **Unit:** the permission helper (`extractPermissions` parses the claim; `reportsReadAll` derivation) and the menu-visibility logic (`menuItems({hasReportsReadAll:false})` excludes the location-wide items and includes the scoped ones; `true` includes all).
- **Manual:** log in as a `read_own` dashboard user → Reports nav shows only scoped items; direct URL to a location-wide report redirects to `/dashboard`; home omits the location-wide cards. Log in as owner/manager → everything visible as before.

## 8. Open items (verify during planning)
- **8.1** Confirm the USER access token's `permissions` claim is string keys (e.g. `reports:read_all`) and not numeric perm-ids; if perm-ids, resolve via the same mechanism the app/services use. (The analytics service reads it as strings, so this is very likely already keys.)
- **8.2** Pin the exact location-wide vs scoped page list by tracing each report page's server action to its endpoint (location-wide = `requireReadAll`-guarded or all-staff; scoped = `resolveEffectiveStaffId`-scoped).
- **8.3** Confirm where `getAuthToken()`/the session is readable in both `sidebar.tsx` (nav) and the report page server components (guard) without extra round-trips.
