// 'use client';
// import React, { useEffect, useState } from 'react';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge, Calendar, CheckCircle2, DollarSign, Tag } from 'lucide-react';
// import RenewSubscriptionForm from '@/components/forms/renew_subscription_form';
// import { ActiveSubscription, Subscriptions } from '@/types/subscription/type';
// import { getActiveSubscription } from '@/lib/actions/subscriptions';
// import Loading from '../loading';
// import { getAllSubscriptions } from '@/lib/actions/subscription';
// import { Button } from '@/components/ui/button';

// const SubscriptionRenewal = () => {
//   const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription>();
//   const [subscriptionData, setSubscriptionData] = useState<Subscriptions[]>([]);
//   const [isLoading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchActiveSubscription = async () => {
//       try {

//       const activeSubs = await getActiveSubscription();
//       const subscriptions = await getAllSubscriptions();
//       setActiveSubscription(activeSubs);
//       setSubscriptionData(subscriptions);
//       setLoading(false);
//       } catch (error) {
//         console.error("Error fetching active subscription", error);
        
//       }
//       finally{
//         setLoading(false);
//       }
//     }

//     fetchActiveSubscription();
//   }, []);

//   // Calculate days until expiration
//   const daysUntilExpiration = () => {
//     if (!activeSubscription?.endDate) return 0;
//     const end = new Date(activeSubscription.endDate);
//     const today = new Date();
//     const diffTime = end.getTime() - today.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays;
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-lg">
//             <Loading />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto p-4 space-y-6 ">
//       <div className='flex flex-col gap-4 lg:flex-row mt-16'>
//         <div className='w-full lg:w-1/2'>
//           <Card>
//             <CardHeader>
//               <CardTitle>Current Subscription</CardTitle>
//               <CardDescription>Your subscription details</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="flex items-center gap-2 text-lg">
//                 <Tag className="text-emerald-500" />
//                 <span>Plan: {activeSubscription?.subscription?.packageName || 'N/A'}</span>
//               </div>
            
//               <div className="flex items-center gap-2 text-lg">
//                 <DollarSign className="text-emerald-500" />
//                 <span>Price: {Intl.NumberFormat().format(activeSubscription?.subscription?.amount || 0)}</span>
//               </div>

//               <div className="flex items-center gap-2">
//                 <Calendar className="text-emerald-500" />
//                 <span>Expires: {activeSubscription?.endDate ? new Date(activeSubscription.endDate).toLocaleDateString() : 'N/A'}</span>
//                 <span className="ml-2 text-sm text-orange-500">
//                   ({daysUntilExpiration()} days remaining)
//                 </span>
//               </div>
//             </CardContent>
//             <CardFooter>
//               <div className="text-sm text-gray-500">
//                 Subscription Status: {activeSubscription?.subscriptionStatus}
//               </div>
//             </CardFooter>
//           </Card>
//           <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-3">
//       {subscriptionData.map((plan, index) => (
//         <Card
//           key={index}
//           className={`w-full relative transform hover:scale-105 transition-transform duration-300 ${
//             index === 1 ? "border-2 border-emerald-500" : ""
//           }`}
//         >
//           {index === 1 && (
//             <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
//               <Badge className="bg-emerald-500 text-white px-3 py-1">
//                 <Star className="w-4 h-4 mr-1 inline" />
//                 <span className="hidden sm:inline">Most Popular</span>
//               </Badge>
//             </div>
//           )}

//           <CardHeader className="p-4 sm:p-6">
//             <CardTitle className="text-xl sm:text-2xl font-bold">{plan.packageName}</CardTitle>
//             <div className="mt-2 sm:mt-4">
//               <span className="text-2xl sm:text-3xl font-bold">TZS {Intl.NumberFormat().format(plan.amount)}</span>
//               <span className="text-gray-500 ml-2">/month</span>
//             </div>
//             <CardDescription className="mt-2 sm:mt-4 text-gray-600">
//               {/* Plan description */}
//             </CardDescription>
//           </CardHeader>

//           <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
//             <ul className="space-y-2 sm:space-y-4">
//               {plan.subscriptionFeatures.slice(0, 10).map((feature) => (
//                 <li key={feature.id} className="flex items-start space-x-2 sm:space-x-3">
//                   <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-1" />
//                   <span className="text-sm sm:text-base text-gray-700">{feature.name}</span>
//                 </li>
//               ))}
//             </ul>
//           </CardContent>

//           <CardFooter className="p-4 sm:p-6">
//             <Button
//               onClick={() => console.log("Pay Now")}
//               className={`w-full py-3 sm:py-4 lg:py-6 text-base sm:text-lg font-semibold ${
//                 index === 1
//                   ? "bg-emerald-500 hover:bg-emerald-200"
//                   : "bg-gray-900 hover:bg-gray-800"
//               }`}
//             >
//               Subscribe Now
//             </Button>
//           </CardFooter>
//         </Card>
//       ))}
//     </div>
//         </div>

