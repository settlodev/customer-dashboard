/**
 * Maps menu item routes to entitlement feature keys.
 * Used by the sidebar to show upgrade badges on items
 * the current entity's plan doesn't include.
 *
 * If a route is not listed here, it's always accessible (no feature gate).
 * Feature keys must match the keys in EntitlementItem.features from the billing API.
 */
export const MENU_FEATURE_MAP: Record<string, string> = {
  // Stock management
  "/recipes": "stock_consumption_rules",
  "/modifiers": "modifier_groups",
  "/addons": "addon_groups",
  "/stock-purchases": "purchase_requisitions",
  "/goods-received": "purchase_requisitions",

  // Business operations
  "/spaces": "table_reservations",
  "/reservations": "table_reservations",
  "/kds": "kitchen_display",

  // Reports
  "/report/cashflow": "reports",
  "/report/top-selling": "reports",
  "/report/sold-items": "reports",
  "/report/credit": "reports",
  "/report/refunds": "reports",
  "/report/stock": "reports",
  "/report/staff": "reports",
  "/report/department": "reports",
  "/report/expense": "reports",
  "/report/profit-loss": "reports",
};

/**
 * Feature metadata for upgrade prompts.
 * title + description shown when user navigates to a locked feature.
 */
export const FEATURE_METADATA: Record<string, { title: string; description: string; benefits: string[] }> = {
  stock_consumption_rules: {
    title: "Recipes & Consumption Rules",
    description: "Track ingredients, manage recipes, and automatically deduct stock when items are sold.",
    benefits: [
      "Create detailed recipes with ingredient breakdowns",
      "Auto-deduct raw materials on sale",
      "Track food cost percentages in real time",
    ],
  },
  modifier_groups: {
    title: "Modifier Groups",
    description: "Let customers customize orders with options like sizes, toppings, and extras.",
    benefits: [
      "Create modifier groups (size, spice level, extras)",
      "Set pricing per modifier option",
      "Track modifier popularity in reports",
    ],
  },
  addon_groups: {
    title: "Addon Groups",
    description: "Offer add-on items that pair with your products to increase order value.",
    benefits: [
      "Suggest add-ons at checkout",
      "Bundle complementary items",
      "Boost average order value",
    ],
  },
  purchase_requisitions: {
    title: "Purchase Orders",
    description: "Streamline procurement with purchase orders, approvals, and goods received tracking.",
    benefits: [
      "Create and approve purchase orders",
      "Track goods received vs ordered",
      "Manage supplier relationships and pricing",
    ],
  },
  table_reservations: {
    title: "Tables & Reservations",
    description: "Manage table layouts, accept reservations, and reduce no-shows with deposits.",
    benefits: [
      "Visual floor plan management",
      "Online and phone reservations",
      "Deposit collection to reduce no-shows",
    ],
  },
  kitchen_display: {
    title: "Kitchen Display System",
    description: "Send orders directly to kitchen screens for faster, more accurate preparation.",
    benefits: [
      "Real-time order display in kitchen",
      "Priority and timing management",
      "Reduce order errors and wait times",
    ],
  },
  reports: {
    title: "Advanced Reports",
    description: "Get detailed insights into sales, stock, staff performance, and profitability.",
    benefits: [
      "Cash flow and profit/loss reports",
      "Top-selling and slow-moving product analysis",
      "Staff performance and department breakdowns",
    ],
  },
};
