'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Activity, ArrowDownCircle, ArrowUpCircle, BarChart, Clock, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { StockMovement } from '@/types/stockVariant/type';
import PaginatedStockTable from './paginatedStock';
import { useMemo } from 'react';

// Enhanced color palette
const CARD_COLORS = {
  stockLevel: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
  totalValue: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
  costPerItem: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200',
  turnover: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
  lastMovement: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200',
  stockIntake: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
  stockSold: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
  avgTime: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
};

const ICON_COLORS = {
  blue: 'text-blue-500 bg-blue-100 p-2 rounded-full',
  green: 'text-green-500 bg-green-100 p-2 rounded-full',
  emerald: 'text-emerald-500 bg-emerald-100 p-2 rounded-full',
  purple: 'text-purple-500 bg-purple-100 p-2 rounded-full',
  orange: 'text-orange-500 bg-orange-100 p-2 rounded-full',
  red: 'text-red-500 bg-red-100 p-2 rounded-full',
  gray: 'text-gray-500 bg-gray-100 p-2 rounded-full'
};

const StockMovementDashboard = ({ movements }: { movements: StockMovement[] }) => {
  // Sort movements by date (newest first)
  const sortedMovements = useMemo(() => [...movements].sort((a, b) =>
    new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  ), [movements]);

  const latestMovement = sortedMovements[0];
 
  const totalValue = latestMovement?.newTotalQuantity * latestMovement?.newAverageValue;

  // Calculate total stock intake and sales
  const totalStockIntake = movements
    .filter(movement => movement.stockMovementType === 'STOCK_INTAKE')
    .reduce((sum, movement) => sum + movement.quantity, 0);

  const totalStockSold = movements
    .filter(movement => movement.stockMovementType === 'ORDER_ITEM_SALE')
    .reduce((sum, movement) => sum + movement.quantity, 0);

  // Calculate net stock change
  const netStockChange = totalStockIntake - totalStockSold;

  // Calculate inventory turnover ratio (if we have enough data)
  const inventoryTurnoverRatio = totalStockSold > 0 ? totalStockSold / ((totalStockIntake + netStockChange) / 2) : 0;

  // Calculate average time between transactions
  const calculateAverageTimeBetweenTransactions = () => {
    if (movements.length < 2) return "N/A";
    
    const dates = movements.map(m => new Date(m.dateCreated).getTime()).sort();
    let totalTimeDiff = 0;
    
    for (let i = 1; i < dates.length; i++) {
      totalTimeDiff += dates[i] - dates[i-1];
    }
    
    const avgTimeMs = totalTimeDiff / (dates.length - 1);
    const avgTimeMin = Math.round(avgTimeMs / (1000 * 60));
    
    return avgTimeMin < 60 
      ? `${avgTimeMin} min${avgTimeMin !== 1 ? 's' : ''}` 
      : `${Math.round(avgTimeMin / 60)} hour${Math.round(avgTimeMin / 60) !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-4">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Stock Level */}
        <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS.stockLevel} border-l-4 border-l-blue-400`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Current Stock Level</p>
                <h3 className="text-2xl font-bold text-blue-700">{latestMovement?.newTotalQuantity || 0}</h3>
              </div>
              <div className={ICON_COLORS.blue}>
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Stock Value */}
        <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS.totalValue} border-l-4 border-l-green-400`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Current Value</p>
                <h3 className="text-2xl font-bold text-green-700">{Intl.NumberFormat().format(totalValue || 0)}/=</h3>
              </div>
              <div className={ICON_COLORS.green}>
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* cost per item */}
        <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS.costPerItem} border-l-4 border-l-emerald-400`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Cost per Item</p>
                <h3 className="text-2xl font-bold text-emerald-700">{Intl.NumberFormat().format(latestMovement?.newAverageValue || 0)}/=</h3>
              </div>
              <div className={ICON_COLORS.emerald}>
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Turnover */}
        <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS.turnover} border-l-4 border-l-purple-400`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Inventory Turnover</p>
                <h3 className="text-2xl font-bold text-purple-700">{inventoryTurnoverRatio.toFixed(2)}</h3>
              </div>
              <div className={ICON_COLORS.purple}>
                <BarChart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Movement */}
        <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS.lastMovement} border-l-4 border-l-${latestMovement?.stockMovementType === 'STOCK_INTAKE' ? 'green' : 'red'}-400`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Last Movement</p>
                <h3 className={`text-md font-bold text-${latestMovement?.stockMovementType === 'STOCK_INTAKE' ? 'green' : 'red'}-700`}>
                  {latestMovement?.stockMovementType === 'STOCK_INTAKE' ? 'IN' : 'OUT'}
                </h3>
                <p className="text-xs text-gray-500">{new Date(latestMovement?.dateCreated).toLocaleString()}</p>
              </div>
              <div className={`${latestMovement?.stockMovementType === 'STOCK_INTAKE' ? ICON_COLORS.green : ICON_COLORS.red}`}>
                {latestMovement?.stockMovementType === 'STOCK_INTAKE' ?
                  <TrendingUp className="h-6 w-6" /> :
                  <TrendingDown className="h-6 w-6" />
                }
              </div>
            </div>
          </CardContent>
        </Card>
      
        {/* Total Stock Intake */}
        <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS.stockIntake} border-l-4 border-l-blue-400`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Stock Intake</p>
                <h3 className="text-2xl font-bold text-blue-700">{totalStockIntake}</h3>
              </div>
              <div className={ICON_COLORS.blue}>
                <ArrowDownCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Stock Sold */}
        <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS.stockSold} border-l-4 border-l-red-400`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Stock Sold</p>
                <h3 className="text-2xl font-bold text-red-700">{totalStockSold}</h3>
              </div>
              <div className={ICON_COLORS.red}>
                <ArrowUpCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Time Between Transactions */}
        <Card className={`shadow-sm hover:shadow-md transition-shadow ${CARD_COLORS.avgTime} border-l-4 border-l-orange-400`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg. Time Between Movements</p>
                <h3 className="text-xl font-bold text-orange-700">{calculateAverageTimeBetweenTransactions()}</h3>
              </div>
              <div className={ICON_COLORS.orange}>
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paginated Stock Table */}
      {typeof PaginatedStockTable !== 'undefined' && (
        <PaginatedStockTable
          movements={movements}
          itemsPerPage={10}
        />
      )}
    </div>
  );
};

export default StockMovementDashboard;