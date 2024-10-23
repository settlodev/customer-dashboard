import {MenuItemArgType} from "@/types/menu-item-type";

export const menuItems=(args?: MenuItemArgType) => {
    return [
        {
            label: "Dashboard",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'dashboard',
            items:
                [
                    {title: "Summary", link: "/", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Staff report", link: "/staff-report", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Top selling items", link: "/top-selling", current: args?.isCurrentItem, icon: "cart"},
                ]
        },
        {
            label: "Inventory",
            showSeparator: true,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'inventory',
            items:
                [
                    {title: "Products", link: "/products", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Categories", link: "/categories", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Suppliers", link: "/suppliers", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Brands", "link": "/brands", "current": args?.isCurrentItem, "icon": "cart"},
                    {title: "Addons", "link": "/addons", "current": args?.isCurrentItem, "icon": "cart"},
                ]
        },
        {
            label: "Sales & Tickets",
            showSeparator: false,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'sales',
            items:
                [
                    {title: "Completed sales", link: "/orders", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Tickets", link: "/tickets", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Transactions", link: "/transactions", current: args?.isCurrentItem, icon: "cart"}
                ]
        },
        {
            label: "Customers",
            showSeparator: false,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'customers',
            items:
                [
                    {title: "Customers", link: "/customers", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Discounts", link: "/discounts", current: args?.isCurrentItem, icon: "cart"},
                 
                ]
        },
        {
            label: "Marketing",
            showSeparator: false,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'customers',
            items:
                [

                    {title: "Communication Templates", link: "/communication-templates", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Broadcast SMS/Email", link: "/sms-marketing", current: args?.isCurrentItem, icon: "cart"}
                ]
        },
        {
            label: "Users &  Roles",
            showSeparator: false,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'users',
            items:
                [
                    {title: "Users", link: "/users", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Staffs", link: "/staff", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Shifts", link: "/shifts", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Salaries", link: "/salaries", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Payslips", link: "/payslips", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Roles", link: "/roles", current: args?.isCurrentItem, icon: "cart"},
                ]
        },
        {
            label: "General",
            showSeparator: false,
            collapsible: false,
            current: args?.isCurrentItem,
            icon: 'general',
            items:
                [
                    {title: "Countries", link: "/countries", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Departments", link: "/departments", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Businesses", link: "/business", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Expenses", link: "/expenses", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Tables & Spaces", link: "/spaces", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Reservations", link: "/reservations", current: args?.isCurrentItem, icon: "cart"},
                    {title: "KDS", link: "/kds", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Locations", link: "/locations", current: args?.isCurrentItem, icon: "cart"},
                    {title: "Settings", link: "/settings", current: args?.isCurrentItem, icon: "cart"}
                ]
        }
    ]
}
