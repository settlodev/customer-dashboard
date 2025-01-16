'use client'
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllSubscriptions } from "@/lib/actions/subscription";
import { Subscription } from "@/types/subscription/type";
import { CheckCircle2, Star } from "lucide-react";
import Loading from "../loading";

const SubscriptionPage = () => {
  const [subscriptionData, setSubscriptionData] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
//   const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const paymentInstructionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const subscriptions = await getAllSubscriptions();
        setSubscriptionData(subscriptions);
      } catch (error) {
        console.error("Error fetching subscriptions", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleGetStartedClick = () => {
    // setShowPaymentInstructions(true)
    if (paymentInstructionsRef.current) {
      paymentInstructionsRef.current.scrollIntoView({ behavior: "smooth" }); 
      
    }
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scale your business with flexible pricing. No hidden fees, no commitments.
            Cancel anytime.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {subscriptionData.map((plan, index) => (
            <Card 
              key={index}
              className={`relative transform hover:scale-105 transition-transform duration-300 ${
                index === 1 ? "border-2 border-blue-500" : ""
              }`}
            >
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">
                    <Star className="w-4 h-4 mr-1 inline" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{plan.packageName}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">TZS {Intl.NumberFormat().format(plan.amount)}</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <CardDescription className="mt-4 text-gray-600">
                  {/* {plan.description} */}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-4">
                  {/* Limit to the first five features */}
                  {plan.subscriptionFeatures.slice(0, 5).map((feature) => (
                    // Extract the name of each feature for rendering
                    <li key={feature.id} className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                      <span className="text-gray-700">{feature.name}</span> {/* Use feature.name instead of feature */}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                onClick={handleGetStartedClick} 
                  className={`w-full py-6 text-lg font-semibold ${
                    index === 1 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  Pay Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

          {/* Payment Instructions Section */}
          {/* {showPaymentInstructions && ( */}
          <div ref={paymentInstructionsRef} className="bg-white p-6 rounded-lg shadow-md mb-16">
            <h2 className="text-xl font-bold mb-4">How to Pay Using Lipa Na M-PESA</h2>

            {/* For Payments via M-PESA Menu */}
            <h3 className="font-semibold mt-4">For Payments via M-PESA Menu:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Dial: *150*00#</li>
              <li>Select: 4 for &quot;Lipa kwa M-PESA&quot;</li>
              <li>Choose: 1 for  &quot;Lipa Kwa SIMU &quot;</li>
              <li>Enter Lipa Number: <span className="font-extrabold text-black">54224615.</span></li>
              <li>Input Amount: Enter the amount of subscription required to pay.</li>
              <li>Enter PIN: Input your M-PESA PIN to confirm the transaction.</li>
              <li>Business Name: Confirm that the business name is <span className="font-bold text-black">SETTLO TECHNOLOGIES LIMITED</span>.</li>
            </ol>

            {/* For Payments via Other Networks */}
            <h3 className="font-semibold mt-4">For Payments via Other Networks:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Open Menu of Financial Services.</li>
              <li>Select: Tuma Pesa.</li>
              <li>Choose: Kwenda Mitandao Mingine.</li>
              <li>Select: MPESA.</li>
              <li>Enter Lipa Number: <span className="font-extrabold text-black">54224615.</span></li>
              <li>Input Amount: Enter the amount of subscription required to pay.</li>
              <li>Enter PIN: Input your M-PESA PIN to confirm the transaction.</li>
              <li>Business Name: Confirm that the business name is <span className="font-bold text-black">SETTLO TECHNOLOGIES LIMITED</span>.</li>
            </ol>

            {/* Confirmation Message */}
            <p className="mt-4 text-gray-700">
              After completing your payment, please send a confirmation message via WhatsApp to our number: 
              <span className="font-semibold"> (+255) 0759229777</span>.
            </p>
          </div>
        

        {/* Trust Signals */}
        {/* <div className="text-center mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold mb-2">30-Day Money Back</h3>
              <p className="text-gray-600">Not satisfied? Get a full refund within 30 days</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">Your data is protected with bank-level security</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Get help anytime via email or phone</p>
            </div>
          </div>
        </div> */}

       

      </div>
    </div>
  );
};

export default SubscriptionPage;
