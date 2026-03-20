"use client";
import React, { useState, useEffect } from "react";
import {
  fetchBusinessPaymentMethods,
  toggleLocationPaymentMethod,
  fetchLocationPaymentMethods,
} from "@/lib/actions/payment-method-actions";
import { PaymentMethodCard } from "./paymentCard";
import { PaymentMethod } from "@/types/payments/type";
import { Skeleton } from "@/components/ui/skeleton";

export default function AcceptedPaymentMethodsPage() {
  const [allMethods, setAllMethods] = useState<PaymentMethod[]>([]);
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [business, location] = await Promise.all([
          fetchBusinessPaymentMethods(),
          fetchLocationPaymentMethods(),
        ]);

        setAllMethods(business);

        // Build set of enabled IDs from location methods
        const enabled = new Set<string>();
        for (const method of location) {
          enabled.add(method.id);
          if (method.children) {
            for (const child of method.children) {
              enabled.add(child.id);
            }
          }
        }
        setEnabledIds(enabled);
      } catch (err: any) {
        setError(err.message || "Failed to load payment methods");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = async (methodId: string, enabled: boolean) => {
    setToggling(methodId);
    try {
      await toggleLocationPaymentMethod(methodId, enabled);

      setEnabledIds((prev) => {
        const next = new Set(prev);
        // Find if this is a parent
        const parent = allMethods.find((m) => m.id === methodId);
        if (parent) {
          // Toggling a parent affects all children
          if (enabled) {
            next.add(methodId);
            parent.children?.forEach((c) => next.add(c.id));
          } else {
            next.delete(methodId);
            parent.children?.forEach((c) => next.delete(c.id));
          }
        } else {
          // Toggling a child
          if (enabled) {
            next.add(methodId);
          } else {
            next.delete(methodId);
          }
        }
        return next;
      });
    } catch (err: any) {
      console.error("Failed to toggle payment method:", err);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </div>
              </div>
              <Skeleton className="h-5 w-10 rounded-full" />
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

  const totalChildren = allMethods.reduce(
    (sum, m) => sum + (m.children?.length ?? 0),
    0,
  );
  const totalMethods = allMethods.length + totalChildren;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Payments</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {enabledIds.size} of {totalMethods} payment methods enabled
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {allMethods
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              enabledIds={enabledIds}
              toggling={toggling}
              onToggle={handleToggle}
            />
          ))}
      </div>
    </div>
  );
}
