import { Permission } from "@/types/permissions/type";

// ---------------------------------------------------------------------------
// Permission display grouping
//
// Permissions arrive as flat `<resource>:<action>` keys (e.g. "cash:cash_in",
// "pos:products:view"). The Accounts Service tags each one with a high-level
// `group` (domain). For display we render a two-level structure:
//
//   Domain (group)  →  Resource (category)  →  permissions (by name)
//
// e.g. "Point of Sale" → "Cash" → [Cash In, Cash Out, Open Cash Drawer]
//
// Always label a permission with its backend `name` ("Cash In") and surface its
// `description` as a tooltip — never the raw key segment, which is ambiguous
// (e.g. both "pos:products:view" and "pos:products:price_override" share the
// "products" segment but mean very different things).
// ---------------------------------------------------------------------------

// Preferred order of domains. Anything not listed sorts after these, alphabetically.
export const DOMAIN_ORDER: string[] = [
  "Point of Sale",
  "Inventory",
  "Back Office",
  "Accounting",
  "Financing",
  "Reservations",
  "Gift Cards",
  "Customer Prepayments",
  "Fund Transfers",
  "Recipes & BOM",
  "Gamification",
  "Other",
];

// Tokens that should render fully upper-cased rather than title-cased.
const ACRONYMS = new Set([
  "pos",
  "kds",
  "bom",
  "ar",
  "kpi",
  "sku",
  "vat",
  "gl",
  "rfq",
  "lpo",
  "grn",
  "pr",
  "id",
  "kra",
]);

function titleizeWord(word: string): string {
  if (!word) return word;
  if (ACRONYMS.has(word.toLowerCase())) return word.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Humanize a snake_case resource category into a Title Case label ("split_bills" → "Split Bills"). */
export function humanizeCategory(category: string): string {
  if (!category) return "Other";
  return category.split("_").map(titleizeWord).join(" ");
}

/**
 * Best-effort label for a permission key when the catalog has no `name` for it
 * (a removed or custom key). Humanizes everything after the first ":".
 * "cash:cash_in" → "Cash In", "pos:products:view" → "Products View".
 */
export function humanizeKeyTail(key: string): string {
  const idx = key.indexOf(":");
  const tail = idx === -1 ? key : key.slice(idx + 1);
  return tail.split(/[:_]/).map(titleizeWord).join(" ");
}

export function domainOf(perm: Pick<Permission, "group">): string {
  return perm.group || "Other";
}

export interface ResourceGroup {
  category: string; // raw, e.g. "split_bills"
  label: string; // humanized, e.g. "Split Bills"
  permissions: Permission[];
}

export interface DomainGroup {
  domain: string; // e.g. "Point of Sale"
  count: number; // total permissions across all resources in the domain
  resources: ResourceGroup[];
}

function domainRank(domain: string): number {
  const i = DOMAIN_ORDER.indexOf(domain);
  return i === -1 ? DOMAIN_ORDER.length : i;
}

/**
 * Group a flat list of permissions into domain → resource → permissions, fully
 * sorted for display (domains by preferred order, resources & permissions
 * alphabetically by their display label).
 */
export function groupByDomain(perms: Permission[]): DomainGroup[] {
  const byDomain = new Map<string, Map<string, Permission[]>>();

  for (const perm of perms) {
    const domain = domainOf(perm);
    const category = perm.category || "other";
    if (!byDomain.has(domain)) byDomain.set(domain, new Map());
    const resources = byDomain.get(domain)!;
    if (!resources.has(category)) resources.set(category, []);
    resources.get(category)!.push(perm);
  }

  const domains: DomainGroup[] = [];
  for (const [domain, resourceMap] of byDomain) {
    const resources: ResourceGroup[] = [];
    let count = 0;
    for (const [category, permissions] of resourceMap) {
      permissions.sort((a, b) =>
        (a.name || a.key).localeCompare(b.name || b.key),
      );
      count += permissions.length;
      resources.push({ category, label: humanizeCategory(category), permissions });
    }
    resources.sort((a, b) => a.label.localeCompare(b.label));
    domains.push({ domain, count, resources });
  }

  domains.sort(
    (a, b) => domainRank(a.domain) - domainRank(b.domain) || a.domain.localeCompare(b.domain),
  );
  return domains;
}

/**
 * Resolve a role's `permissionKeys` against the account permission catalog.
 * Keys the catalog doesn't know (removed/custom) are synthesized into a
 * best-effort Permission so they still render (humanized, under "Other")
 * instead of silently vanishing.
 */
export function resolveKeys(keys: string[], catalog: Permission[]): Permission[] {
  const byKey = new Map(catalog.map((p) => [p.key, p]));
  return keys.map((key) => {
    const hit = byKey.get(key);
    if (hit) return hit;
    const category = key.includes(":") ? key.slice(0, key.indexOf(":")) : "other";
    return {
      id: key,
      accountId: "",
      key,
      name: humanizeKeyTail(key),
      description: null,
      system: false,
      category,
      group: "Other",
      createdAt: "",
      updatedAt: "",
    } satisfies Permission;
  });
}
