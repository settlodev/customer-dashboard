'use client';
import { getStockVariantMovement, getStockVariantSummary } from '@/lib/actions/stock-variant-actions';
import { UUID } from 'crypto';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StockMovementDashboard from '@/components/widgets/stock-movement';

import BreadcrumbsNav from '@/components/layouts/breadcrumbs-nav';

type Params = Promise<{id: string}>
type SearchParams = Promise<{stock?: string}>

export default async function StockVariantDetails({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const stock = resolvedSearchParams.stock;

  try {
    const [movementData, summaryData] = await Promise.all([
      getStockVariantMovement(resolvedParams.id as UUID),
      getStockVariantSummary(resolvedParams.id as UUID, stock as UUID)
    ]);

    const breadCrumbItems = [
      {title: "Stock Items", link: "/warehouse-stock-variants"},
      {title: `${movementData[0]?.stockName}-${movementData[0]?.stockVariantName}`, link: ""}
    ];

    return (
      <div className="p-4 space-y-4 mt-6">
        <BreadcrumbsNav items={breadCrumbItems} />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className='space-y-2'>
                <h3 className='font-bold text-lg'>Stock Movements History</h3>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
                  <div className='flex items-center gap-2'>
                    <h2 className='text-[32px] font-bold capitalize'>
                      {movementData[0]?.stockName}
                      <span className="text-black">-</span>
                      {movementData[0]?.stockVariantName}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <StockMovementDashboard movements={movementData} summary={summaryData} />
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4">
        <div className="text-red-500">
          Error loading data: {error instanceof Error ? error.message : 'Unknown error occurred'}
        </div>
      </div>
    );
  }
}