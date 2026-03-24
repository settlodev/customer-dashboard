"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  fetchLocationPaymentMethods,
  toggleLocationPaymentMethod,
} from "@/lib/actions/payment-method-actions";
import { PaymentMethodCard } from "./paymentCard";
import { PaymentMethod } from "@/types/payments/type";
import { Skeleton } from "@/components/ui/skeleton";

export default function AcceptedPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchLocationPaymentMethods();
        setMethods(data);
      } catch (err: any) {
        setError(err.message || "Failed to load payment methods");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = useCallback(async (methodId: string, enabled: boolean) => {
    setToggling(methodId);
    try {
      await toggleLocationPaymentMethod(methodId, enabled);

      // Optimistic update
      setMethods((prev) =>
        prev.map((m) => {
          // Check if this is the toggled parent
          if (m.id === methodId) {
            return {
              ...m,
              enabled,
              // Enable parent → disable all children
              children: enabled
                ? m.children?.map((c) => ({ ...c, enabled: false })) ?? null
                : m.children,
            };
          }

          // Check if a child of this parent was toggled
          if (m.children?.some((c) => c.id === methodId)) {
            return {
              ...m,
              // Enable child → disable parent
              enabled: enabled ? false : m.enabled,
              children: m.children.map((c) =>
                c.id === methodId ? { ...c, enabled } : c,
              ),
            };
          }

          return m;
        }),
      );
    } catch (err: any) {
      console.error("Failed to toggle payment method:", err);
    } finally {
      setToggling(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="py-4 px-1 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40 mt-1.5" />
                </div>
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Payments</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage accepted payment methods for your location
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading payment methods: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Payments</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage accepted payment methods for your location
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4">
        {methods
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              toggling={toggling}
              onToggle={handleToggle}
            />
          ))}
      </div>
    </div>
  );
}
