"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  acceptOrderPaymentMethods,
  updateOrderPaymentMethods,
} from "@/lib/actions/settings-actions";
import { PaymentMethodCard } from "./paymentCard";
import {
  PaymentMethodCategory,
  PaymentMethodsResponse,
} from "@/types/payments/type";

export default function AcceptedPaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsResponse>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        const data = await acceptOrderPaymentMethods();
        setPaymentMethods(data);

        const preSelected = data
          .flatMap(
            (category: PaymentMethodCategory) =>
              category.acceptedPaymentMethodTypes,
          )
          .filter((method) => method.isEnabled)
          .map((method) => method.id);

        setSelectedMethods(preSelected);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleMethodToggle = (methodId: string) => {
    setSelectedMethods((prev) =>
      prev.includes(methodId)
        ? prev.filter((id) => id !== methodId)
        : [...prev, methodId],
    );
  };

  const handleCategoryToggle = (
    categoryName: string,
    methods: any[],
    selectAll: boolean,
  ) => {
    const methodIds = methods.map((m) => m.id);
    if (selectAll) {
      setSelectedMethods((prev) => [...new Set([...prev, ...methodIds])]);
    } else {
      setSelectedMethods((prev) =>
        prev.filter((id) => !methodIds.includes(id)),
      );
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      await updateOrderPaymentMethods({
        newAcceptedPaymentMethodTypeIds: selectedMethods,
      });

      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Payments</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage accepted payment methods for your location
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

  const totalMethods = paymentMethods.reduce(
    (sum, cat) => sum + cat.acceptedPaymentMethodTypes.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Payments</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {totalMethods} payment methods available across{" "}
          {paymentMethods.length} categories
        </p>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{saveError}</p>
        </div>
      )}

      {/* Save success */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">
            Payment methods updated successfully.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {paymentMethods.map((category) => (
          <PaymentMethodCard
            key={category.name}
            category={category}
            selectedMethods={selectedMethods}
            onMethodToggle={handleMethodToggle}
            onCategoryToggle={handleCategoryToggle}
          />
        ))}
      </div>

      <div className="flex items-center justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={selectedMethods.length === 0 || saving}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Saving...
            </span>
          ) : (
            `Save Selection (${selectedMethods.length})`
          )}
        </Button>
      </div>
    </div>
  );
}
