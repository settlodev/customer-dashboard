import {MenuItemArgType} from "@/types/menu-item-type";

export const menuItems = (args?: MenuItemArgType) => {
    return [
        // Analytics & Reporting
        {
            label: "Analytics",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'dashboard',
            items: [
                { title: "Dashboard", link: "/dashboard", current: args?.isCurrentItem, icon: "cart" },
                { title: "CashFlow Report", link: "/report/cashflow", current: args?.isCurrentItem, icon: "cart" },
                { title: "Top Selling Report", link: "/report/top-selling", current: args?.isCurrentItem, icon: "cart" },
                { title: "Sold Items Report", link: "/report/sold-items", current: args?.isCurrentItem, icon: "cart" },
                { title: "Stock Report", link: "/report/stock", current: args?.isCurrentItem, icon: "cart" },
                { title: "Staff Report", link: "/report/staff", current: args?.isCurrentItem, icon: "cart" },
                { title: "Department Report", link: "/report/department", current: args?.isCurrentItem, icon: "cart" },

            ]
        },

        // Inventory Management
        {
            label: "Inventory Management",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'inventory',
            items: [
                { title: "Departments", link: "/departments", current: args?.isCurrentItem, icon: "cart" },
                { title: "Categories", link: "/categories", current: args?.isCurrentItem, icon: "cart" },
                { title: "Products", link: "/products", current: args?.isCurrentItem, icon: "cart" },
                { title: "Brands", link: "/brands", current: args?.isCurrentItem, icon: "cart" },
                { title: "Suppliers", link: "/suppliers", current: args?.isCurrentItem, icon: "cart" },
            ]
        },

        // Stock Management
        {
            label: "Stock Management",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'stock',
            items: [
                // { title: "Manage Stock", link: "/stocks", current: args?.isCurrentItem, icon: "cart" },
                { title: "Stock items", link: "/stock-variants", current: args?.isCurrentItem, icon: "cart" },
                { title: "Stock Intake", link: "/stock-intakes", current: args?.isCurrentItem, icon: "cart" },
                { title: "Stock Modification", link: "/stock-modifications", current: args?.isCurrentItem, icon: "cart" },
                { title: "Stock Transfer", link: "/stock-transfers", current: args?.isCurrentItem, icon: "cart" },
                { title: "Recipes", link: "/recipes", current: args?.isCurrentItem, icon: "cart" },
                { title: "Modifiers", link: "/modifiers", current: args?.isCurrentItem, icon: "cart" },
                { title: "Addons", link: "/addons", current: args?.isCurrentItem, icon: "cart" },
            ]
        },

        // Sales & Orders
        {
            label: "Sales",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'sales',
            items: [
                { title: "Orders", link: "/orders", current: args?.isCurrentItem, icon: "cart" },
                { title: "Refunds", link: "/refunds", current: args?.isCurrentItem, icon: "cart" },
            ]
        },

        // Customer Management
        {
            label: "Customer Management",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'customers',
            items: [
                { title: "Customers", link: "/customers", current: args?.isCurrentItem, icon: "cart" },
                { title: "Discounts", link: "/discounts", current: args?.isCurrentItem, icon: "cart" },
            ]
        },

        // Staff & Roles Management
        {
            label: "Staff Management",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'users',
            items: [
                { title: "Staff", link: "/staff", current: args?.isCurrentItem, icon: "cart" },
                { title: "Shifts", link: "/shifts", current: args?.isCurrentItem, icon: "cart" },
                { title: "Roles", link: "/roles", current: args?.isCurrentItem, icon: "cart" },
            ]
        },

        // Business Operations
        {
            label: "Business Operations",
            showSeparator: false,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'general',
            items: [
                { title: "Businesses", link: "/business", current: args?.isCurrentItem, icon: "cart" },
                { title: "Expenses", link: "/expenses", current: args?.isCurrentItem, icon: "cart" },
                { title: "Tables & Spaces", link: "/spaces", current: args?.isCurrentItem, icon: "cart" },
                { title: "Reservations", link: "/reservations", current: args?.isCurrentItem, icon: "cart" },
                { title: "Kitchen Display System (KDS)", link: "/kds", current: args?.isCurrentItem, icon: "cart" },
                { title: "Locations", link: "/locations", current: args?.isCurrentItem, icon: "cart" },
                { title: "QrCodes", link: "/qrcode", current: args?.isCurrentItem, icon: "cart" },
                // { title: "Requests", link: "/request", current: args?.isCurrentItem, icon: "cart" },
            ]
        }
    ];
};
