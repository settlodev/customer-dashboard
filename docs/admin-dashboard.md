# Internal Admin Dashboard

The admin dashboard is a route group inside this Next.js app, served on the
`admin.` subdomain. It is for Settlo internal staff only. There is no
self-service registration — staff users are created from inside the dashboard
itself (after a `SYSTEM_ADMIN` has been bootstrapped via the Auth Service).

## URL layout

| Browser URL                              | Internal route                                          |
| ---------------------------------------- | ------------------------------------------------------- |
| `admin.settlo.co.tz/login`              | `app/(admin)/admin/login/page.tsx`                      |
| `admin.settlo.co.tz/dashboard`          | `app/(admin)/admin/dashboard/page.tsx`                  |
| `admin.settlo.co.tz/users`              | `app/(admin)/admin/users/page.tsx`                      |
| `admin.settlo.co.tz/support-agents`     | `app/(admin)/admin/support-agents/page.tsx`             |
| `admin.settlo.co.tz/accounts`           | `app/(admin)/admin/accounts/page.tsx`                   |
| `admin.settlo.co.tz/accounts/[id]`      | `app/(admin)/admin/accounts/[id]/page.tsx`              |
| `admin.settlo.co.tz/customers`          | `app/(admin)/admin/customers/page.tsx`                  |
| `admin.settlo.co.tz/businesses`         | `app/(admin)/admin/businesses/page.tsx`                 |
| `admin.settlo.co.tz/businesses/[id]`    | `app/(admin)/admin/businesses/[id]/page.tsx`            |
| `admin.settlo.co.tz/billing?businessId=…`| `app/(admin)/admin/billing/page.tsx`                    |
| `admin.settlo.co.tz/analytics`          | `app/(admin)/admin/analytics/page.tsx`                  |

`middleware.ts` detects the `admin.` host and rewrites inbound paths
(`/dashboard` → `/admin/dashboard`) so the URL bar stays clean while the
route group at `app/(admin)/admin/*` does the routing.

## Required env vars

In addition to the standard customer-dashboard env, the admin dashboard
needs:

```
REPORTS_INTERNAL_SECRET=...
```

This must match `internal.api.secret` in the Reports Service deployment.
It is held only on the Next.js server and never exposed to the browser —
server actions in `lib/actions/admin/analytics.ts` proxy through
`lib/reports-internal-client.ts`, which attaches the secret as
`X-Internal-Secret` on requests to `/api/v2/internal/metrics/saas/*`.

Optional override:

```
NEXT_PUBLIC_ADMIN_HOST=admin.settlo.co.tz
```

Used by the cross-domain leak guard in middleware to redirect any
staff-tokened cookie that lands on the apex domain back to the admin host.
Defaults to `admin.settlo.co.tz` in production, `admin.${apex_host}` in
development.

## Local development

`*.localhost` resolves to `127.0.0.1` on macOS by default. To exercise the
admin dashboard locally:

```
npm run dev
# Customer dashboard:   http://localhost:3000
# Admin dashboard:      http://admin.localhost:3000
```

Linux developers may need `127.0.0.1 admin.localhost` in `/etc/hosts`.

## Bootstrapping the first SYSTEM_ADMIN

The dashboard's create-user form requires an existing `SYSTEM_ADMIN` to be
logged in. To create the first one, call the Auth Service's
service-to-service endpoint directly:

```bash
curl -X POST "$AUTH_SERVICE_URL/internal/internal-users" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: $AUTH_INTERNAL_SECRET" \
  -d '{
    "email": "founder@settlo.co.tz",
    "password": "long-strong-password-12+chars",
    "role": "SYSTEM_ADMIN"
  }'
```

After this, the user can sign in at `admin.settlo.co.tz/login` and create
additional staff from the **Internal Users** page.

## Vercel deployment

To serve the admin dashboard on Vercel:

1. **Add the domain.** Project Settings → Domains → Add `admin.settlo.co.tz`.
   Vercel will issue a TLS cert automatically.
2. **Configure env vars.** Project Settings → Environment Variables. Add
   `REPORTS_INTERNAL_SECRET` (Production + Preview as appropriate). All
   other env vars already exist for the customer dashboard.
3. **Wildcard subdomains.** If you also want preview-deployment admin
   support, add a wildcard like `admin-*.vercel.app` or route via the
   `?_admin=1` query escape that `middleware.ts` honours.

Single build, single Vercel project — no separate deployment.

## Role gating

| Capability                       | Roles allowed                                     |
| -------------------------------- | ------------------------------------------------- |
| Sign in                          | Any `InternalRole`                                |
| Dashboard KPIs                   | `SYSTEM_ADMIN`, `SUPER_ADMIN`, `BOARD_MEMBER`, `SALES_TEAM` |
| Internal users — view            | `SYSTEM_ADMIN`, `SUPER_ADMIN`                     |
| Internal users — create / update / deactivate | `SYSTEM_ADMIN`                       |
| Support agents — manage          | `SYSTEM_ADMIN`, `SUPER_ADMIN`                     |
| Accounts — read                  | `SYSTEM_ADMIN`, `SUPER_ADMIN`, `SUPPORT_AGENT`    |
| Accounts — suspend / reactivate / assign staff | `SYSTEM_ADMIN`, `SUPER_ADMIN`        |
| Accounts — delete                | `SYSTEM_ADMIN`                                    |
| Customers (cross-tenant search)  | `SYSTEM_ADMIN`, `SUPER_ADMIN`, `SUPPORT_AGENT`    |
| Billing — view subscription / invoices | `SYSTEM_ADMIN`, `SUPPORT_AGENT`             |
| Billing — generate invoice / record manual payment / apply or revoke discount / issue or process refund | `SYSTEM_ADMIN`, `SUPPORT_AGENT` |
| Billing — grant free subscription | `SYSTEM_ADMIN`                                   |
| Analytics — view                 | `SYSTEM_ADMIN`, `SUPER_ADMIN`, `BOARD_MEMBER`, `SALES_TEAM` |
| Analytics — recompute            | `SYSTEM_ADMIN`, `SUPER_ADMIN`                     |

> **Note:** The Billing Service's `@PreAuthorize` checks use legacy role flags
> (`hasAnyRole('SUPPORT_AGENT', 'SYSTEM_ADMIN')`) rather than the permission
> system used by the Accounts Service. `SUPER_ADMIN` users do **not** pass
> these checks today — the UI gates billing actions to `SYSTEM_ADMIN` /
> `SUPPORT_AGENT` to match. If `SUPER_ADMIN` needs billing access, the
> Billing Service guards must be migrated to permission-based.

UI gating is for affordance only — backend `@PreAuthorize` is the actual
security boundary.

## Sentry filtering

The admin layout sets these Sentry tags on the active scope:

- `dashboard_surface=admin`
- `staff_subject_type=STAFF`
- `staff_internal_role=<role>`
- User identification via `Sentry.setUser({ id, email })`

Use `dashboard_surface:admin` in Sentry filters to isolate admin-only
errors from the customer error budget.
