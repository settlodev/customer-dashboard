import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { AccountsListView } from "@/components/admin/accounts-list-view";
import { BulkRepublishButton } from "@/components/admin/bulk-republish-button";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import {
  getAccountOnboardingCounts,
  listAccounts,
} from "@/lib/actions/admin/accounts";
import {
  AccountOnboardingCounts,
  AdminAccountListPage,
  OnboardingState,
} from "@/types/admin/account";

// This page is driven entirely by URL search params — page/limit, sort, search,
// and the onboarding/status/date filters. Force dynamic rendering so every param
// change re-runs this Server Component with the *new* params. Without it, Next's
// client Router Cache serves a prefetched, param-less copy of the route, so the
// backend keeps receiving page=0&size=10 with no filters and paging/sort/filter/
// search all silently no-op even though the URL updates.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accounts",
};

const ONBOARDING_STATES: OnboardingState[] = [
  "EMAIL_UNVERIFIED",
  "BUSINESS_INCOMPLETE",
  "LOCATION_INCOMPLETE",
  "COMPLETE",
];

interface AccountsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    active?: string;
    state?: string;
    from?: string;
    to?: string;
    sort?: string;
  }>;
}

// Whitelist the columns the UI exposes as sortable — keeps an arbitrary
// `?sort=` from reaching JPA as an unknown property path.
const SORTABLE_FIELDS = new Set(["fullName", "createdAt"]);

function parseSort(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const [field, dirRaw] = value.split(",");
  if (!SORTABLE_FIELDS.has(field)) return undefined;
  return `${field},${dirRaw === "asc" ? "asc" : "desc"}`;
}

function parseOnboardingState(value: string | undefined): OnboardingState | undefined {
  if (!value) return undefined;
  return ONBOARDING_STATES.includes(value as OnboardingState)
    ? (value as OnboardingState)
    : undefined;
}

function parseActive(
  rawActive: string | undefined,
  rawStatus: string | undefined,
): boolean | undefined {
  if (rawActive === "true") return true;
  if (rawActive === "false") return false;
  if (rawStatus === "active") return true;
  if (rawStatus === "inactive") return false;
  return undefined;
}

function dayBounds(from: string | undefined, to: string | undefined) {
  const isDay = (s: string | undefined): s is string =>
    !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const fromIso = isDay(from) ? `${from}T00:00:00Z` : undefined;
  // Upper bound is exclusive — push one day past `to` so the picked end-day
  // is included.
  let toIso: string | undefined;
  if (isDay(to)) {
    const d = new Date(`${to}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    toIso = d.toISOString();
  }
  return { fromIso, toIso };
}

export default async function AdminAccountsPage({
  searchParams,
}: AccountsPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canRead = hasInternalPermission(token, PERM.ACCOUNTS_READ);
  const canManage = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);
  const canSuspend = hasInternalPermission(token, PERM.ACCOUNTS_SUSPEND);
  const canDelete = hasInternalPermission(token, PERM.ACCOUNTS_DELETE);

  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Accounts"
            subtitle="You don't have permission to view accounts."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  // DataTable uses 1-indexed `?page=` in the URL; the backend expects
  // 0-indexed. Centralise the conversion here so the rest of the file
  // doesn't have to think about it.
  const pageOneIndexed = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1,
  );
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "10", 10) || 10);
  const search = params.search?.trim() || undefined;
  const active = parseActive(params.active, params.status);
  const onboardingState = parseOnboardingState(params.state);
  const sort = parseSort(params.sort);
  const { fromIso, toIso } = dayBounds(params.from, params.to);

  let pageData: AdminAccountListPage | null = null;
  let counts: AccountOnboardingCounts = {
    total: 0,
    emailUnverified: 0,
    businessIncomplete: 0,
    locationIncomplete: 0,
    complete: 0,
  };
  let loadError: string | null = null;
  try {
    [pageData, counts] = await Promise.all([
      listAccounts({
        page: backendPage,
        size,
        sort,
        search,
        active,
        onboardingState,
        createdFrom: fromIso,
        createdTo: toIso,
      }),
      getAccountOnboardingCounts({
        search,
        active,
        createdFrom: fromIso,
        createdTo: toIso,
      }),
    ]);
  } catch (error: any) {
    loadError =
      error?.message ?? "Failed to load accounts. Please try again.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Accounts"
          subtitle="Filter by onboarding state and registration date to triage stalled signups across whitelabels."
          actions={canManage ? <BulkRepublishButton /> : undefined}
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <AccountsListView
              initialPage={pageData!}
              counts={counts}
              initialStatus={
                active === undefined
                  ? "all"
                  : active
                    ? "active"
                    : "inactive"
              }
              initialOnboardingState={onboardingState ?? "all"}
              initialFrom={params.from ?? null}
              initialTo={params.to ?? null}
              canSuspend={canSuspend}
              canDelete={canDelete}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
