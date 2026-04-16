"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  BarChart3,
} from "lucide-react";
import type { StockMovement } from "@/types/stock-movement/type";
import { MOVEMENT_TYPE_LABELS } from "@/types/stock-movement/type";

interface PaginatedStockTableProps {
  movements: StockMovement[];
  isLoading?: boolean;
  title?: string;
}

const TYPE_COLORS: Record<string, string> = {
  PURCHASE: "bg-green-50 text-green-700",
  SALE: "bg-blue-50 text-blue-700",
  TRANSFER_IN: "bg-cyan-50 text-cyan-700",
  TRANSFER_OUT: "bg-indigo-50 text-indigo-700",
  RETURN: "bg-amber-50 text-amber-700",
  ADJUSTMENT: "bg-yellow-50 text-yellow-700",
  DAMAGE: "bg-red-50 text-red-700",
  RECIPE_USAGE: "bg-purple-50 text-purple-700",
  OPENING_BALANCE: "bg-emerald-50 text-emerald-700",
  WASTE: "bg-orange-50 text-orange-700",
};

const ITEMS_PER_PAGE = 10;

export default function PaginatedStockTable({
  movements,
  isLoading = false,
  title = "Stock Movements",
}: PaginatedStockTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(movements.length / ITEMS_PER_PAGE));
  const paginatedData = movements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Loading movements...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          {title} ({movements.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No stock movements recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs text-right">Quantity</TableHead>
                    <TableHead className="text-xs text-right">Unit Cost</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((movement) => {
                    const isPositive = movement.quantity > 0;
                    const colors = TYPE_COLORS[movement.movementType] || "bg-gray-50 text-gray-700";

                    return (
                      <TableRow key={movement.movementId}>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
                            {MOVEMENT_TYPE_LABELS[movement.movementType] || movement.movementType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block truncate">
                              {movement.variantName}
                            </span>
                            <span className="text-xs text-muted-foreground">{movement.stockName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {isPositive ? "+" : ""}{movement.quantity.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-600">
                          {movement.unitCost != null ? movement.unitCost.toLocaleString() : "\u2014"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(movement.occurredAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <span className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="h-8 px-2">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="h-8 px-2">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
