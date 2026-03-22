"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Combine } from "lucide-react";

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import Loading from "@/components/ui/loading";
import FloorPlanManager from "@/components/forms/floor_plan_form";
import TableCombinationManager from "@/components/forms/table_combination_form";
import {
  fetchAllSpaces,
  fetchFloorPlans,
  fetchTableCombinations,
} from "@/lib/actions/space-actions";
import { Space, FloorPlan, TableCombination } from "@/types/space/type";

const breadcrumbItems = [
  { title: "Tables & Spaces", link: "/spaces" },
  { title: "Manage", link: "/spaces/manage" },
];

export default function SpacesManagePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [combinations, setCombinations] = useState<TableCombination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized so child components get a stable reference
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [spacesData, plansData, combosData] = await Promise.all([
        fetchAllSpaces(),
        fetchFloorPlans(),
        fetchTableCombinations(),
      ]);
      setSpaces(spacesData);
      setFloorPlans(plansData);
      setCombinations(combosData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
                Error Loading Data
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => {
                  setIsLoading(true);
                  loadData();
                }}
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
          Manage Floor Plans & Combinations
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Organize your restaurant layout and group tables for large parties
        </p>
      </div>

      <Tabs defaultValue="floor-plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="floor-plans" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Floor Plans
          </TabsTrigger>
          <TabsTrigger value="combinations" className="gap-2">
            <Combine className="h-4 w-4" />
            Combinations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="floor-plans" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Floor Plans</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage floor plans to organize your tables visually
              </p>
            </div>
            <FloorPlanManager
              floorPlans={floorPlans}
              onRefresh={loadData}
            />
          </div>
        </TabsContent>

        <TabsContent value="combinations" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Table Combinations</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Group multiple tables together to accommodate larger parties
              </p>
            </div>
            <TableCombinationManager
              combinations={combinations}
              allSpaces={spaces}
              onRefresh={loadData}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
