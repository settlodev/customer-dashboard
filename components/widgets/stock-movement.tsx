"use client";

import type { StockMovement } from "@/types/stock-movement/type";
import PaginatedStockTable from "./paginatedStock";

const StockMovementDashboard = ({
  movements,
}: {
  movements: StockMovement[];
}) => {
  return (
    <div className="space-y-4">
      <PaginatedStockTable movements={movements} />
    </div>
  );
};

export default StockMovementDashboard;
