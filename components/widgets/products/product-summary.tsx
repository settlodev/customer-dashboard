'use client';
import { Card, CardContent } from '@/components/ui/card'
import React from 'react'

type ProductSummaryProps = {
  data: {
    totalProducts: number;
    totalProductVariants: number;
  };
}

function ProductSummary({ data }: ProductSummaryProps) {
    return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card className='w-full'>
                <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h3 className='text-lg font-semibold'>Total Products</h3>
                            <p className='text-sm text-muted-foreground'>Product count</p>
                        </div>
                        <div className='text-xl font-bold'>{data.totalProducts}</div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className='w-full'>
                <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h3 className='text-lg font-semibold'>Total Variants</h3>
                            <p className='text-sm text-muted-foreground'>Product variants count</p>
                        </div>
                        <div className='text-xl font-bold'>{data.totalProductVariants}</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ProductSummary