'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package2, TrendingDown, TrendingUp } from 'lucide-react';
import { StockMovement } from '@/types/stockVariant/type';
import PaginatedStockTable from './paginatedStock';



const StockMovementDashboard = ({ movements }: { movements: StockMovement[] }) => {

  console.log("movements", movements)
  // Sort movements by date (newest first)
  const sortedMovements = [...movements].sort((a, b) => 
    new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  );

  
  const latestMovement = sortedMovements[0];
  const totalValue = latestMovement?.newTotalQuantity * latestMovement?.newAverageValue;
  

  const chartData = movements.map(movement => ({
    id: movement.stockName,
    quantity: movement.newTotalQuantity,
    averageValue: movement.newAverageValue,
    type: movement.stockMovementType
  }));



  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Stock Level</p>
                <h3 className="text-2xl font-bold">{latestMovement?.newTotalQuantity || 0}</h3>
              </div>
              <Package2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <h3 className="text-2xl font-bold">{Intl.NumberFormat().format(totalValue) || 0}/=</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Last Movement</p>
                <h3 className="text-2xl font-bold">{latestMovement?.stockMovementType === 'STOCK_INTAKE' ? 'IN' : 'OUT'}</h3>
              </div>
              {latestMovement?.stockMovementType === 'STOCK_INTAKE' ?
                <TrendingUp className="h-8 w-8 text-green-500" /> :
                <TrendingDown className="h-8 w-8 text-red-500" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Stock Level Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" hide />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value} units`, 'Quantity']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="quantity"
                  stroke="#2563eb"
                  name="Stock Level"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Value Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" hide />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}`, 'Average Value']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="averageValue"
                  stroke="#16a34a"
                  name="Average Value"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <PaginatedStockTable 
  movements={movements}
  itemsPerPage={10} // Optional, defaults to 10
/>
    </div>
  );
};

export default StockMovementDashboard;