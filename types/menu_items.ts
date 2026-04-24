// types/menu_items.ts
import { MenuItemArgType } from "@/types/menu-item-type";

export const menuItems = (
  args?: MenuItemArgType,
) => {
  // Default to normal menu if not specified
  const menuType = args?.menuType || "normal";

  if (menuType === "warehouse") {
    return getWarehouseMenuItems(args);
  }

  return getNormalMenuItems(args);
};

const getNormalMenuItems = (
  args?: MenuItemArgType,
) => {
  return [
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
          title: "Department report",
          link: "/report/department",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Expense report",
          link: "/report/expense",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Profit & loss report",
          link: "/report/profit-loss",
          current: args?.isCurrentItem,
          icon: "cart",
        },
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
        {
          title: "Departments",
          link: "/departments",
          current: args?.isCurrentItem,
          icon: "folder",
        },
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
          title: "Collections",
          link: "/product-collections",
          current: args?.isCurrentItem,
          icon: "folder",
        },
        {
          title: "Suppliers",
          link: "/suppliers",
          current: args?.isCurrentItem,
          icon: "truck",
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
          title: "Proforma",
          link: "/proforma-invoice",
          current: args?.isCurrentItem,
          icon: "rotate-ccw",
        },
        {
          title: "Refunds",
          link: "/refunds",
          current: args?.isCurrentItem,
          icon: "rotate-ccw",
        },
      ],
    },

    // Customer Management
    {
      label: "Customer management",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "customers",
      items: [
        {
          title: "Customers",
          link: "/customers",
          current: args?.isCurrentItem,
          icon: "users",
        },
        {
          title: "Discounts",
          link: "/discounts",
          current: args?.isCurrentItem,
          icon: "percent",
        },
      ],
    },

    // Staff & Roles Management
    {
      label: "Staff management",
      showSeparator: true,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "users",
      items: [
        {
          title: "Staff",
          link: "/staff",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Team",
          link: "/team",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Roles",
          link: "/roles",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Shifts",
          link: "/shifts",
          current: args?.isCurrentItem,
          icon: "cart",
        },
      ],
    },

    // Business Operations
    {
      label: "Business operations",
      showSeparator: false,
      collapsible: false,
      current: args?.isCurrentItem,
      icon: "general",
      items: [
        {
          title: "Expenses",
          link: "/expenses",
          current: args?.isCurrentItem,
          icon: "cart",
        },
        {
          title: "Tables & spaces",
          link: "/spaces",
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
