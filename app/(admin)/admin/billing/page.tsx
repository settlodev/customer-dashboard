import { permanentRedirect, redirect } from "next/navigation";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LegacyBillingPageProps {
  searchParams: Promise<{ businessId?: string; page?: string }>;
}

/**
 * Legacy alias for the now-removed top-level billing screen.
 *
 * Billing is reachable only through a business — Businesses list →
 * Business detail → Manage billing — but old bookmarks and any cached
 * pagination links from {@code BillingView} still point here, so we
 * keep the route as a redirect rather than 404'ing.
 *
 * {@code permanentRedirect} when we can resolve the business so search
 * engines and the browser cache pick up the new home; {@code redirect}
 * (temporary) to the businesses list when we can't, so a refresh
 * doesn't lock the user out of the lookup flow.
 */
export default async function LegacyAdminBillingPage({
  searchParams,
}: LegacyBillingPageProps) {
  const { businessId, page } = await searchParams;
  if (businessId && UUID_REGEX.test(businessId)) {
    const target = `/businesses/${businessId}/billing${page ? `?page=${page}` : ""}`;
    permanentRedirect(target);
  }
  redirect("/businesses");
}
