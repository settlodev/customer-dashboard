'use client';

import { getStockVariantMovement } from '@/lib/actions/stock-variant-actions';
import { UUID } from 'crypto';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StockMovementDashboard from '@/components/widgets/stock-movement';
import { StockMovement } from '@/types/stockVariant/type';
import Loading from '@/app/loading';
// import { BoxIcon } from '@/components/icons/box';

import BreadcrumbsNav from '@/components/layouts/breadcrumbs-nav';




export default function StockVariantDetails({ params }: { params: { id: string } }) {
  const [variant, setVariant] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // New state for loading

  const breadCrumbItems = [{title: "Stock Items", link: "/stock-variants"},
    {title: `${variant[0]?.stockName}-${variant[0]?.stockVariantName}`, link: ""}];

  useEffect(() => {
    const fetchStockVariantDetail = async () => {
      try {
        const data = await getStockVariantMovement(params.id as UUID);
        setVariant(data);
        setFilteredMovements(data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockVariantDetail();
  }, [params.id]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 mt-6">
    <BreadcrumbsNav items={breadCrumbItems} />
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className='space-y-2'>
              <p className='text-gray-600 text-sm font-medium'>
                Stock Movement Details
              </p>
              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
                <span className='text-gray-700 font-semibold'>
                  Previewing stock movement for
                </span>
                <div className='flex items-center gap-2'>
                  <span className='px-3 py-2 bg-emerald-500 text-white rounded-md font-medium flex items-center gap-1'>
                    {/* <BoxIcon className="w-4 h-4" /> */}
                    {variant[0]?.stockName}
                    <span className="text-emerald-200">|</span>
                    {variant[0]?.stockVariantName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <StockMovementDashboard movements={filteredMovements} />
    </div>
  );
}