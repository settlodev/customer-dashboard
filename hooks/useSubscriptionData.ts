import { useState, useEffect } from 'react';
import { getActiveSubscription, getAllSubscriptions } from '@/lib/actions/subscriptions';
import { ActiveSubscription, Subscriptions } from '@/types/subscription/type';

export const useSubscriptionData = () => {
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription>();
  const [subscriptionData, setSubscriptionData] = useState<Subscriptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const [activeSubs, subscriptions] = await Promise.all([
          getActiveSubscription(),
          getAllSubscriptions()
        ]);
        
        setActiveSubscription(activeSubs);
        setSubscriptionData(subscriptions);
      } catch (error) {
        console.error("Error fetching subscription data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  return { activeSubscription, subscriptionData, isLoading };
};