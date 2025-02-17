import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  ArrowUp,
  Trash,
  Redo,
  Pen,
  BadgePlus,
  PencilLine,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { StockMovement } from '@/types/stockVariant/type';
import { useRouter } from 'next/navigation';



const PaginatedStockTable = ({ movements, itemsPerPage = 10 }: { movements: StockMovement[]; itemsPerPage?: number }) => {
  console.log("movement",movements)
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  
  // Sort movements by date in descending order (newest first)
  const sortedMovements = useMemo(() => {
    return [...movements].sort((a, b) => 
      new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );
  }, [movements]);

  // Calculate pagination values
  const totalPages = Math.ceil(sortedMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedMovements.slice(startIndex, endIndex);

  // Navigation functions
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getMovementLabel = (type: string) => {
    const labels = {
      'STOCK_INTAKE': 'Stock Intake',
      'ORDER_ITEM_SALE': 'Sale of Item',
      'ORDER_ITEM_DELETE': 'Deleted Order Item',
      'ORDER_ITEM_REFUND': 'Refund of Order Item',
      'ORDER_ITEM_AMOUNT_CHANGE': 'Amount Change',
      'ADDON_SALE': 'Addon Sale',
      'STOCK_MODIFICATION': 'Modified Stock',
      'TRANSFER_OUT': 'Transfer Out',
      'TRANSFER_IN': 'Transfer In'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleRedirect = (movement: StockMovement) => {
    console.log('Redirecting to:', movement.stockMovementType);
    switch (movement.stockMovementType) {
      case 'STOCK_INTAKE':
        if (movement.stockIntake) {
          router.push(`/stock-intakes/intake-detail/${movement.stockIntake}?stockVariant=${movement.stockVariant}`);
        }
        break;
      case 'ORDER_ITEM_SALE':
        if (movement.order) {
          router.push(`/orders/${movement.order}`);
        }
        break;
      case 'ORDER_ITEM_DELETE':
      case 'ORDER_ITEM_REFUND':
        if (movement.order) {
          router.push(`/refunds/${movement.order}`);
        }
        break;
      
      case 'STOCK_MODIFICATION':
        if (movement.stockModification) {
          router.push(`/stock-modification/${movement.stockModification}`);
        }
        break;
      default:
        console.log('No redirect configured for this movement type');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Movement History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">#</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Quantity</th>
                <th className="text-left p-2">Running Total</th>
                <th className="text-left p-2">Staff</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((movement, index) => (
                <tr key={movement.id} 
                className="border-b hover:bg-gray-50"
                onClick={() => handleRedirect(movement)}
                >
                  <td className="p-2">{startIndex + index + 1}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      movement.stockMovementType === 'STOCK_INTAKE'
                        ? 'bg-green-100 text-green-800'
                        : movement.stockMovementType === 'ORDER_ITEM_SALE'
                        ? 'bg-blue-100 text-blue-800'
                        : movement.stockMovementType === 'ORDER_ITEM_DELETE'
                        ? 'bg-gray-100 text-gray-800'
                        : movement.stockMovementType === 'ORDER_ITEM_REFUND'
                        ? 'bg-yellow-100 text-yellow-800'
                        : movement.stockMovementType === 'ORDER_ITEM_AMOUNT_CHANGE'
                        ? 'bg-purple-100 text-purple-800'
                        : movement.stockMovementType === 'ADDON_SALE'
                        ? 'bg-orange-100 text-orange-800'
                        : movement.stockMovementType === 'STOCK_MODIFICATION'
                        ? 'bg-pink-100 text-pink-800'
                        : movement.stockMovementType === 'TRANSFER_OUT'
                        ? 'bg-indigo-100 text-indigo-800'
                        : movement.stockMovementType === 'TRANSFER_IN'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getMovementLabel(movement.stockMovementType)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <p>
                      {movement.stockMovementType === 'ORDER_ITEM_SALE' 
                      ? <ArrowUp className="h-5 w-5 text-red-500" />
                      : movement.stockMovementType === 'STOCK_INTAKE'
                      ? <ArrowDown className="h-5 w-5 text-green-500" />
                      : movement.stockMovementType === 'ORDER_ITEM_DELETE'
                      ? <Trash className="h-5 w-5 text-red-500" />
                      : movement.stockMovementType === 'ORDER_ITEM_REFUND'
                      ? <Redo className="h-5 w-5 text-yellow-500" />
                      : movement.stockMovementType === 'ORDER_ITEM_AMOUNT_CHANGE'
                      ? <Pen className="h-5 w-5 text-purple-500" />
                      : movement.stockMovementType === 'ADDON_SALE'
                      ? <BadgePlus className="h-5 w-5 text-orange-500" />
                      : movement.stockMovementType === 'STOCK_MODIFICATION'
                      ? <PencilLine className="h-5 w-5 text-pink-800" />
                      : movement.stockMovementType === 'TRANSFER_OUT'
                      ? <TrendingDown className="h-5 w-5 text-indigo-500" />
                      : movement.stockMovementType === 'TRANSFER_IN'
                      ? <TrendingUp className="h-5 w-5 text-teal-500" />
                      : <span className="text-gray-500">-</span>}
                      </p>
                      {Intl.NumberFormat().format(movement.quantity)}
                    </div>
                  </td>
                  <td>{Intl.NumberFormat().format(movement.newTotalQuantity)}</td>
                  {/* <td className="p-2">{Intl.NumberFormat().format(movement.value)}/=</td> */}
                  <td className="p-2">{movement.staffName}</td>
                  <td className="p-2">
                    {Intl.DateTimeFormat(undefined, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    }).format(new Date(movement.dateCreated))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedMovements.length)} of {sortedMovements.length} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaginatedStockTable;