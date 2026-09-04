/**
 * Identifying a package tier.
 *
 * The billing service's PackageResponse carries NO `code` field — see
 * Settlo-Billing-Service `packages/dto/PackageResponse.java`. The catalogue
 * identifies plans by `name` alone: 'SETTLO BASIC', 'SETTLO STANDARD',
 * 'SETTLO PROFESSIONAL', 'SETTLO ENTERPRISE' (migrations V4/V5).
 *
 * The frontend `Package` type declares an optional `code` that the packages
 * endpoint never populates, so every `plan.code?.includes(...)` test evaluated
 * to `undefined` and silently took the falsy branch. Derive the tier from the
 * name instead, which is the only identifier the API actually returns.
 */

export type PlanTier =
  | "BASIC"
  | "STANDARD"
  | "PROFESSIONAL"
  | "ENTERPRISE";

const TIERS: readonly PlanTier[] = [
  "BASIC",
  "STANDARD",
  "PROFESSIONAL",
  "ENTERPRISE",
];

/**
 * The tier a package belongs to, or null when its name matches none (a
 * newly-added plan, or one renamed in the admin catalogue). Callers must treat
 * null as "no special handling" rather than assuming a default.
 */
export function planTier(pkg: { name?: string | null }): PlanTier | null {
  const name = (pkg.name ?? "").toUpperCase();
  return TIERS.find((tier) => name.includes(tier)) ?? null;
}
