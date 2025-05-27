// components/subscription/SubscriptionGuard.tsx
"use client";

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '../hooks/useSubscription';

interface SubscriptionGuardProps {
    children: React.ReactNode;
    requiredFeatures: string[];
    fallback?: React.ReactNode;
    showUpgradePrompt?: boolean;
    featureName?: string;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
    children,
    requiredFeatures,
    fallback,
    showUpgradePrompt = true,
    featureName = 'this feature'
}) => {
    const { subscription, isLoading, error, hasFeature } = useSubscription();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Checking subscription...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert className="m-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Error loading subscription: {error}
                </AlertDescription>
            </Alert>
        );
    }

    if (!subscription) {
        return fallback || (
            <Alert className="m-4">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                    No active subscription found. Please subscribe to access {featureName}.
                    {showUpgradePrompt && (
                        <div className="mt-2">
                            <Link href="/renew-subscription">
                                <Button variant="outline" size="sm">
                                    Subscribe Now
                                </Button>
                            </Link>
                        </div>
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    if (!hasFeature(requiredFeatures)) {
        return fallback || (
            <div className="flex items-center justify-center min-h-[80vh] p-4 ">
                <Alert className="max-w-md bg-red-400">
                    <Shield className="h-4 w-4" color='white' />
                    <AlertDescription className="text-center text-white">
                        Your current subscription ({subscription.subscription.packageName}) doesn&apos;t include access to {featureName}.
                        {showUpgradePrompt && (
                            <div className="mt-2">
                                <Link href="/renew-subscription">
                                    <Button variant="outline" size="sm" className='text-black'>
                                        Upgrade Plan
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <>{children}</>;
};

// Usage examples:

// 1. Protect entire page
// export const RecipesPageGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     return (
//         <SubscriptionGuard 
//             requiredFeatures={['recipes']} 
//             featureName="Recipe Management"
//         >
//             {children}
//         </SubscriptionGuard>
//     );
// };

// 2. Protect specific component
// export const StaffLimitGuard: React.FC<{ 
//     children: React.ReactNode; 
//     currentStaffCount: number;
// }> = ({ children, currentStaffCount }) => {
//     const { canAdd } = useSubscription();
//     const staffLimit = canAdd('staff_2', currentStaffCount) || 
//                       canAdd('staff_10', currentStaffCount) || 
//                       canAdd('staff_unlimited', currentStaffCount);

//     if (!staffLimit.canAdd) {
//         return (
//             <Alert>
//                 <AlertTriangle className="h-4 w-4" />
//                 <AlertDescription>
//                     You&apos;ve reached your staff limit ({staffLimit.limit}). 
//                     {staffLimit.remaining !== null && (
//                         <span> You have {staffLimit.remaining} remaining.</span>
//                     )}
//                     <div className="mt-2">
//                         <Link href="/renew-subscription">
//                             <Button variant="outline" size="sm">
//                                 Upgrade Plan
//                             </Button>
//                         </Link>
//                     </div>
//                 </AlertDescription>
//             </Alert>
//         );
//     }

//     return <>{children}</>;
// };