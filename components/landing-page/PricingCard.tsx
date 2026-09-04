"use client";

import type { Package } from "@/types/billing/types";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  featureKeyOf,
  formatFeatureLabel,
  type RawPackageFeature,
} from "@/lib/billing/feature-label";

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

  const displayAmount =
    plan.billingInterval === "YEARLY" ? plan.basePrice : plan.basePrice * 12;
  const period = "/year";

  const formattedAmount = displayAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const handleGetStarted = () => {
    // Billing resolves the chosen plan by CODE, not by id:
    // PackageService.getTrialPackage() trims/uppercases the planCode carried on
    // the LOCATION_CREATED event and looks it up with
    // findByCodeAndEntityTypeAndIsActiveTrue(code, LOCATION). Sending the
    // package UUID (as this did) can never match a code, so every signup
    // silently fell back to the default package no matter which card was
    // clicked.
    //
    // LOCATION only, per the same lookup: signup creates a location, and
    // STORE_*/WAREHOUSE_* codes are scoped to their own entity type, so they
    // would not resolve here either. Without a usable code we send nothing and
    // let billing apply its default rather than pass something that cannot
    // resolve.
    const code =
      plan.entityType === "LOCATION" ? plan.code?.trim() : undefined;

    router.push(
      code ? `/register?package=${encodeURIComponent(code)}` : "/register",
    );
  };

  const includedFeatures: RawPackageFeature[] = (plan.features ?? []).filter(
    (f: RawPackageFeature) => f.isIncluded,
  );
  const previewFeatures = includedFeatures.slice(0, FEATURE_PREVIEW_COUNT);
  const extraFeatures = includedFeatures.slice(FEATURE_PREVIEW_COUNT);

  const renderFeatureItem = (f: RawPackageFeature, i: number) => (
    <li
      key={featureKeyOf(f, i)}
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
      className={`relative flex h-full flex-col rounded-2xl p-6 ${
        isPopular
          ? "bg-gray-900 text-white shadow-2xl ring-1 ring-primary/40"
          : "bg-card border border-border hover:shadow-lg"
      }`}
    >
      {isPopular && (
        // Centred with flex, not `left-1/2 -translate-x-1/2`: Framer writes the
        // animated `y` into the element's own `transform`, which overrides the
        // Tailwind translate class and left the pill sitting at the 50% mark
        // instead of straddling it. Keeping the animation on an inner element
        // leaves the centring untouched.
        <div className="absolute -top-3.5 inset-x-0 flex justify-center pointer-events-none">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Most Popular
          </motion.span>
        </div>
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
                {/* No inner max-height/scroll here: a nested scroll area inside
                    a height-animating container fought the page scroll (the
                    wheel would trap, then jump once the list hit its cap).
                    The card simply grows instead — the grid is items-stretch,
                    so its neighbours keep pace. */}
                <ul className="space-y-2.5 pt-2.5">
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
