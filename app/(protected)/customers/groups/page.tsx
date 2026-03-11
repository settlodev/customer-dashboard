"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import Loading from "@/app/loading";
import CustomerGroupManager from "@/components/forms/customer_group_form";
import { fetchCustomerGroups } from "@/lib/actions/customer-actions";
import { CustomerGroup } from "@/types/customer/type";

const breadcrumbItems = [
  { title: "Customers", link: "/customers" },
  { title: "Groups", link: "/customers/groups" },
];

export default function CustomerGroupsPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCustomerGroups();
      setGroups(data);
    } catch (err) {
      console.error("Failed to load customer groups:", err);
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Error Loading Groups
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => loadData()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1 md:max-w-md">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Customer Groups
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Organize and segment your customers into groups like VIPs, Corporate,
          or Regulars
        </p>
      </div>

      <CustomerGroupManager groups={groups} onRefresh={loadData} />
    </div>
  );
}
