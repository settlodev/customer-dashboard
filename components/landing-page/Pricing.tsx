"use client";

import { getPackages } from "@/lib/actions/billing-actions";
import type { Package } from "@/types/billing/types";
import { ArrowRight, CheckIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PricingCardProps {
  plan: Package;
  isPopular?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, isPopular = false }) => {
  const router = useRouter();

  const annualAmount = plan.basePrice * 12;
  const formattedAnnualAmount = annualAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const handleGetStarted = () => {
    router.push(`/register?package=${plan.id}`);
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${
        isPopular
          ? "bg-gray-900 text-white shadow-2xl scale-[1.03]"
          : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-primary">
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-bold ${
              isPopular ? "text-white" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {formattedAnnualAmount}
          </span>
          <span className={`text-sm ${isPopular ? "text-gray-400" : "text-gray-500"}`}>
            /year
          </span>
        </div>
      </div>

      <div className={`h-px mb-6 ${isPopular ? "bg-gray-700" : "bg-gray-100 dark:bg-gray-800"}`} />

      {plan.description && (
        <p
          className={`text-sm mb-6 leading-relaxed ${
            isPopular ? "text-gray-300" : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {plan.description}
        </p>
      )}

      <div className="mt-auto">
        <button
          onClick={handleGetStarted}
          className={`w-full px-6 py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
            isPopular
              ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
              : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
          }`}
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const Pricing: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getPackages();
        setPackages(data.filter((p) => p.isActive));
      } catch (error) {
        console.error("Error fetching packages:", error);
      }
    };
    fetchPlans();
  }, []);

  return (
    <section id="pricing" className="relative z-20 w-full overflow-hidden py-28 md:py-32">
      <div className="absolute inset-0 bg-white dark:bg-gray-950" />

      <div className="relative max-w-[85rem] mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-14 md:mb-20">
          <h2
            className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-5"
            style={{ lineHeight: "1.35" }}
          >
            Choose the perfect{" "}
            <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
              plan for your business
            </span>
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Flexible pricing options designed to grow with your business,
            ensuring you have all the tools you need at every stage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {packages.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
};
