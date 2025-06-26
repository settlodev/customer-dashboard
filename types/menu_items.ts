// types/menu_items.ts - Updated version
import { MenuItemArgType } from "@/types/menu-item-type";
import { ActiveSubscription } from "./subscription/type";
import { getFilteredMenuItems } from "@/lib/subscription-utils";



export const menuItems = (args?: MenuItemArgType & { subscription?: ActiveSubscription | null }) => {
    // Default to normal menu if not specified
    const menuType = args?.menuType || 'normal';
    
    if (menuType === 'warehouse') {
        return getWarehouseMenuItems(args);
    }
    
    return getNormalMenuItems(args);
};

const getNormalMenuItems = (args?: MenuItemArgType & { subscription?: ActiveSubscription | null }) => {
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
                { title: "Credit Report", link: "/report/credit", current: args?.isCurrentItem, icon: "cart" },
                { title: "Refund Report", link: "/report/refunds", current: args?.isCurrentItem, icon: "cart" },
                { title: "Stock Report", link: "/report/stock", current: args?.isCurrentItem, icon: "cart" },
                { title: "Staff Report", link: "/report/staff", current: args?.isCurrentItem, icon: "cart" },
                { title: "Department Report", link: "/report/department", current: args?.isCurrentItem, icon: "cart" },
                { title: "Expense Report", link: "/report/expense", current: args?.isCurrentItem, icon: "cart" },
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
                { title: "Departments", link: "/departments", current: args?.isCurrentItem, icon: "folder" },
                { title: "Categories", link: "/categories", current: args?.isCurrentItem, icon: "tag" },
                { title: "Products", link: "/products", current: args?.isCurrentItem, icon: "package" },
                { title: "Brands", link: "/brands", current: args?.isCurrentItem, icon: "tag" },
                { title: "Suppliers", link: "/suppliers", current: args?.isCurrentItem, icon: "truck" },
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
                { title: "Orders", link: "/orders", current: args?.isCurrentItem, icon: "shopping-cart" },
                { title: "Refunds", link: "/refunds", current: args?.isCurrentItem, icon: "rotate-ccw" },
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
                { title: "Customers", link: "/customers", current: args?.isCurrentItem, icon: "users" },
                { title: "Discounts", link: "/discounts", current: args?.isCurrentItem, icon: "percent" },
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
                // { title: "Shifts", link: "/shifts", current: args?.isCurrentItem, icon: "cart" }, For later use
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
                { title: "QrCode", link: "/qrcode", current: args?.isCurrentItem, icon: "cart" },
                { title: "Invoices", link: "/invoices", current: args?.isCurrentItem, icon: "cart" },
                { title: "Devices", link: "/devices", current: args?.isCurrentItem, icon: "cart" },
            ]
        }
    ];

    // if (args?.subscription) {
    //     return getFilteredMenuItems(args.subscription, baseMenuItems);
    // }
};

const getWarehouseMenuItems = (args?: MenuItemArgType) => {
    return [
        // Warehouse Dashboard
        {
            label: "Analytics",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'dashboard',
            items: [
                { title: "Reports", link: "/warehouse", current: args?.isCurrentItem, icon: "chart" },
            ]
        },

         // Stocks
        {
            label: "Stock Management",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'inventory',
            items: [
                { title: "Stock Items", link: "/store-stocks", current: args?.isCurrentItem, icon: "home" },
                { title: "Stock Intake", link: "/store-stock-intakes", current: args?.isCurrentItem, icon: "grid" },
                { title: "Stock Modification", link: "/store-stock-modifications", current: args?.isCurrentItem, icon: "layers" },
                { title: "Stock Transfer", link: "/store-stock-transfers", current: args?.isCurrentItem, icon: "truck" },
            ]
        },
        
        // Stock Purchase
        {
            label: "Purchases",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'sales',
            items: [
                { title: "Purchase Orders", link: "/purchases", current: args?.isCurrentItem, icon: "shopping-bag" },
                { title: "Suppliers", link: "/vendors", current: args?.isCurrentItem, icon: "users" },
            ]
        },

        // Request
        {
            label: "Request",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'general',
            items: [
                { title: "Inventory Requests", link: "/requests", current: args?.isCurrentItem, icon: "file-text" },
                // { title: "Request Status", link: "/warehouse/request-status", current: args?.isCurrentItem, icon: "activity" },
            ]
        },
        
       
        
        // Inventory Shop
        // {
        //     label: "Inventory Shop",
        //     showSeparator: true,
        //     collapsible: false,
        //     current: args?.isCurrentItem,
        //     icon: 'stock',
        //     items: [
        //         { title: "Stock Items", link: "/warehouse/stock-items", current: args?.isCurrentItem, icon: "box" },
        //         { title: "Stock Transfer", link: "/warehouse/transfers", current: args?.isCurrentItem, icon: "repeat" },
        //         { title: "Stocktaking", link: "/warehouse/stocktaking", current: args?.isCurrentItem, icon: "clipboard-check" },
        //     ]
        // },
        
        
        
        // Reports
        // {
        //     label: "Report",
        //     showSeparator: false,
        //     collapsible: false,
        //     current: args?.isCurrentItem,
        //     icon: 'dashboard',
        //     items: [
        //         { title: "Inventory Report", link: "/warehouse/report/inventory", current: args?.isCurrentItem, icon: "file-text" },
        //         { title: "Movement Report", link: "/warehouse/report/movement", current: args?.isCurrentItem, icon: "trending-up" },
        //         { title: "Purchase Report", link: "/warehouse/report/purchase", current: args?.isCurrentItem, icon: "dollar-sign" },
        //     ]
        // }
    ];

};