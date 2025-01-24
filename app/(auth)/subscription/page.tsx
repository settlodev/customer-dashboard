'use client'
import React, { useEffect,useState } from "react";
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
  // const paymentInstructionsRef = useRef<HTMLDivElement | null>(null);

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
    <div className="">
      <div className="">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan for Your Business
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Our flexible pricing options are designed to grow with your business, ensuring you have all the tools you need at every stage.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 rounded-2xl">
          {subscriptionData.map((plan, index) => (
            <Card 
              key={index}
              className={`relative transform hover:scale-105 transition-transform duration-300 ${
                index === 1 ? "border-2 border-emerald-500" : ""
              }`}
            >
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-emerald-500 text-white px-3 py-1">
                    <Star className="w-4 h-4 mr-1 inline" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{plan.packageName}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">TZS {Intl.NumberFormat().format(plan.amount)}</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <CardDescription className="mt-4 text-gray-600">
                  {/* {plan.description} */}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-4">
                  {/* Limit to the first five features */}
                  {plan.subscriptionFeatures.slice(0, 10).map((feature) => (
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
                      ? "bg-emerald-500 hover:bg-emerald-200" 
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  Pay Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SubscriptionPage;
