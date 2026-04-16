"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { getPackages, getPackageBreakdown } from "@/lib/actions/billing-actions";
import type { Package, PackageFeature } from "@/types/billing/types";
import Loading from "@/components/ui/loading";
import { useRouter } from "next/navigation";

export default function SubscriptionPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [featuresByPkg, setFeaturesByPkg] = useState<Record<string, PackageFeature[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const pkgs = await getPackages("LOCATION");
        setPackages(pkgs.filter((p) => p.isActive));

        // Fetch feature breakdowns in parallel
        const breakdowns = await Promise.allSettled(
          pkgs.map((p) => getPackageBreakdown(p.id)),
        );
        const featureMap: Record<string, PackageFeature[]> = {};
        breakdowns.forEach((result, i) => {
          if (result.status === "fulfilled" && result.value) {
            featureMap[pkgs[i].id] = result.value.features.filter((f) => f.isIncluded);
          }
        });
        setFeaturesByPkg(featureMap);
      } catch {
        // Fail silently — packages will be empty
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelect = (plan: Package) => {
    // For initial onboarding, redirect to dashboard where the subscription
    // will be set up. The billing service creates a trial subscription
    // automatically when a location is created.
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="max-w-7xl mx-auto">
        <div className="text-start lg:text-center mb-6">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Flexible pricing designed to grow with your business.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {packages.map((plan, index) => {
            const features = featuresByPkg[plan.id] || [];
            return (
              <Card
                key={plan.id}
                className={`relative transform hover:scale-[1.02] transition-transform duration-300 ${
                  index === 1 ? "border-2 border-primary" : ""
                }`}
              >
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white px-3 py-1">
                      <Star className="w-4 h-4 mr-1 inline" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-2 sm:mt-4">
                    <span className="text-2xl sm:text-3xl font-bold">
                      TZS {plan.basePrice.toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-2">/month</span>
                  </div>
                  {plan.description && (
                    <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                  )}
                </CardHeader>

                <CardContent className="p-4 sm:p-6 pt-0">
                  <ul className="space-y-2 sm:space-y-3">
                    {features.slice(0, 10).map((feature) => (
                      <li key={feature.id} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature.name}</span>
                      </li>
                    ))}
                    {features.length > 10 && (
                      <li className="text-xs text-gray-400 pl-6">
                        +{features.length - 10} more features
                      </li>
                    )}
                  </ul>
                </CardContent>

                <CardFooter className="p-4 sm:p-6">
                  <Button
                    onClick={() => handleSelect(plan)}
                    className={`w-full py-3 text-base font-semibold ${
                      index === 1
                        ? "bg-primary hover:bg-orange-600"
                        : "bg-gray-900 hover:bg-gray-800"
                    }`}
                  >
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
