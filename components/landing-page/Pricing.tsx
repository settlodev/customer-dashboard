"use client";

import { getPackages } from "@/lib/actions/billing-actions";
import type { Package } from "@/types/billing/types";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PricingCard } from "@/components/landing-page/PricingCard";

type EntityType = "LOCATION" | "STORE" | "WAREHOUSE";

const TABS: { label: string; value: EntityType }[] = [
  { label: "Store", value: "STORE" },
  { label: "Location", value: "LOCATION" },
  { label: "Warehouse", value: "WAREHOUSE" },
];

// Plans to exclude per entity type, e.g. Basic isn't offered for Location
const EXCLUDED_CODES: Partial<Record<EntityType, string[]>> = {
  LOCATION: ["BASIC"],
};

export const Pricing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EntityType>("LOCATION");
  const [packagesByType, setPackagesByType] = useState<
    Partial<Record<EntityType, Package[]>>
  >({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (packagesByType[activeTab]) return;

    const fetchPlans = async () => {
      setLoading(true);
      try {
        const data = await getPackages(activeTab);
        setPackagesByType((prev) => ({
          ...prev,
          [activeTab]: data.filter((p) => p.isActive),
        }));
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [activeTab, packagesByType]);

  const packages = packagesByType[activeTab] ?? [];

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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto min-h-[24rem] items-start"
          >
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card animate-pulse h-96"
                />
              ))}

            {!loading &&
              packages.map((plan, index) => {
                const isPopular = plan.code?.includes("PROFESSIONAL");
                return (
                  <motion.div
                    key={plan.id}
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

            {!loading && packages.length === 0 && (
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
