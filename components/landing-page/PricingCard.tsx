"use client";

import type { Package } from "@/types/billing/types";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PricingCardProps {
  plan: Package;
  isPopular?: boolean;
}

const FEATURE_PREVIEW_COUNT = 10;

const getPriceFontSize = (formatted: string) => {
  const digitCount = formatted.replace(/\D/g, "").length;
  if (digitCount >= 7) return "text-2xl sm:text-3xl";
  if (digitCount >= 5) return "text-3xl sm:text-4xl";
  return "text-4xl";
};

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isPopular = false,
}) => {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);

  const displayAmount = plan.basePrice * 12;
  const period = plan.billingInterval === "MONTHLY" ? "/month" : "/year";

  const formattedAmount = displayAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const handleGetStarted = () => {
    router.push(`/register?package=${plan.id}`);
  };

  const includedFeatures = (plan.features ?? []).filter(
    (f: any) => f.isIncluded,
  );
  const previewFeatures = includedFeatures.slice(0, FEATURE_PREVIEW_COUNT);
  const extraFeatures = includedFeatures.slice(FEATURE_PREVIEW_COUNT);

  const formatFeatureLabel = (f: any) => {
    const name = f.feature?.name ?? "";
    const value = f.featureValue;

    if (value === "true" || value === "false") return name;
    if (value === "-1") return `Unlimited ${name.replace(" Limit", "")}`;
    if (f.feature?.featureType === "LIMIT") return `${name}: ${value}`;

    return name;
  };

  const renderFeatureItem = (f: any, i: number) => (
    <li
      key={f.feature?.id ?? i}
      className={`flex items-start gap-2 text-sm ${
        isPopular ? "text-gray-200" : "text-gray-700 dark:text-gray-300"
      }`}
    >
      <CheckIcon className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
      <span>{formatFeatureLabel(f)}</span>
    </li>
  );

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative flex flex-col rounded-2xl p-6 ${
        isPopular
          ? "bg-gray-900 text-white shadow-2xl ring-1 ring-primary/40"
          : "bg-card border border-border hover:shadow-lg"
      }`}
    >
      {isPopular && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-3.5 left-1/2 -translate-x-1/2"
        >
          <span className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            Most Popular
          </span>
        </motion.div>
      )}

      <div className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-primary">
          {plan.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-1 min-w-0">
          <span
            className={`font-bold leading-tight ${getPriceFontSize(formattedAmount)} ${
              isPopular ? "text-white" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {formattedAmount}
          </span>
          <span
            className={`text-sm ${isPopular ? "text-gray-400" : "text-gray-500"}`}
          >
            {period}
          </span>
        </div>
      </div>

      <div
        className={`h-px mb-6 ${isPopular ? "bg-gray-700" : "bg-gray-100 dark:bg-gray-800"}`}
      />

      {plan.description && (
        <p
          className={`text-sm mb-6 leading-relaxed ${
            isPopular ? "text-gray-300" : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {plan.description}
        </p>
      )}

      {includedFeatures.length > 0 && (
        <div className="mb-8">
          {/* Always-visible preview */}
          <ul className="space-y-2.5">
            {previewFeatures.map((f, i) => renderFeatureItem(f, i))}
          </ul>

          {/* Expandable, height-capped, scrollable overflow */}
          <AnimatePresence initial={false}>
            {showAll && extraFeatures.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <ul className="space-y-2.5 pt-2.5 max-h-40 overflow-y-auto pr-1">
                  {extraFeatures.map((f, i) =>
                    renderFeatureItem(f, i + FEATURE_PREVIEW_COUNT),
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {extraFeatures.length > 0 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className={`mt-3 text-xs font-medium underline underline-offset-2 ${
                isPopular
                  ? "text-gray-300 hover:text-white"
                  : "text-primary hover:text-primary/80"
              }`}
            >
              {showAll ? "Show less" : `+${extraFeatures.length} more features`}
            </button>
          )}
        </div>
      )}

      <div className="mt-auto">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGetStarted}
          className={`w-full px-6 py-3.5 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm ${
            isPopular
              ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
              : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
          }`}
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};
