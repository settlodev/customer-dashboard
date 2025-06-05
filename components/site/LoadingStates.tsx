// components/LoadingStates.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { BusinessType, CategorizedProducts } from '@/types/site/type';

interface LoadingStatesProps {
  initialLoad: boolean;
  loading: boolean;
  error: string | null;
  categorizedProducts: CategorizedProducts;
  businessType: BusinessType;
  onRetry: () => void;
}

const LoadingStates: React.FC<LoadingStatesProps> = ({
  initialLoad,
  loading,
  error,
  categorizedProducts,
  businessType,
  onRetry
}) => {
  // Initial Loading State
  if (initialLoad && loading) {
    return (
      <div className="text-center py-16">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${businessType.accent} mx-auto mb-4`}></div>
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-16 bg-red-50 rounded-lg">
        <div className="text-red-500 text-xl mb-2">😕</div>
        <p className="text-red-500">{error}</p>
        <Button onClick={onRetry} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  // No Products State
  if (!initialLoad && !loading && !error && Object.keys(categorizedProducts).length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <div className="text-gray-400 text-4xl mb-2">🔍</div>
        <p className="text-gray-600 mb-2">No products found</p>
        <p className="text-gray-500 text-sm">Try a different search term or browse our categories</p>
      </div>
    );
  }

  return null;
};

export default LoadingStates;