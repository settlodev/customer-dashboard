'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Tag } from 'lucide-react';
import RenewSubscriptionForm from '@/components/forms/renew_subscription_form';
import { ActiveSubscription } from '@/types/subscription/type';
import { getActiveSubscription } from '@/lib/actions/subscriptions';
import Loading from '../loading';

const SubscriptionRenewal = () => {
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription>();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveSubscription = async () => {
      const activeSubs = await getActiveSubscription();
      setActiveSubscription(activeSubs);
      setLoading(false);
    }

    fetchActiveSubscription();
  }, []);

  // Calculate days until expiration
  const daysUntilExpiration = () => {
    if (!activeSubscription?.endDate) return 0;
    const end = new Date(activeSubscription.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
            <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 ">
      <div className='flex flex-col gap-4 lg:flex-row mt-16'>
        <div className='w-full lg:w-1/2'>
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-lg">
                <Tag className="text-emerald-500" />
                <span>Plan: {activeSubscription?.subscription?.packageName || 'N/A'}</span>
              </div>
            
              <div className="flex items-center gap-2 text-lg">
                <DollarSign className="text-emerald-500" />
                <span>Price: {Intl.NumberFormat().format(activeSubscription?.subscription?.amount || 0)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="text-emerald-500" />
                <span>Expires: {activeSubscription?.endDate ? new Date(activeSubscription.endDate).toLocaleDateString() : 'N/A'}</span>
                <span className="ml-2 text-sm text-orange-500">
                  ({daysUntilExpiration()} days remaining)
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-gray-500">
                Subscription Status: {activeSubscription?.subscriptionStatus}
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className=''>
        <RenewSubscriptionForm activeSubscription={activeSubscription ?? undefined} />
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRenewal;