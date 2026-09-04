/**
 * Identifying a package tier.
 *
 * `code` is the real identifier: billing seeds LOCATION packages as BASIC /
 * STANDARD / PROFESSIONAL / ENTERPRISE, and STORE/WAREHOUSE packages as
 * `<ENTITY_TYPE>_<TIER>`. It is what PackageService.getTrialPackage() resolves
 * a chosen plan by.
 *
 * The field is absent from PackageResponse on the services' older `main` line,
 * so fall back to deriving the tier from `name` ('SETTLO BASIC' … 'SETTLO
 * ENTERPRISE'). That keeps the landing page correct against either deployment
 * rather than silently mis-tiering every plan when `code` is missing.
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
export function planTier(pkg: {
  code?: string | null;
  name?: string | null;
}): PlanTier | null {
  const code = (pkg.code ?? "").toUpperCase();
  const fromCode = TIERS.find((tier) => code.includes(tier));
  if (fromCode) return fromCode;

  const name = (pkg.name ?? "").toUpperCase();
  return TIERS.find((tier) => name.includes(tier)) ?? null;
}
