"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Layers } from "lucide-react";
import React from "react";

type ProductSummaryProps = {
  data: {
    totalProducts: number;
    totalProductVariants: number;
  };
};

function ProductSummary({ data }: ProductSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Products
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Package className="h-4 w-4 text-gray-500" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.totalProducts}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Variants
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Layers className="h-4 w-4 text-gray-500" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.totalProductVariants}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductSummary;
