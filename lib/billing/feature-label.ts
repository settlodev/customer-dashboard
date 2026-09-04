/**
 * Turning a package feature into the line shown on a pricing card.
 *
 * Two feature shapes are in circulation from the billing service: the
 * catalogue mapping `{ feature: { name, featureType }, featureValue }` and the
 * flat `PackageFeature` in types/billing/types.ts. `Package.features` is typed
 * `any[]`, so neither shape is enforced at the boundary and reading only one
 * silently yields `undefined` — which is how limit values went missing from
 * the cards. Everything here reads both shapes and coerces defensively.
 */

export type RawPackageFeature = {
  id?: string;
  featureKey?: string;
  name?: string;
  featureType?: string;
  featureValue?: unknown;
  isIncluded?: boolean;
  feature?: {
    id?: string;
    name?: string;
    featureType?: string;
  };
};

export function featureName(f: RawPackageFeature): string {
  return f.feature?.name ?? f.name ?? "";
}

export function featureTypeOf(f: RawPackageFeature): string | undefined {
  return f.feature?.featureType ?? f.featureType;
}

export function featureKeyOf(
  f: RawPackageFeature,
  fallback: number,
): string | number {
  return f.feature?.id ?? f.id ?? f.featureKey ?? fallback;
}

export function formatFeatureLabel(f: RawPackageFeature): string {
  const name = featureName(f);
  const raw = f.featureValue;

  // Coerced and trimmed. The previous strict `=== "-1"` / `=== "true"`
  // comparisons failed whenever the service sent a number or boolean instead
  // of a string, and the value was then dropped from the label entirely.
  const value = raw === null || raw === undefined ? "" : String(raw).trim();

  if (value === "") return name;

  const lower = value.toLowerCase();
  if (lower === "true" || lower === "false") return name;

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    // Negative is the service's "no ceiling" sentinel (-1 in practice).
    if (numeric < 0) {
      return `Unlimited ${name.replace(/ Limit$/i, "")}`.trim();
    }
    // Shown regardless of featureType: a numeric ceiling is what a visitor
    // compares plans on, and gating it behind an exact
    // `featureType === "LIMIT"` match is what hid it when that field arrived
    // under the other shape.
    return `${name}: ${numeric.toLocaleString("en-US")}`;
  }

  // Non-numeric, non-boolean (e.g. a tier label like "Advanced").
  return featureTypeOf(f) === "LIMIT" ? `${name}: ${value}` : name;
}
