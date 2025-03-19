'use client';

import { useMemo } from 'react';
import { Activity, ArrowDownCircle, ArrowUpCircle, BarChart, Clock, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { StockMovement, stockVariantSummary } from '@/types/stockVariant/type';
import PaginatedStockTable from './paginatedStock';
import MetricCard from './stock-item/metric-card';


const StockMovementDashboard = ({ movements, summary }: { movements: StockMovement[]; summary: stockVariantSummary }) => {
  // Sort movements by date (newest first)
  const sortedMovements = useMemo(() => [...movements].sort((a, b) =>
    new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  ), [movements]);

  const latestMovement = sortedMovements[0];
  
  // Calculate total stock intake and sales
  const totalStockIntake = movements
    .filter(movement => movement.stockMovementType === 'STOCK_INTAKE')
    .reduce((sum, movement) => sum + movement.quantity, 0);

  const totalStockSold = movements
    .filter(movement => movement.stockMovementType === 'ORDER_ITEM_SALE')
    .reduce((sum, movement) => sum + movement.quantity, 0);

  // Format currency values
  const formatCurrency = (value: number) => `${Intl.NumberFormat().format(value)}/=`;

  // Create an array of metric data
  const metricCards = [
    {
      title: "Current Stock Quantity",
      value: summary.currentTotalQuantity || 0,
      icon: <Activity className="h-6 w-6" />,
      colorTheme: "blue" as const
    },
    {
      title: "Total Current Value",
      value: summary.currentTotalValue || 0,
      icon: <DollarSign className="h-6 w-6" />,
      colorTheme: "green" as const,
      formatter: formatCurrency
    },
    {
      title: "Current Cost Per Item",
      value: summary.currentCostPerItem || 0,
      icon: <DollarSign className="h-6 w-6" />,
      colorTheme: "emerald" as const,
      formatter: formatCurrency
    },
    {
      title: "Current Average Value",
      value: summary.currentAverageValue,
      icon: <BarChart className="h-6 w-6" />,
      colorTheme: "purple" as const,
      formatter: formatCurrency
    },
    {
      title: "Last Movement",
      value: latestMovement?.stockMovementType === 'STOCK_INTAKE' ? 'IN' : 'OUT',
      icon: latestMovement?.stockMovementType === 'STOCK_INTAKE' 
        ? <TrendingUp className="h-6 w-6" /> 
        : <TrendingDown className="h-6 w-6" />,
      colorTheme: latestMovement?.stockMovementType === 'STOCK_INTAKE' ? 'green' : 'red',
      subtitle: latestMovement ? new Date(latestMovement.dateCreated).toLocaleString() : ''
    },
    {
      title: "Total Stock Intake",
      value: totalStockIntake,
      icon: <ArrowDownCircle className="h-6 w-6" />,
      colorTheme: "blue" as const
    },
    {
      title: "Total Stock Sold",
      value: totalStockSold,
      icon: <ArrowUpCircle className="h-6 w-6" />,
      colorTheme: "red" as const
    },
    {
      title: "Total Estimated Profit",
      value: "--", // You can implement the calculation function here
      icon: <Clock className="h-6 w-6" />,
      colorTheme: "orange" as const
    }
  ];

  return (
    <div className="space-y-4">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <MetricCard
            key={`metric-card-${index}`}
            title={card.title}
            value={card.value}
            icon={card.icon}
            colorTheme={card.colorTheme as "blue" | "green" | "purple" | "red" | "orange" | "emerald" | "gray"}
            subtitle={card.subtitle}
            formatter={card.formatter}
          />
        ))}
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