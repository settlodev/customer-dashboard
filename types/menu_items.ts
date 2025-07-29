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
                { title: "Stock Request", link: "/stock-requests", current: args?.isCurrentItem, icon: "truck-return" },
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
                { title: "Stock Items", link: "/warehouse-stock-variants", current: args?.isCurrentItem, icon: "home" },
                { title: "Stock Intake", link: "/warehouse-stock-intakes", current: args?.isCurrentItem, icon: "grid" },
                { title: "Stock Supplier Payable", link: "/purchases", current: args?.isCurrentItem, icon: "grid" },
                
            ]
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
            icon: 'users',
            items: [
                { title: "Suppliers", link: "/warehouse-suppliers", current: args?.isCurrentItem, icon: "users" },
                // { title: "Supplier Credits", link: "/warehouse-supplier-credits", current: args?.isCurrentItem, icon: "shopping-bag" },
                
            ]
        },

         // Warehouse staff
         {
            label: "Staff",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'users',
            items: [
                { title: "Staff", link: "/warehouse-staff", current: args?.isCurrentItem, icon: "shopping-bag" },
                { title: "Role", link: "/warehouse-role", current: args?.isCurrentItem, icon: "shopping-bag" },
            ]
        },

        // Request
        {
            label: "Request",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'git',
            items: [
                { title: "Inventory Requests", link: "/warehouse-requests", current: args?.isCurrentItem, icon: "file-text" },
                
            ]
        },
        {
            label: "Warehouse",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'warehouse',
            items: [
                { title: "Profile", link: "/warehouse-profile", current: args?.isCurrentItem, icon: "file-text" },
                { title: "Billings & Payments", link: "/warehouse-invoice", current: args?.isCurrentItem, icon: "file-text" },
                
            ]
        },
        
    ];

};