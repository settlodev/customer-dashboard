"use client";
import { fetchSubscriptions } from "@/lib/actions/subscriptions";
import { Subscriptions, SubscriptionFeature } from "@/types/subscription/type";
import { ArrowRight, CheckIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PricingCardProps {
  sub: Subscriptions;
  packageName: string;
  amount: number;
  discount: number;
  packageCode: string;
  subscriptionFeatures: string[];
  isPopular?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  sub,
  packageName,
  amount,
  subscriptionFeatures,
  isPopular = false,
}) => {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const shouldShowMoreButton = subscriptionFeatures.length > 10;
  const displayedFeatures = showAll
    ? subscriptionFeatures
    : subscriptionFeatures.slice(0, 10);

  const annualAmount = amount * 12;
  const formattedAnnualAmount = annualAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const handleGetStarted = () => {
    router.push(`/register?package=${sub.id}`);
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
        <h3
          className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
            isPopular ? "text-primary" : "text-primary"
          }`}
        >
          {packageName}
        </h3>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-bold ${
              isPopular ? "text-white" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {formattedAnnualAmount}
          </span>
          <span
            className={`text-sm ${
              isPopular ? "text-gray-400" : "text-gray-500"
            }`}
          >
            /year
          </span>
        </div>
      </div>

      <div
        className={`h-px mb-6 ${
          isPopular ? "bg-gray-700" : "bg-gray-100 dark:bg-gray-800"
        }`}
      />

      <div className="flex-grow space-y-3.5 mb-8">
        {displayedFeatures.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 rounded-full p-0.5 mt-0.5 ${
                isPopular ? "bg-primary/20" : "bg-primary/10"
              }`}
            >
              <CheckIcon
                className={`w-3.5 h-3.5 ${
                  isPopular ? "text-primary" : "text-primary"
                }`}
                strokeWidth={3}
              />
            </div>
            <span
              className={`text-sm leading-relaxed ${
                isPopular ? "text-gray-300" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {feature}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3">
        {shouldShowMoreButton && !showAll ? (
          <button
            onClick={() => setShowAll(true)}
            className={`w-full px-6 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
              isPopular
                ? "text-gray-300 bg-gray-800 hover:bg-gray-700"
                : "text-primary bg-primary/5 hover:bg-primary/10"
            }`}
          >
            Show All Features
          </button>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export const Pricing: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscriptions[]>([]);

  useEffect(() => {
    const getSubscriptions = async () => {
      try {
        const data = await fetchSubscriptions();
        const filteredPlans = data.filter(
          (plan) => !plan.packageName.toLowerCase().includes("trial"),
        );
        setSubscriptions(filteredPlans);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      }
    };
    getSubscriptions();
  }, []);

  const isPopularPackage = (subscription: Subscriptions): boolean => {
    return subscription.amount === 25000;
  };

  return (
    <section id="pricing" className="relative z-20 w-full overflow-hidden py-28 md:py-32">
      {/* Background */}
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
          {subscriptions.map((sub) => (
            <PricingCard
              key={sub.id}
              sub={sub}
              packageName={sub.packageName}
              amount={sub.amount}
              discount={sub.discount}
              packageCode={sub.packageCode}
              subscriptionFeatures={sub.subscriptionFeatures.map(
                (feature) => (feature as SubscriptionFeature).name,
              )}
              isPopular={isPopularPackage(sub)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
