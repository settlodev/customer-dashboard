'use client';

import { getStockVariantMovement } from '@/lib/actions/stock-variant-actions';
import { UUID } from 'crypto';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StockMovementDashboard from '@/components/widgets/stock-movement';
import { StockMovement} from '@/types/stockVariant/type';
import Loading from '@/app/loading';

export default  function StockVariantDetails({params}: {params: {id: string}}) {
    const [variant, setVariant] = useState<StockMovement[]>([]); 
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
      const fetchStockVariantDetail = async () => {
        try {
          const data= await getStockVariantMovement(params.id as UUID);
          
          setVariant(data);
        } catch (error) {
          console.error("Error fetching stock movement history:", error );
        }
        finally {
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
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h1 className="text-2xl text-red-600 font-bold">
            </h1>
            <p className="text-gray-500">
              Stock Movement History
            </p>
          </div>
        </CardContent>
      </Card>

      <StockMovementDashboard movements={variant} />
    </div>
  );
}