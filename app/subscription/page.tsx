"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllSubscriptions } from "@/lib/actions/subscription";
import { Subscription } from "@/types/subscription/type";
import { useEffect, useState } from "react";

function SubscriptionPage() {
    const [subscriptionData, setSubscriptionData] = useState<Subscription[]>([]);
   useEffect(() => {
       const fetchSubscriptions = async () => {
           try {
            const subscriptions = await getAllSubscriptions();
            console.log("The response on the page for subscriptions is:", subscriptions);
            setSubscriptionData(subscriptions);
           } catch (error) {
            console.error("Error fetching subscriptions", error);
           }
       };

       fetchSubscriptions();
   }, []);
    return (
        <div className="p-10 flex flex-col gap-2 items-center lg:p-20">
            <h1 className="flex text-xl font-semibold justify-center items-center lg:text-[28px] capitalize">Choose the plan that’s right for you.</h1>

            <p className="text-[14px] font-medium lg:text-[22px] capitalize">No commitment, no monthly contract. Only pay when you use. Cancel anytime.</p>
            <div className="flex flex-col lg:grid grid-cols-3 gap-4">
               {
                   subscriptionData.map((plan, index) => (
                       <Card key={index}>
                           <CardHeader>
                               <CardTitle className="text-xl">{plan.packageName}</CardTitle>
                               <CardDescription className="text-[25px] font-semibold text-black ">TZS {plan.amount}</CardDescription>
                           </CardHeader>
                           <CardContent className="">
                               {/* <p>{plan.description}</p>
                               <ul>
                                   {
                                       plan.features.map((feature, index) => (
                                           <li key={index} className="flex items-center gap-2">
                                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                               </svg>
                                               {feature}
                                           </li>
                                       ))
                                   }
                               </ul> */}
                           </CardContent>
                           <CardFooter className="text-center">
                               <Button className="w-full text-xl capitalize">
                                   Subscribe now
                               </Button>
                           </CardFooter>
                       </Card>
                   ))
               }
               
            </div>
            <div>
                
            </div>
        </div>
    )
}

export default SubscriptionPage