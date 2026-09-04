"use client";

import { getPackages } from "@/lib/actions/billing-actions";
import type { Package } from "@/types/billing/types";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PricingCard } from "@/components/landing-page/PricingCard";
import { planTier, type PlanTier } from "@/lib/billing/plan-tier";

type EntityType = "LOCATION" | "STORE" | "WAREHOUSE";
type TabStatus = "idle" | "loading" | "error";

const TABS: { label: string; value: EntityType }[] = [
  { label: "Store", value: "STORE" },
  { label: "Location", value: "LOCATION" },
  { label: "Warehouse", value: "WAREHOUSE" },
];

// Plans to exclude per entity type, e.g. Basic isn't offered for Location.
// Keyed by tier derived from the package name — the packages endpoint returns
// no `code`, so the previous `p.code?.includes("BASIC")` test never matched
// and BASIC was in fact still being listed under Location.
const EXCLUDED_TIERS: Partial<Record<EntityType, PlanTier[]>> = {
  LOCATION: ["BASIC"],
};

/**
 * Annualised price, matching what PricingCard displays (it renders a /year
 * figure, multiplying up when the package bills monthly). Sorting on the raw
 * `basePrice` would interleave monthly and yearly packages.
 */
export const annualisedPrice = (p: Package): number =>
  p.billingInterval === "YEARLY" ? p.basePrice : p.basePrice * 12;

export const Pricing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EntityType>("LOCATION");
  const [packagesByType, setPackagesByType] = useState<
    Partial<Record<EntityType, Package[]>>
  >({});
  const [status, setStatus] = useState<Record<EntityType, TabStatus>>({
    STORE: "idle",
    LOCATION: "idle",
    WAREHOUSE: "idle",
  });

  const fetchPlans = useCallback(async (type: EntityType) => {
    setStatus((prev) => ({ ...prev, [type]: "loading" }));
    try {
      const data = await getPackages(type);
      const excludedTiers = EXCLUDED_TIERS[type] ?? [];
      setPackagesByType((prev) => ({
        ...prev,
        // Cheapest first, so the cards read left-to-right by price. The API
        // returns catalogue order, which is not price order — most visibly on
        // the Location tab, where dropping BASIC leaves the rest arbitrary.
        [type]: data
          .filter((p) => {
            if (!p.isActive) return false;
            const tier = planTier(p);
            // An unrecognised tier (new or renamed plan) is kept, not hidden.
            return tier === null || !excludedTiers.includes(tier);
          })
          .sort((a, b) => annualisedPrice(a) - annualisedPrice(b)),
      }));
      setStatus((prev) => ({ ...prev, [type]: "idle" }));
    } catch (error) {
      console.error("Error fetching packages:", error);
      setStatus((prev) => ({ ...prev, [type]: "error" }));
    }
  }, []);

  useEffect(() => {
    if (packagesByType[activeTab] || status[activeTab] !== "idle") return;
    fetchPlans(activeTab);
  }, [activeTab, packagesByType, status, fetchPlans]);

  const packages = packagesByType[activeTab] ?? [];
  const loading = status[activeTab] === "loading";
  const hasError = status[activeTab] === "error";

  return (
    <section
      id="pricing"
      className="relative z-20 w-full overflow-hidden py-28 md:py-32"
    >
      <div className="absolute inset-0 bg-background" />

      <div className="relative max-w-[85rem] mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
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

        {/* Tab switcher */}
        <div className="flex justify-center mb-14">
          <div className="relative inline-flex items-center gap-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800/60 border border-border">
            {TABS.map((tab) => {
              const isActive = tab.value === activeTab;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="relative px-5 py-2 text-sm font-medium rounded-full transition-colors duration-200"
                >
                  {isActive && (
                    <motion.span
                      layoutId="pricing-tab-pill"
                      className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      isActive
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto min-h-[24rem] items-stretch"
          >
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card animate-pulse h-96"
                />
              ))}

            {!loading &&
              !hasError &&
              packages.map((plan, index) => {
                const isPopular = planTier(plan) === "PROFESSIONAL";
                return (
                  <motion.div
                    key={plan.id}
                    className="h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.08,
                      ease: "easeOut",
                    }}
                  >
                    <PricingCard plan={plan} isPopular={isPopular} />
                  </motion.div>
                );
              })}

            {!loading && hasError && (
              <div className="col-span-full flex flex-col items-center gap-3 text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Couldn&apos;t load plans right now. Please try again.
                </p>
                <button
                  onClick={() => fetchPlans(activeTab)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary border border-primary/30 hover:bg-primary-light dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            )}

            {!loading && !hasError && packages.length === 0 && (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                No packages available for this category yet.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