//         <div className=''>
//         <RenewSubscriptionForm activeSubscription={activeSubscription ?? undefined} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SubscriptionRenewal;


'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2,Tag, Clock, AlertCircle } from 'lucide-react';
import RenewSubscriptionForm from '@/components/forms/renew_subscription_form';
import { ActiveSubscription, Subscriptions } from '@/types/subscription/type';
import { getActiveSubscription, getAllSubscriptions } from '@/lib/actions/subscriptions';
import Loading from '../loading';
import { Button } from '@/components/ui/button';

const SubscriptionRenewal = () => {
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription>();
  const [subscriptionData, setSubscriptionData] = useState<Subscriptions[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  useEffect(() => {
    const fetchActiveSubscription = async () => {
      try {
        const activeSubs = await getActiveSubscription();
        const subscriptions = await getAllSubscriptions();
        setActiveSubscription(activeSubs);
        setSubscriptionData(subscriptions);
        
        // Pre-select current plan if it exists
        if (activeSubs?.subscription?.id) {
          const currentPlanIndex = subscriptions.findIndex(
            plan => plan.id === activeSubs.subscription.id
          );
          if (currentPlanIndex !== -1) {
            setSelectedPlan(currentPlanIndex);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription data", error);
      }
      finally {
        setLoading(false);
      }
    };

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

  // Get status color based on days remaining
  const getStatusColor = () => {
    const days = daysUntilExpiration();
    if (days <= 7) return "text-red-500";
    if (days <= 30) return "text-amber-500";
    return "text-emerald-500";
  };

  const handleSelectPlan = (index: number) => {
    setSelectedPlan(index);
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-start lg:text-center mt-14">
        <p className="font-bold text-2xl">Manage your current subscription or choose a new plan</p>
      </div>
      
      {/* Current Subscription Status */}
      {activeSubscription && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center mb-2">
                <Tag className="text-emerald-500 mr-2" size={20} />
                Current Plan: <span className="ml-2 font-bold text-emerald-600">{activeSubscription?.subscription?.packageName || 'N/A'}</span>
              </h2>
              <p className="text-gray-600 mb-4">Your subscription will {daysUntilExpiration() < 0 ? 'expired' : 'expire'} on {activeSubscription?.endDate ? new Date(activeSubscription.endDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <Clock className={getStatusColor()} size={18} />
              <span className={`font-medium ${getStatusColor()}`}>
                {daysUntilExpiration() < 0 
                  ? 'Expired'
                  : daysUntilExpiration() <= 0 
                    ? 'Expires today' 
                    : `${daysUntilExpiration()} days remaining`
                }
              </span>
            </div>
          </div>
          
          {daysUntilExpiration() <= 14 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
              <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-amber-800">
                  {daysUntilExpiration() < 0 
                    ? 'Your subscription has expired.' 
                    : 'Your subscription is ending soon.'}
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  Renew now to avoid service interruption and continue enjoying all features.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Plan Selection */}
        <div className="w-full lg:w-2/3">
          <h2 className="text-xl font-semibold mb-4">Select a Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptionData.map((plan, index) => (
              <Card
                key={index}
                className={`w-full relative transform transition-all duration-300 hover:shadow-lg cursor-pointer ${
                  selectedPlan === index 
                    ? "border-2 border-emerald-500 shadow-md scale-[1.02]" 
                    : "border border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleSelectPlan(index)}
              >
                

                <CardHeader className="p-5">
                  <CardTitle className="text-xl font-bold">{plan.packageName}</CardTitle>
                  <div className="mt-3">
                    <span className="text-xl font-bold">TZS {Intl.NumberFormat().format(plan.amount)}</span>
                    <span className="text-gray-500 ml-1">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-2 pt-0">
                  <ul className="space-y-3">
                    {plan.subscriptionFeatures.slice(0, 7).map((feature) => (
                      <li key={feature.id} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature.name}</span>
                      </li>
                    ))}
                    {plan.subscriptionFeatures.length > 5 && (
                      <li className="text-sm text-gray-600 italic pl-7">
                        +{plan.subscriptionFeatures.length - 5} more features
                      </li>
                    )}
                  </ul>
                </CardContent>

                <CardFooter className="p-5">
                  {selectedPlan === index ? (
                    <div className="w-full flex items-center justify-center py-2 bg-emerald-50 text-emerald-700 rounded-md font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Selected
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleSelectPlan(index)}
                    >
                      Select Plan
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Renewal Form */}
        <div className="w-full lg:w-1/3">
          <Card className="sticky top-6 border-t-4 border-t-emerald-500">
            <CardHeader>
              <CardTitle>Complete Your Renewal</CardTitle>
              <CardDescription>
                {selectedPlan !== null && subscriptionData[selectedPlan] 
                  ? `You are subscribing to the ${subscriptionData[selectedPlan].packageName} plan`
                  : 'Select a plan to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
             
              
              <RenewSubscriptionForm 
                activeSubscription={activeSubscription} 
                selectedPlan={selectedPlan !== null ? subscriptionData[selectedPlan] : undefined}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRenewal;