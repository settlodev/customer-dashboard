/**
 * Unified feature key registry.
 *
 * Every feature key used in the dashboard MUST be defined here.
 * Keys match what the Billing Service returns in EntitlementResponse.features
 * and EntitlementResponse.limits.
 */

// ── Boolean feature keys (gates) ────────────────────────────────────
// These map to entitlements.features[key] === true/false
export const Features = {
  // Inventory & stock
  INVENTORY: "inventory",
  BOM_RULES: "bom_rules",
  MODIFIER_GROUPS: "modifier_groups",
  ADDON_GROUPS: "addon_groups",
  PURCHASE_REQUISITIONS: "purchase_requisitions",
  SUPPLIERS: "suppliers",

  // Sales & orders
  POS: "pos",
  CUSTOMERS: "customers",

  // Business operations
  TABLE_RESERVATIONS: "table_reservations",
  KITCHEN_DISPLAY: "kitchen_display",

  // Reports
  REPORTS: "reports",
} as const;

export type FeatureKey = (typeof Features)[keyof typeof Features];

// ── Numeric limit keys ──────────────────────────────────────────────
// These map to entitlements.limits[key] = number (-1 = unlimited)
export const Limits = {
  STAFF: "staff",
  INVENTORY_ITEMS: "inventory",
  LOCATIONS: "locations",
} as const;

export type LimitKey = (typeof Limits)[keyof typeof Limits];

// ── Route → feature mapping ─────────────────────────────────────────
// If a route is not listed, it's always accessible (no gate).
export const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  // Stock management
  "/bom-rules": Features.BOM_RULES,
  "/bom-analytics": Features.BOM_RULES,
  "/purchase-orders": Features.PURCHASE_REQUISITIONS,
  "/goods-received": Features.PURCHASE_REQUISITIONS,

  // Business operations
  "/spaces": Features.TABLE_RESERVATIONS,
  "/reservations": Features.TABLE_RESERVATIONS,
  "/kds": Features.KITCHEN_DISPLAY,

  // Reports
  "/report/cashflow": Features.REPORTS,
  "/report/top-selling": Features.REPORTS,
  "/report/sold-items": Features.REPORTS,
  "/report/credit": Features.REPORTS,
  "/report/refunds": Features.REPORTS,
  "/report/stock": Features.REPORTS,
  "/report/staff": Features.REPORTS,
  "/report/department": Features.REPORTS,
  "/report/expense": Features.REPORTS,
  "/report/profit-loss": Features.REPORTS,
};

// ── Feature metadata (for upgrade prompts) ──────────────────────────
export interface FeatureMeta {
  title: string;
  description: string;
  benefits: string[];
}

export const FEATURE_META: Record<string, FeatureMeta> = {
  [Features.BOM_RULES]: {
    title: "Consumption Rules",
    description:
      "Location-scoped recipes, production routings, and substitutes that drive automatic stock deduction on every sale.",
    benefits: [
      "Build recipes with nested substitutes and scrap",
      "Labor / overhead / machine rates via routing operations",
      "Consumption analytics, cost trends, and yield variance dashboards",
    ],
  },
  [Features.MODIFIER_GROUPS]: {
    title: "Modifier Groups",
    description: "Let customers customize orders with options like sizes, toppings, and extras.",
    benefits: [
      "Create modifier groups (size, spice level, extras)",
      "Set pricing per modifier option",
      "Track modifier popularity in reports",
    ],
  },
  [Features.ADDON_GROUPS]: {
    title: "Addon Groups",
    description: "Offer add-on items that pair with your products to increase order value.",
    benefits: [
      "Suggest add-ons at checkout",
      "Bundle complementary items",
      "Boost average order value",
    ],
  },
  [Features.PURCHASE_REQUISITIONS]: {
    title: "Purchase Orders",
    description: "Streamline procurement with purchase orders, approvals, and goods received tracking.",
    benefits: [
      "Create and approve purchase orders",
      "Track goods received vs ordered",
      "Manage supplier relationships and pricing",
    ],
  },
  [Features.TABLE_RESERVATIONS]: {
    title: "Tables & Reservations",
    description: "Manage table layouts, accept reservations, and reduce no-shows with deposits.",
    benefits: [
      "Visual floor plan management",
      "Online and phone reservations",
      "Deposit collection to reduce no-shows",
    ],
  },
  [Features.KITCHEN_DISPLAY]: {
    title: "Kitchen Display System",
    description: "Send orders directly to kitchen screens for faster, more accurate preparation.",
    benefits: [
      "Real-time order display in kitchen",
      "Priority and timing management",
      "Reduce order errors and wait times",
    ],
  },
  [Features.REPORTS]: {
    title: "Advanced Reports",
    description: "Get detailed insights into sales, stock, staff performance, and profitability.",
    benefits: [
      "Cash flow and profit/loss reports",
      "Top-selling and slow-moving product analysis",
      "Staff performance and department breakdowns",
    ],
  },
  [Limits.STAFF]: {
    title: "Staff Members",
    description: "Add more team members to your business.",
    benefits: [
      "Assign roles and permissions",
      "Track individual performance",
      "Manage shifts and schedules",
    ],
  },
  [Limits.INVENTORY_ITEMS]: {
    title: "Inventory Items",
    description: "Track more products and stock items.",
    benefits: [
      "Full inventory tracking",
      "Low stock alerts",
      "Batch and expiry tracking",
    ],
  },
};

/** Look up upgrade-prompt metadata for a feature or limit key. */
export function getFeatureMeta(key: string): FeatureMeta | null {
  return FEATURE_META[key] ?? null;
}

/** Look up the feature key required for a given route. null = always accessible. */
export function getRouteFeature(pathname: string): FeatureKey | null {
  return ROUTE_FEATURE_MAP[pathname] ?? null;
}
