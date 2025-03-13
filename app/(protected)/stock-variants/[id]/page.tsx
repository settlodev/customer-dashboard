'use client';

import { getStockVariantMovement, getStockVariantSummary } from '@/lib/actions/stock-variant-actions';
import { UUID } from 'crypto';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StockMovementDashboard from '@/components/widgets/stock-movement';
import { StockMovement, stockVariantSummary } from '@/types/stockVariant/type';
import Loading from '@/app/loading';
// import { BoxIcon } from '@/components/icons/box';

import BreadcrumbsNav from '@/components/layouts/breadcrumbs-nav';
import { useSearchParams } from 'next/navigation';

export default function StockVariantDetails({ params }: { params: { id: string } }) {
  // console.log("The id is: ", params);
  const [variant, setVariant] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const stock = searchParams.get("stock");
  const [summary, setSummary] = useState<stockVariantSummary>({} as stockVariantSummary);
  const [error, setError] = useState<Error | null>(null);


  const breadCrumbItems = useMemo(() => [{title: "Stock Items", link: "/stock-variants"},
    {title: `${variant[0]?.stockName}-${variant[0]?.stockVariantName}`, link: ""}],[]);

    useEffect(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [movementData, summaryData] = await Promise.all([
            getStockVariantMovement(params.id as UUID),
            getStockVariantSummary(params.id as UUID, stock as UUID)
          ]);
          
          setVariant(movementData);
          setFilteredMovements(movementData);
          setSummary(summaryData);
        } catch (error) {
          setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        } finally {
          setIsLoading(false);
        }
      };
    
      fetchData();
    }, [params.id, stock]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          <Loading />
        </div>
      </div>
    );
  }
  if (error) {
    return <div>Error loading data: {error.message}</div>;
  }

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
                    {/* <BoxIcon className="w-4 h-4" /> */}
                    {variant[0]?.stockName}
                    <span className="text-black">-</span>
                    {variant[0]?.stockVariantName}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <StockMovementDashboard movements={filteredMovements} summary={summary} />
    </div>
  );
}