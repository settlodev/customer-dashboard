/**
 * Customer-facing display names for product/stock variants.
 *
 * Every product and stock has at least one variant, so a bare variant name
 * ("300ml") is meaningless on its own — the UI must always render it together
 * with the parent name ("Coca-Cola 300ml"). The Inventory Service composes a
 * `displayName` for exactly this (`StockVariant.computeDisplayName` /
 * `ProductVariant.computeDisplayName`), but migrated rows can carry a bare or
 * blank value, and several line-item DTOs only send the raw variant name.
 * This module is the single client-side composition/fallback used by every
 * surface.
 *
 * Collapse rules (superset of the backend's compose rule, so applying it to
 * an already-composed name is a no-op):
 * - variant name equals parent name (case-insensitive) → parent name only
 *   (the "no real variant" case: never "Coca-Cola Coca-Cola")
 * - `collapseDefault` and the variant is the conventional "Default"
 *   placeholder → parent name only
 * - variant name already contains the parent name → variant name as-is
 * - otherwise → "{parent} {variant}"
 */
export interface ItemNameParts {
  /** Parent product/stock name. */
  parentName?: string | null;
  /** The variant's own name (e.g. "300ml"). */
  variantName?: string | null;
  /**
   * Backend-composed display name, when the DTO carries one. May be bare on
   * migrated rows — when a parent name is in scope it gets re-composed, which
   * is a no-op for healthy values.
   */
  displayName?: string | null;
  /**
   * Collapse a variant literally named "Default" down to the parent name.
   * Pass true when the variant is known to be its parent's only variant (or
   * when sibling counts are unknowable and "Default" is in practice always
   * the auto-created placeholder, e.g. report rows).
   */
  collapseDefault?: boolean;
}

const clean = (value: string | null | undefined): string => (value ?? "").trim();

/**
 * Compose "{parent} {variant}" with the collapse rules above. Prefer
 * {@link itemDisplayName} unless both names are guaranteed present.
 */
export function composeItemName(
  parentName: string | null | undefined,
  variantName: string | null | undefined,
  collapseDefault = false,
): string {
  const p = clean(parentName);
  const v = clean(variantName);
  if (!v) return p;
  if (!p) return v;
  if (v.toLowerCase() === p.toLowerCase()) return p;
  if (collapseDefault && v.toLowerCase() === "default") return p;
  if (v.toLowerCase().includes(p.toLowerCase())) return v;
  return `${p} ${v}`;
}

/**
 * Best display name from whatever fields the DTO carries. With a parent name
 * in scope the result is always composed locally — over the variant name when
 * present, else over the backend `displayName` (fixes migrated rows whose
 * stored value is bare; a no-op for healthy ones). Without a parent name the
 * backend `displayName` wins, then whichever bare name exists.
 */
export function itemDisplayName(parts: ItemNameParts): string {
  const p = clean(parts.parentName);
  const v = clean(parts.variantName);
  const dn = clean(parts.displayName);
  const collapseDefault = parts.collapseDefault ?? false;
  if (p && v) return composeItemName(p, v, collapseDefault);
  if (p && dn) return composeItemName(p, dn, collapseDefault);
  return dn || v || p;
}

/**
 * Two-tone rendering split for cards that style the parent name and the
 * variant remainder differently (e.g. bold "Coca-Cola" + muted "300ml").
 * `primary` is always safe to render on its own; `secondary` is the rest of
 * the composed name, or null when there is nothing to add. Robust to
 * `variantName` arriving either bare ("300ml") or already composed
 * ("Coca-Cola 300ml").
 */
export function splitItemName(parts: ItemNameParts): {
  primary: string;
  secondary: string | null;
} {
  const full = itemDisplayName(parts);
  const p = clean(parts.parentName);
  if (!p || full.toLowerCase() === p.toLowerCase()) {
    return { primary: full, secondary: null };
  }
  if (full.toLowerCase().startsWith(p.toLowerCase())) {
    const rest = full.slice(p.length).trim();
    return rest
      ? { primary: full.slice(0, p.length), secondary: rest }
      : { primary: full, secondary: null };
  }
  // Variant name embeds the parent somewhere else ("300ml Coca-Cola") —
  // no clean split, render the whole thing as the primary text.
  return { primary: full, secondary: null };
}
