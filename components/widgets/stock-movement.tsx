"use client";

import { StockMovement } from "@/types/stockVariant/type";
import PaginatedStockTable from "./paginatedStock";
import { ApiResponse } from "@/types/types";

const StockMovementDashboard = ({
  movements,
  currentPage,
  pageSize,
}: {
  movements: ApiResponse<StockMovement>;
  currentPage: number;
  pageSize: number;
}) => {
  return (
    <div className="space-y-4">
      <PaginatedStockTable
        movements={movements.content}
        itemsPerPage={pageSize}
        currentPage={currentPage}
        totalPages={movements.totalPages}
        totalElements={movements.totalElements}
      />
    </div>
  );
};

export default StockMovementDashboard;
