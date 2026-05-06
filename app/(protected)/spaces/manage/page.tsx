"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Combine, AlertTriangle } from "lucide-react";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import FloorPlanManager from "@/components/forms/floor_plan_form";
import TableCombinationManager from "@/components/forms/table_combination_form";
import {
  fetchAllSpaces,
  fetchFloorPlans,
  fetchTableCombinations,
  hydrateCombinations,
} from "@/lib/actions/space-actions";
import { Space, FloorPlan, TableCombination } from "@/types/space/type";

export default function SpacesManagePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [combinations, setCombinations] = useState<TableCombination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [spacesData, plansData, combosData] = await Promise.all([
        fetchAllSpaces(),
        fetchFloorPlans(),
        fetchTableCombinations(),
      ]);
      const hydratedCombos = await hydrateCombinations(combosData, spacesData);
      setSpaces(spacesData);
      setFloorPlans(plansData);
      setCombinations(hydratedCombos);
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

  const breadcrumbItems = [
    { title: "Tables & Spaces", href: "/spaces" },
    { title: "Manage" },
  ];

  if (isLoading) {
    return (
      <PageShell>
        <PageBreadcrumbs items={breadcrumbItems} />
        <PageHeader
          title="Floor plans & combinations"
          subtitle="Organise your restaurant layout and group tables for large parties."
        />
        <PageBody>
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <Loading />
            </CardContent>
          </Card>
        </PageBody>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <PageBreadcrumbs items={breadcrumbItems} />
        <PageHeader
          title="Floor plans & combinations"
          subtitle="Organise your restaurant layout and group tables for large parties."
        />
        <PageBody>
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-neg" />
              <h3 className="text-sm font-semibold text-ink">
                Couldn&rsquo;t load layout data
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">{error}</p>
              <Button
                size="sm"
                onClick={() => {
                  setIsLoading(true);
                  loadData();
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </PageBody>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageBreadcrumbs items={breadcrumbItems} />
      <PageHeader
        title="Floor plans & combinations"
        subtitle="Organise your restaurant layout and group tables for large parties."
      />

      <PageBody>
        <Tabs defaultValue="floor-plans" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="floor-plans" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Floor plans
            </TabsTrigger>
            <TabsTrigger value="combinations" className="gap-2">
              <Combine className="h-4 w-4" />
              Combinations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="floor-plans" className="mt-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    Floor plans
                  </h2>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    Create and manage floor plans to organise your tables
                    visually.
                  </p>
                </div>
                <FloorPlanManager
                  floorPlans={floorPlans}
                  onRefresh={loadData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="combinations" className="mt-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    Table combinations
                  </h2>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    Group multiple tables together to accommodate larger
                    parties.
                  </p>
                </div>
                <TableCombinationManager
                  combinations={combinations}
                  allSpaces={spaces}
                  onRefresh={loadData}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageShell>
  );
}
