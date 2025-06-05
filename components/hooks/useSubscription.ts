// hooks/useSubscription.ts
import { useState, useEffect, useCallback } from 'react';

import { ActiveSubscription } from '@/types/subscription/type';
import { getActiveSubscription } from '@/lib/actions/subscriptions';
import { canAddMoreItems, getFeatureLimit, getSubscriptionDisplayName, hasFeatureAccess } from '@/lib/subscription-utils';

interface UseSubscriptionReturn {
    subscription: ActiveSubscription | null;
    isLoading: boolean;
    error: string | null;
    hasFeature: (featureCodes: string[]) => boolean;
    getLimit: (featureCode: string) => number | null;
    canAdd: (featureCode: string, currentCount: number) => {
        canAdd: boolean;
        limit: number | null;
        remaining: number | null;
    };
    displayName: string;
    refetch: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
    const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = useCallback(async () => {
        try {
            setIsLoading(true);
            const activeSubscription = await getActiveSubscription();
            setSubscription(activeSubscription);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch subscription:', err);
            setError(err instanceof Error ? err.message : 'Failed to load subscription data');
            setSubscription(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const hasFeature = useCallback(
        (featureCodes: string[]) => hasFeatureAccess(subscription, featureCodes),
        [subscription]
    );

    const getLimit = useCallback(
        (featureCode: string) => getFeatureLimit(subscription, featureCode),
        [subscription]
    );

    const canAdd = useCallback(
        (featureCode: string, currentCount: number) => 
            canAddMoreItems(subscription, featureCode, currentCount),
        [subscription]
    );

    const displayName = getSubscriptionDisplayName(subscription);

    return {
        subscription,
        isLoading,
        error,
        hasFeature,
        getLimit,
        canAdd,
        displayName,
        refetch: fetchSubscription
    };
};