// types/menu_items.ts
import { MenuItemArgType } from "@/types/menu-item-type";
import { reportPagePermissions } from "@/lib/reports-access";
import { LOANS_ENABLED } from "@/lib/loans/config";

/**
 * A report nav entry, permission-tagged with the any-of key set that unlocks
 * its page (`dashboard_reports:read_all` or the page's per-report key —
 * lib/reports-access.ts is the single source, shared with the page guards).
 * The sidebar's fail-open `canSee` does the filtering, like every other
 * tagged nav item.
 */
const reportNavItem = (title: string, link: string, args?: MenuItemArgType) => ({
  title,
  link,
  current: args?.isCurrentItem,
  icon: "cart",
  permissions: reportPagePermissions(link),
});

export const menuItems = (args?: MenuItemArgType) => {
  // Default to normal menu if not specified
  const menuType = args?.menuType || "normal";

  if (menuType === "warehouse") {
    return getWarehouseMenuItems(args);
  }

  if (menuType === "store") {
    return getStoreMenuItems(args);
  }

  return getNormalMenuItems(args);
};

const getNormalMenuItems = (args?: MenuItemArgType) => {
  // Default to true so warehouse / loading states keep the link visible
  // until entitlements are known. The page-level UpgradeGate is the
  // backstop when a user clicks through with an underprivileged plan.
  const hasDepartmentsModule = args?.hasDepartmentsModule !== false;
  const hasPackaging = args?.hasPackaging === true; // default false (hidden)
  return [
    // Top-level link — appears as its own row in the sidebar (no submenu).
    // The page aggregates across all locations, which is meaningless for a
    // single-destination business, so those users don't get the link at all.
    ...(args?.hasMultipleDestinations
      ? [
          {
            label: "Business overview",
            link: "/business-overview",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: "inventory",
            items: [],
          },
        ]
      : []),

    // Analytics & Reporting
    {
      label: "Reports",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "dashboard",
      items: [
        // Safe landing — deliberately untagged so every dashboard user keeps
        // a home. The report-backed cards on it are gated separately
        // (dashboard_reports:read_all, see hasReportsReadAll).
        {
          title: "Dashboard",
          link: "/dashboard",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        // Each report link is tagged any-of(dashboard_reports:read_all, its
        // per-report key) via reportNavItem, so reports are individually
        // grantable (e.g. Sales but not Stock). Same key source as the page
        // guards. The POS-only reports:read_own/read_all unlock none of them.
        reportNavItem("Sales report", "/report/sales", args),
        reportNavItem("Cashflow report", "/report/cashflow", args),
        reportNavItem("Top selling report", "/report/top-selling", args),
        // Sold items additionally accepts dashboard_reports:read_own (shown
        // own-scoped by the backend for staff without an all-tier).
        reportNavItem("Sold items report", "/report/sold-items", args),
        // reportNavItem("Credit report", "/report/credit", args),
        reportNavItem("Refund report", "/report/refunds", args),
        reportNavItem("Voids report", "/report/voids", args),
        reportNavItem("Tax report", "/report/tax", args),
        // Combined daily Z-report: the local close-of-day roll-up for a
        // business date beside the TRA fiscal (VFD) Z for the same date.
        // Shown to every location — the fiscal half simply reports "no VFD
        // registration" where the location doesn't print fiscal receipts.
        reportNavItem("Z-report", "/report/z-report", args),
        reportNavItem("Stock report", "/report/stock", args),
        ...(hasPackaging
          ? [reportNavItem("Packaging report", "/report/packaging", args)]
          : []),
        reportNavItem("Staff report", "/report/staff", args),
        reportNavItem("Expense report", "/report/expense", args),
      ],
    },

    // Inventory Management
    {
      label: "Inventory management",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "inventory",
      items: [
        ...(hasDepartmentsModule
          ? [
              {
                title: "Departments",
                link: "/departments",
                current: args?.isCurrentItem,
                icon: "folder",
                permission: "departments:read",
              },
            ]
          : []),
        {
          title: "Categories",
          link: "/categories",
          current: args?.isCurrentItem,
          icon: "tag",
          permission: "categories:read",
        },
        {
          title: "Products",
          link: "/products",
          current: args?.isCurrentItem,
          icon: "package",
          permission: "products:read",
        },
        {
          title: "Brands",
          link: "/brands",
          current: args?.isCurrentItem,
          icon: "tag",
          // Brands live in the product catalogue — gate with products:read.
          permission: "products:read",
        },
        {
          title: "Bundles",
          link: "/product-collections",
          current: args?.isCurrentItem,
          icon: "folder",
          permission: "products:read",
        },
        {
          title: "Modifier groups",
          link: "/modifier-groups",
          current: args?.isCurrentItem,
          icon: "tag",
          permission: "modifiers:read",
        },
        {
          title: "Addon groups",
          link: "/addon-groups",
          current: args?.isCurrentItem,
          icon: "tag",
          // Addons are a modifier family — same gate as modifier groups.
          permission: "modifiers:read",
        },
      ],
    },

    // Stock Management
    {
      label: "Stock management",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "stock",
      items: [
        {
          title: "Stock items",
          link: "/stock-variants",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
        {
          title: "Stock categories",
          link: "/stock-categories",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
        {
          title: "Stock intake",
          link: "/stock-intakes",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
        {
          title: "Stock modification",
          link: "/stock-modifications",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "adjustments:read",
        },
        {
          title: "Stock usage",
          link: "/stock-usages",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "stock_usage:read",
        },
        {
          title: "Stock take",
          link: "/stock-takes",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "stocktake:read",
        },
        {
          title: "Traceability",
          link: "/traceability",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
        ...(args?.hasMultipleDestinations
          ? [
              {
                title: "Stock transfer",
                link: "/stock-transfers",
                current: args?.isCurrentItem,
                icon: "cart",
                permission: "transfers:read",
              },
            ]
          : []),
        {
          title: "Consumption Rules",
          link: "/bom-rules",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "bom:read",
        },
        {
          title: "Consumption Analytics",
          link: "/bom-analytics",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "bom:read",
        },
        ...(args?.hasMultipleDestinations
          ? [
              {
                title: "Stock request",
                link: "/stock-requests",
                current: args?.isCurrentItem,
                icon: "truck-return",
                permission: "transfer_requests:read",
              },
            ]
          : []),
        {
          title: "Units of measure",
          link: "/units",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
      ],
    },

    // Procurement — purchase-to-pay flow plus the parties on the other end
    {
      label: "Procurement",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "stock",
      items: [
        {
          title: "Suppliers",
          link: "/suppliers",
          current: args?.isCurrentItem,
          icon: "truck",
          permission: "suppliers:read",
        },
        {
          title: "Purchase requisitions",
          link: "/purchase-requisitions",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "RFQs",
          link: "/rfqs",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "Purchase orders",
          link: "/purchase-orders",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "Goods received",
          link: "/goods-received",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "Supplier returns",
          link: "/supplier-returns",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "Refunds owed",
          link: "/supplier-refunds",
          current: args?.isCurrentItem,
          icon: "cart",
          // Money owed back by suppliers — accounting-side gate.
          permission: "supplier_refunds:read",
        },
      ],
    },

    // Sales & Orders
    {
      label: "Sales",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "sales",
      items: [
        {
          title: "Orders",
          link: "/orders",
          current: args?.isCurrentItem,
          icon: "shopping-cart",
          permission: "orders:read",
        },
        {
          title: "Refunds",
          link: "/refunds",
          current: args?.isCurrentItem,
          icon: "rotate-ccw",
          permission: "refunds:read",
        },
        {
          title: "Discounts",
          link: "/discounts",
          current: args?.isCurrentItem,
          icon: "percent",
          // Owner/admin-only — backend gates the page on discounts:read.
          permission: "discounts:read",
        },
      ],
    },

    // People — staff, account members, roles, customers all in one place
    {
      label: "People",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "customers",
      items: [
        {
          title: "Staff",
          link: "/staff",
          current: args?.isCurrentItem,
          icon: "cart",
          // Backend StaffController gates on staff:read.
          permission: "staff:read",
        },
        {
          title: "Shifts",
          link: "/shifts",
          current: args?.isCurrentItem,
          icon: "cart",
          // Backend gates on shifts:read.
          permission: "shifts:read",
        },
        {
          title: "Account members",
          link: "/team",
          current: args?.isCurrentItem,
          icon: "cart",
          // Mirror AccountMemberController: manage_members OR account:read.
          permissions: ["account:manage_members", "account:read"],
        },
        {
          title: "Roles",
          link: "/roles",
          current: args?.isCurrentItem,
          icon: "cart",
          // Backend RolesController gates on roles:read.
          permission: "roles:read",
        },
        {
          title: "Customers",
          link: "/customers",
          current: args?.isCurrentItem,
          icon: "users",
          permission: "customers:read",
        },
        {
          title: "Customer Groups",
          link: "/customer-groups",
          current: args?.isCurrentItem,
          icon: "users",
          permission: "customers:read",
        },
      ],
    },

    // Accounting — ledger views: expenses, vendors, AP, AR, JE, transfers
    {
      label: "Accounting",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "general",
      items: [
        {
          title: "Day sessions",
          link: "/day-sessions",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "day_sessions:read",
        },
        {
          title: "Expenses",
          link: "/expenses",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "expenses:read",
        },
        {
          title: "Vendors",
          link: "/vendors",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "vendors:read",
        },
        {
          title: "Invoices",
          link: "/invoices",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "invoices:read",
        },
        {
          title: "Proforma invoices",
          link: "/proforma-invoices",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "proformas:read",
        },
        {
          title: "Creditors",
          link: "/creditors",
          current: args?.isCurrentItem,
          icon: "cart",
          // Accounts payable subledger (parties we owe). Any-of: vendor
          // ledger access or the accounting reports read.
          permissions: ["vendors:read", "reports:read"],
        },
        {
          title: "Debtors",
          link: "/debtors",
          current: args?.isCurrentItem,
          icon: "cart",
          // Accounts receivable (customers who owe us).
          permission: "customer_ar:read",
        },
        {
          title: "Prepaid credit",
          link: "/prepayments",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "customer_prepayments:view",
        },
        {
          title: "Journal entries",
          link: "/accounting/journal-entries",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "journal_entries:read",
        },
        {
          title: "Fund transfers",
          link: "/accounting/fund-transfers",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "fund_transfers:read",
        },
        {
          title: "Provider settlements",
          link: "/accounting/provider-settlements",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "provider_settlements:read",
        },
        {
          title: "Till reconciliation",
          link: "/accounting/till",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "till_reconciliation:read",
        },
        {
          title: "Cash movements",
          link: "/accounting/cash-movements",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "cash_movements:read",
        },
        // Financial statements & reconciliations. The exact backend gate
        // varies (accounting reports read vs the financial-reports key), so
        // accept either — any-of keeps finance roles that hold one but not
        // the other from losing the nav. Owners hold both.
        {
          title: "Suspense reconciliation",
          link: "/accounting/suspense",
          current: args?.isCurrentItem,
          icon: "cart",
          permissions: ["reports:read", "reports:financial"],
        },
        {
          title: "Profit & loss",
          link: "/accounting/profit-loss",
          current: args?.isCurrentItem,
          icon: "cart",
          permissions: ["reports:read", "reports:financial"],
        },
        {
          title: "Trial balance",
          link: "/accounting/trial-balance",
          current: args?.isCurrentItem,
          icon: "cart",
          permissions: ["reports:read", "reports:financial"],
        },
        {
          title: "Balance sheet",
          link: "/accounting/balance-sheet",
          current: args?.isCurrentItem,
          icon: "cart",
          permissions: ["reports:read", "reports:financial"],
        },
        {
          title: "General ledger",
          link: "/accounting/general-ledger",
          current: args?.isCurrentItem,
          icon: "cart",
          permissions: ["reports:read", "reports:financial"],
        },
        {
          title: "AP aging",
          link: "/accounting/ap-aging",
          current: args?.isCurrentItem,
          icon: "cart",
          permissions: ["reports:read", "reports:financial"],
        },
      ],
    },

    // Financing — feature-flagged via NEXT_PUBLIC_LOANS_ENABLED (see
    // lib/loans/config.ts). Hidden entirely until the module is switched on.
    ...(LOANS_ENABLED
      ? [
          {
            label: "Financing",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: "general",
            items: [
              {
                title: "Loans",
                link: "/loans",
                current: args?.isCurrentItem,
                icon: "cart",
                permission: "loans:read",
              },
              {
                title: "Loan applications",
                link: "/loans/applications",
                current: args?.isCurrentItem,
                icon: "cart",
                permission: "loans:read",
              },
              {
                title: "Apply for a loan",
                link: "/loans/apply",
                current: args?.isCurrentItem,
                icon: "cart",
                permission: "loans:apply",
              },
            ],
          },
        ]
      : []),

    // Business Operations
    {
      label: "Business operations",
      showSeparator: false,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "general",
      items: [
        {
          title: "Tables",
          link: "/tables",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "tables:read",
        },
        {
          title: "Spaces",
          link: "/spaces",
          current: args?.isCurrentItem,
          icon: "cart",
          // "tables:read" covers tables and spaces (see catalog).
          permission: "tables:read",
        },
        {
          title: "Floor plans",
          link: "/floor-plans",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "floor_plans:read",
        },
        {
          title: "Table combinations",
          link: "/table-combinations",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "table_combinations:read",
        },
        {
          title: "Reservations",
          link: "/reservations",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "reservations:read",
        },
        {
          title: "Stores",
          link: "/stores",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "stores:read",
        },
      ],
    },
  ];
};

// Store mode — shown when the active destination is a store (a stockroom
// attached to a parent location). A store cannot sell, so Sales, Accounting,
// Business operations and the product catalogue (Inventory management) are
// all dropped; Reports collapses to stock (plus packaging, when the location
// has the packaging module enabled). The store shares its parent location's
// catalogue but holds its own quantities, which it manages here and moves via
// Stock transfer / Stock request. Procurement stays — buying from suppliers
// is orthogonal to selling, and every procurement action already resolves
// its destination generically (same getCurrentDestination()/X-Location-Id
// pattern as Stock intake), so a store can requisition, RFQ, order, and
// receive goods directly just like a location.
const getStoreMenuItems = (args?: MenuItemArgType) => {
  const hasPackaging = args?.hasPackaging === true; // default false (hidden)
  const storeId = args?.currentStoreId;
  return [
    // Whole-business overview — business-scoped and permission-guarded, kept
    // for context (it is not store-scoped, so it shows the parent business).
    // Same multi-destination gate as the normal menu; a store implies the
    // business has more than one destination, so this stays visible here.
    ...(args?.hasMultipleDestinations
      ? [
          {
            label: "Business overview",
            link: "/business-overview",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: "inventory",
            items: [],
          },
        ]
      : []),

    // Reports — stock (plus packaging, when enabled) in store mode; no
    // sales/finance reports.
    {
      label: "Reports",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "dashboard",
      items: [
        reportNavItem("Stock report", "/report/stock", args),
        ...(hasPackaging
          ? [reportNavItem("Packaging report", "/report/packaging", args)]
          : []),
      ],
    },

    // Stock management — the core store workspace. Consumption Rules /
    // Analytics are intentionally omitted (a recipe/production concern, not a
    // stockroom one). Stock transfer + Stock request are always shown here
    // (a store implies the business has more than one destination).
    {
      label: "Stock management",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "stock",
      items: [
        {
          title: "Stock items",
          link: "/stock-variants",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
        {
          title: "Stock categories",
          link: "/stock-categories",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
        {
          title: "Stock intake",
          link: "/stock-intakes",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
        {
          title: "Stock modification",
          link: "/stock-modifications",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "adjustments:read",
        },
        {
          title: "Stock usage",
          link: "/stock-usages",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "stock_usage:read",
        },
        {
          title: "Stock take",
          link: "/stock-takes",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "stocktake:read",
        },
        {
          title: "Traceability",
          link: "/traceability",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
        {
          title: "Stock transfer",
          link: "/stock-transfers",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "transfers:read",
        },
        {
          title: "Stock request",
          link: "/stock-requests",
          current: args?.isCurrentItem,
          icon: "truck-return",
          permission: "transfer_requests:read",
        },
        {
          title: "Units of measure",
          link: "/units",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "inventory:read",
        },
      ],
    },

    // Procurement — purchase-to-pay flow plus the parties on the other end.
    // Same section as normal mode: buying stock for the store is unrelated
    // to selling, and every action here resolves the active destination
    // generically, so it works unchanged for a store.
    {
      label: "Procurement",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "stock",
      items: [
        {
          title: "Suppliers",
          link: "/suppliers",
          current: args?.isCurrentItem,
          icon: "truck",
          permission: "suppliers:read",
        },
        {
          title: "Purchase requisitions",
          link: "/purchase-requisitions",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "RFQs",
          link: "/rfqs",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "Purchase orders",
          link: "/purchase-orders",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "Goods received",
          link: "/goods-received",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "Supplier returns",
          link: "/supplier-returns",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "purchasing:read",
        },
        {
          title: "Refunds owed",
          link: "/supplier-refunds",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "supplier_refunds:read",
        },
      ],
    },

    // People — store staff and their roles (no customers / account members).
    {
      label: "People",
      showSeparator: storeId ? true : false,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "customers",
      items: [
        {
          title: "Staff",
          link: "/staff",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "staff:read",
        },
        {
          title: "Shifts",
          link: "/shifts",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "shifts:read",
        },
        {
          title: "Roles",
          link: "/roles",
          current: args?.isCurrentItem,
          icon: "cart",
          permission: "roles:read",
        },
      ],
    },

    // Store profile — links to the active store's detail page.
    ...(storeId
      ? [
          // {
          //   label: "Store",
          //   link: `/stores/${storeId}`,
          //   showSeparator: false,
          //   collapsible: false,
          //   current: args?.isCurrentItem,
          //   icon: "general",
          //   items: [],
          // },
        ]
      : []),
  ];
};

const getWarehouseMenuItems = (args?: MenuItemArgType) => {
  return [
    // Warehouse Dashboard
    {
      label: "Analytics",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "dashboard",
      items: [
        {
          title: "Reports",
          link: "/warehouse",
          current: args?.isCurrentItem,
          icon: "chart",
        },
      ],
    },

    // Stocks
    {
      label: "Stock management",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "inventory",
      items: [
        {
          title: "Stock items",
          link: "/warehouse-stock-variants",
          current: args?.isCurrentItem,
          icon: "home",
        },
        {
          title: "Stock intake",
          link: "/warehouse-stock-intakes",
          current: args?.isCurrentItem,
          icon: "grid",
        },
        {
          title: "Stock modification",
          link: "/warehouse-stock-modifications",
          current: args?.isCurrentItem,
          icon: "grid",
        },
        {
          title: "Stock supplier payable",
          link: "/purchases",
          current: args?.isCurrentItem,
          icon: "grid",
        },
      ],
    },

    // Stock Purchase
    // {
    //     label: "Purchases",
    //     showSeparator: true,
    //     collapsible: false,
    //     current: args?.isCurrentItem,
    //     icon: 'sales',
    //     items: [
    //         { title: "Suppliers", link: "/warehouse-suppliers", current: args?.isCurrentItem, icon: "users" },
    //         { title: "Purchase Orders", link: "/purchases", current: args?.isCurrentItem, icon: "shopping-bag" },

    //     ]
    // },

    // Supplier
    {
      label: "Suppliers",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "users",
      items: [
        {
          title: "Suppliers",
          link: "/warehouse-suppliers",
          current: args?.isCurrentItem,
          icon: "users",
        },
        // { title: "Supplier Credits", link: "/warehouse-supplier-credits", current: args?.isCurrentItem, icon: "shopping-bag" },
      ],
    },

    // Warehouse staff
    {
      label: "Staff",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "users",
      items: [
        {
          title: "Staff",
          link: "/warehouse-staff",
          current: args?.isCurrentItem,
          icon: "shopping-bag",
        },
        {
          title: "Role",
          link: "/warehouse-role",
          current: args?.isCurrentItem,
          icon: "shopping-bag",
        },
      ],
    },

    // Request
    {
      label: "Request",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "git",
      items: [
        {
          title: "Inventory requests",
          link: "/warehouse-requests",
          current: args?.isCurrentItem,
          icon: "file-text",
        },
      ],
    },
    {
      label: "Warehouse",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "warehouse",
      items: [
        {
          title: "Profile",
          link: "/warehouse-profile",
          current: args?.isCurrentItem,
          icon: "file-text",
        },
        // { title: "Billings & Payments", link: "/warehouse-invoice", current: args?.isCurrentItem, icon: "file-text" },
      ],
    },
  ];
};
