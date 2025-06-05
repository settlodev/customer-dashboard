//central configuration that maps menu sections and items to required subscription features.

import { FEATURE_MAPPING } from '@/config/feature-mapping';
import { ActiveSubscription} from '@/types/subscription/type';

/**
 * Check if user has access to a specific feature
 */
export const hasFeatureAccess = (
    subscription: ActiveSubscription | null,
    featureCodes: string[]
): boolean => {
    if (!subscription || !featureCodes.length) return true;
    
    // Handle nested subscription structure
    const features = subscription.subscription?.subscriptionFeatures || subscription.subscriptionFeatures || [];
    const availableFeatureCodes = features.map(f => f.code) || [];
    
    // console.log('Available feature codes:', availableFeatureCodes);
    // console.log('Required feature codes:', featureCodes);
    
    // Check if user has any of the required features
    const hasAccess = featureCodes.some(code => availableFeatureCodes.includes(code));
    // console.log('Has access:', hasAccess);
    
    return hasAccess;
};

/**
 * Get feature limits for a specific feature code
 */
export const getFeatureLimit = (
    subscription: ActiveSubscription | null,
    featureCode: string
): number | null => {
    if (!subscription) return null;
    
    // Handle nested subscription structure
    const features = subscription.subscription?.subscriptionFeatures || subscription.subscriptionFeatures || [];
    const feature = features.find(f => f.code === featureCode);
    return feature?.itemsMaxCount || null;
};

/**
 * Check if a menu section should be visible
 */
export const isSectionVisible = (
    subscription: ActiveSubscription | null,
    sectionKey: keyof typeof FEATURE_MAPPING
): boolean => {
    if (!subscription) return false;
    
    const sectionConfig = FEATURE_MAPPING[sectionKey];
    if (!sectionConfig) return true;
    
    // If section has no required features, it's always visible
    if (!sectionConfig.requiredFeatures.length) return true;
    
    return hasFeatureAccess(subscription, [...sectionConfig.requiredFeatures]);
};

/**
 * Check if a menu item should be visible
 */
export const isMenuItemVisible = (
    subscription: ActiveSubscription | null,
    sectionKey: keyof typeof FEATURE_MAPPING,
    itemKey: string
): boolean => {
    if (!subscription) return false;
    
    const sectionConfig = FEATURE_MAPPING[sectionKey];
    if (!sectionConfig) return true;
    
    const itemFeatures = sectionConfig.items[itemKey as keyof typeof sectionConfig.items] as string[] | undefined;
    if (!itemFeatures || !Array.isArray(itemFeatures)) return true;
    
    // If item has no required features, it's always visible
    if (!itemFeatures.length) return true;
    
    return hasFeatureAccess(subscription, itemFeatures);
};

/**
 * Get filtered menu items based on subscription
 */
export const getFilteredMenuItems = (
    subscription: ActiveSubscription | null,
    menuItems: any[]
): any[] => {
    if (!subscription) return [];
    
    const filteredSections = menuItems.map(section => {
        // Map section labels to our feature mapping keys
        const sectionKey = getSectionKeyFromLabel(section.label);
        if (!sectionKey) return section; // If we can't map it, show it by default
        
        // Check if section should be visible
        if (!isSectionVisible(subscription, sectionKey)) return null;
        
        // Filter items within the section
        const filteredItems = section.items.filter((item: any) => {
            const itemKey = getItemKeyFromLink(item.link);
            if (!itemKey) return true; // If we can't map it, show it by default
            
            return isMenuItemVisible(subscription, sectionKey, itemKey);
        });
        
        // Return section with filtered items
        return { ...section, items: filteredItems };
    }).filter(Boolean); // Remove null sections
    
    return filteredSections;
};

/**
 * Map section labels to feature mapping keys
 */
const getSectionKeyFromLabel = (label: string): keyof typeof FEATURE_MAPPING | null => {
    const labelMap: Record<string, keyof typeof FEATURE_MAPPING> = {
        'Analytics': 'analytics',
        'Inventory Management': 'inventory',
        'Stock Management': 'stock',
        'Sales': 'sales',
        'Customer Management': 'customers',
        'Staff Management': 'staff',
        'Business Operations': 'business'
    };
    
    return labelMap[label] || null;
};

/**
 * Map menu item links to feature mapping item keys
 */
const getItemKeyFromLink = (link: string): string | null => {
    const linkMap: Record<string, string> = {
        '/dashboard': 'dashboard',
        '/report/cashflow': 'cashflow',
        '/report/top-selling': 'topSelling',
        '/report/sold-items': 'soldItems',
        '/report/credit': 'credit',
        '/report/stock': 'stock',
        '/report/staff': 'staff',
        '/report/department': 'department',
        '/departments': 'departments',
        '/categories': 'categories',
        '/products': 'products',
        '/brands': 'brands',
        '/suppliers': 'suppliers',
        '/stock-variants': 'stockItems',
        '/stock-intakes': 'stockIntake',
        '/stock-modifications': 'stockModification',
        '/stock-transfers': 'stockTransfer',
        '/recipes': 'recipes',
        '/modifiers': 'modifiers',
        '/addons': 'addons',
        '/orders': 'orders',
        '/refunds': 'refunds',
        '/customers': 'customers',
        '/discounts': 'discounts',
        '/staff': 'staff',
        '/shifts': 'shifts',
        '/roles': 'roles',
        '/business': 'businesses',
        '/expenses': 'expenses',
        '/spaces': 'spaces',
        '/reservations': 'reservations',
        '/kds': 'kds',
        '/locations': 'locations',
        '/qrcode': 'qrcode'
    };
    
    return linkMap[link] || null;
};

/**
 * Get subscription package display name with feature count
 */
export const getSubscriptionDisplayName = (subscription: ActiveSubscription | null): string => {
    if (!subscription) return 'No Subscription';
    
    // Handle nested subscription structure
    const features = subscription.subscription?.subscriptionFeatures || subscription.subscriptionFeatures || [];
    const featureCount = features.length;
    const packageName = subscription.subscription?.packageName || subscription.packageName || 'Unknown';
    
    return `${packageName} (${featureCount} features)`;
};

/**
 * Check if user can add more items based on feature limits
 */
export const canAddMoreItems = (
    subscription: ActiveSubscription | null,
    featureCode: string,
    currentCount: number
): { canAdd: boolean; limit: number | null; remaining: number | null } => {
    if (!subscription) {
        return { canAdd: false, limit: null, remaining: null };
    }
    
    const limit = getFeatureLimit(subscription, featureCode);
    
    if (limit === null || limit === 2147483647) {
        // Unlimited
        return { canAdd: true, limit: null, remaining: null };
    }
    
    const remaining = Math.max(0, limit - currentCount);
    return {
        canAdd: remaining > 0,
        limit,
        remaining
    };
};