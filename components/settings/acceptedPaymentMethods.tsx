"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { acceptOrderPaymentMethods } from "@/lib/actions/settings-actions";
import { PaymentMethodCard } from "./paymentCard";

export default function AcceptedPaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMethods, setSelectedMethods] = useState([]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        const data = await acceptOrderPaymentMethods();
        setPaymentMethods(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleMethodToggle = (methodId: any) => {
    setSelectedMethods((prev) => {
      if (prev.includes(methodId)) {
        return prev.filter((id) => id !== methodId);
      } else {
        return [...prev, methodId];
      }
    });
  };

  const handleCategoryToggle = (categoryId, methods, selectAll) => {
    const methodIds = methods.map((m) => m.id);

    if (selectAll) {
      setSelectedMethods((prev) => [...new Set([...prev, ...methodIds])]);
    } else {
      setSelectedMethods((prev) =>
        prev.filter((id) => !methodIds.includes(id)),
      );
    }
  };

  const handleSubmit = () => {
    console.log("Selected payment methods:", selectedMethods);
    alert(`${selectedMethods.length} payment methods selected`);
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading payment methods: {error}</p>
        </div>
      </div>
    );
  }

  const totalMethods = paymentMethods.reduce(
    (sum, cat) =>
      sum + cat.acceptedPaymentMethodTypes.filter((m) => m.isEnabled).length,
    0,
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Accepted Payment Methods
        </h1>
        <p className="text-gray-600">
          {totalMethods} payment methods available across{" "}
          {paymentMethods.length} categories
        </p>
      </div>

      <div className="flex items-center justify-end mb-4 bg-white rounded-lg border border-gray-200 p-4">
        <Button onClick={handleSubmit} disabled={selectedMethods.length === 0}>
          Save Selection
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {paymentMethods.map((category) => (
          <PaymentMethodCard
            key={category.id}
            category={category}
            selectedMethods={selectedMethods}
            onMethodToggle={handleMethodToggle}
            onCategoryToggle={handleCategoryToggle}
          />
        ))}
      </div>
    </div>
  );
}
