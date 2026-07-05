// types/menu_items.ts
import { MenuItemArgType } from "@/types/menu-item-type";
import { LOCATION_WIDE_REPORT_LINKS } from "@/lib/reports-access";
import { LOANS_ENABLED } from "@/lib/loans/config";

export const menuItems = (
  args?: MenuItemArgType,
) => {
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

const getNormalMenuItems = (
  args?: MenuItemArgType,
) => {
  // Default to true so warehouse / loading states keep the link visible
  // until entitlements are known. The page-level UpgradeGate is the
  // backstop when a user clicks through with an underprivileged plan.
  const hasDepartmentsModule = args?.hasDepartmentsModule !== false;
  const reportsReadAll = args?.reportsReadAll !== false; // default true
  return [
    // Top-level link — appears as its own row in the sidebar (no submenu).
    {
      label: "Business overview",
      link: "/business-overview",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "inventory",
      items: [],
    },

    // Analytics & Reporting
    {
      label: "Reports",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "dashboard",
      items: [
        {
          title: "Dashboard",
          link: "/dashboard",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Sales report",
          link: "/report/sales",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Cashflow report",
          link: "/report/cashflow",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Top selling report",
          link: "/report/top-selling",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Sold items report",
          link: "/report/sold-items",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Credit report",
          link: "/report/credit",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Refund report",
          link: "/report/refunds",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Voids report",
          link: "/report/voids",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stock report",
          link: "/report/stock",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Staff report",
          link: "/report/staff",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Expense report",
          link: "/report/expense",
          current: args?.isCurrentItem,
          icon: "cart",
        },
      ].filter((it) => reportsReadAll || !LOCATION_WIDE_REPORT_LINKS.includes(it.link)),
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
              },
            ]
          : []),
        {
          title: "Categories",
          link: "/categories",
          current: args?.isCurrentItem,
          icon: "tag",
        },
        {
          title: "Products",
          link: "/products",
          current: args?.isCurrentItem,
          icon: "package",
        },
        {
          title: "Brands",
          link: "/brands",
          current: args?.isCurrentItem,
          icon: "tag",
        },
        {
          title: "Bundles",
          link: "/product-collections",
          current: args?.isCurrentItem,
          icon: "folder",
        },
        {
          title: "Modifier groups",
          link: "/modifier-groups",
          current: args?.isCurrentItem,
          icon: "tag",
        },
        {
          title: "Addon groups",
          link: "/addon-groups",
          current: args?.isCurrentItem,
          icon: "tag",
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
        },
        {
          title: "Stock intake",
          link: "/stock-intakes",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stock modification",
          link: "/stock-modifications",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stock usage",
          link: "/stock-usages",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stock take",
          link: "/stock-takes",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Traceability",
          link: "/traceability",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        ...(args?.hasMultipleDestinations ? [
          {
            title: "Stock transfer",
            link: "/stock-transfers",
            current: args?.isCurrentItem,
            icon: "cart",
          },
        ] : []),
        {
          title: "Consumption Rules",
          link: "/bom-rules",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Consumption Analytics",
          link: "/bom-analytics",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        ...(args?.hasMultipleDestinations ? [
          {
            title: "Stock request",
            link: "/stock-requests",
            current: args?.isCurrentItem,
            icon: "truck-return",
          },
        ] : []),
        {
          title: "Units of measure",
          link: "/units",
          current: args?.isCurrentItem,
          icon: "cart",
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
        },
        {
          title: "Purchase requisitions",
          link: "/purchase-requisitions",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "RFQs",
          link: "/rfqs",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Purchase orders",
          link: "/purchase-orders",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Goods received",
          link: "/goods-received",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Supplier returns",
          link: "/supplier-returns",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Refunds owed",
          link: "/supplier-refunds",
          current: args?.isCurrentItem,
          icon: "cart",
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
        },
        {
          title: "Refunds",
          link: "/refunds",
          current: args?.isCurrentItem,
          icon: "rotate-ccw",
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
        },
        {
          title: "Customer Groups",
          link: "/customer-groups",
          current: args?.isCurrentItem,
          icon: "users",
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
        },
        {
          title: "Proforma invoices",
          link: "/proforma-invoices",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Creditors",
          link: "/creditors",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Debtors",
          link: "/debtors",
          current: args?.isCurrentItem,
          icon: "cart",
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
        {
          title: "Suspense reconciliation",
          link: "/accounting/suspense",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Profit & loss",
          link: "/accounting/profit-loss",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Trial balance",
          link: "/accounting/trial-balance",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Balance sheet",
          link: "/accounting/balance-sheet",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "General ledger",
          link: "/accounting/general-ledger",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "AP aging",
          link: "/accounting/ap-aging",
          current: args?.isCurrentItem,
          icon: "cart",
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
        },
        {
          title: "Spaces",
          link: "/spaces",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Floor plans",
          link: "/floor-plans",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Table combinations",
          link: "/table-combinations",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Reservations",
          link: "/reservations",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stores",
          link: "/stores",
          current: args?.isCurrentItem,
          icon: "cart",
        },
      ],
    },
  ];
};

// Store mode — shown when the active destination is a store (a stockroom
// attached to a parent location). A store cannot sell, so Sales, Accounting,
// Business operations, Procurement and the product catalogue (Inventory
// management) are all dropped; Reports collapses to stock only. The store
// shares its parent location's catalogue but holds its own quantities, which
// it manages here and moves via Stock transfer / Stock request.
const getStoreMenuItems = (args?: MenuItemArgType) => {
  const reportsReadAll = args?.reportsReadAll !== false; // default true
  const storeId = args?.currentStoreId;
  return [
    // Whole-business overview — business-scoped and permission-guarded, kept
    // for context (it is not store-scoped, so it shows the parent business).
    {
      label: "Business overview",
      link: "/business-overview",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "inventory",
      items: [],
    },

    // Reports — stock only in store mode (no sales/finance reports).
    {
      label: "Reports",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "dashboard",
      items: [
        {
          title: "Stock report",
          link: "/report/stock",
          current: args?.isCurrentItem,
          icon: "cart",
        },
      ].filter((it) => reportsReadAll || !LOCATION_WIDE_REPORT_LINKS.includes(it.link)),
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
        },
        {
          title: "Stock intake",
          link: "/stock-intakes",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stock modification",
          link: "/stock-modifications",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stock usage",
          link: "/stock-usages",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stock take",
          link: "/stock-takes",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Traceability",
          link: "/traceability",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stock transfer",
          link: "/stock-transfers",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Stock request",
          link: "/stock-requests",
          current: args?.isCurrentItem,
          icon: "truck-return",
        },
        {
          title: "Units of measure",
          link: "/units",
          current: args?.isCurrentItem,
          icon: "cart",
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
          {
            label: "Store",
            link: `/stores/${storeId}`,
            showSeparator: false,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: "general",
            items: [],
          },
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
