
export const FEATURE_MAPPING = {
    // Analytics & Reporting - Always available with reports feature
    analytics: {
        requiredFeatures: ['reports'],
        items: {
            dashboard: [], // Always available
            cashflow: ['reports'],
            topSelling: ['reports'],
            soldItems: ['reports'],
            credit: ['reports'],
            stock: ['reports'],
            staff: ['reports'],
            department: ['reports'],
            refunds: ['reports'],
            expense: ['reports'],
        }
    },
    
    // Inventory Management
    inventory: {
        requiredFeatures: ['inventory_100', 'inventory_1000', 'inventory_5000'],
        items: {
            departments: ['inventory_100', 'inventory_1000', 'inventory_5000'],
            categories: ['inventory_100', 'inventory_1000', 'inventory_5000'],
            products: ['inventory_100', 'inventory_1000', 'inventory_5000'],
            brands: ['inventory_100', 'inventory_1000', 'inventory_5000'],
            suppliers: ['suppliers_unlimited']
        }
    },
    
    // Stock Management
    stock: {
        requiredFeatures: ['inventory_100', 'inventory_1000', 'inventory_5000'],
        items: {
            stockItems: ['inventory_100', 'inventory_1000', 'inventory_5000'],
            stockIntake: ['inventory_100', 'inventory_1000', 'inventory_5000'],
            stockModification: ['inventory_100', 'inventory_1000', 'inventory_5000'],
            stockTransfer: ['inventory_100', 'inventory_1000', 'inventory_5000'],
            recipes: ['recipes'],
            modifiers: ['inventory_100', 'inventory_1000', 'inventory_5000'],
            addons: ['inventory_100', 'inventory_1000', 'inventory_5000']
        }
    },
    
    // Sales & Orders
    sales: {
        requiredFeatures: ['pos'],
        items: {
            orders: ['pos'],
            refunds: ['pos']
        }
    },
    
    // Customer Management
    customers: {
        requiredFeatures: ['customers'],
        items: {
            customers: ['customers'],
            discounts: ['customers']
        }
    },
    
    // Staff Management
    staff: {
        requiredFeatures: ['staff_2', 'staff_10', 'staff_25'],
        items: {
            staff: ['staff_2', 'staff_10', 'staff_25'],
            shifts: ['staff_2', 'staff_10', 'staff_25'],
            roles: ['staff_2', 'staff_10', 'staff_25']
        }
    },
    
    // Business Operations
    business: {
        requiredFeatures: [], // Base features, always available
        items: {
            businesses: [], // Always available
            expenses: [], // Always available
            spaces: ['table_reservations'],
            reservations: ['table_reservations'],
            kds: ['kitchen_display'],
            locations: [], // Always available
            qrcode: [] // Always available
        }
    }
} as const;