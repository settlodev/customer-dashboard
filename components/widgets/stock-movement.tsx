'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, BadgeCent, BadgePlus, Package2, Pen, PencilLine, Redo, Trash, TrendingDown, TrendingUp } from 'lucide-react';
import { StockMovement } from '@/types/stockVariant/type';



const StockMovementDashboard = ({ movements }: { movements: StockMovement[] }) => {

  // console.log("movements", movements)
  const latestMovement = movements[0];
  const totalValue = latestMovement?.newTotalQuantity * latestMovement?.newAverageValue;
  // console.log("latestMovement", latestMovement)

  const chartData = movements.map(movement => ({
    id: movement.stockName,
    quantity: movement.newTotalQuantity,
    averageValue: movement.newAverageValue,
    type: movement.stockMovementType
  }));

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'STOCK_INTAKE':
        return 'Intake';
      case 'ORDER_ITEM_SALE':
        return 'Sale';
      case 'ORDER_ITEM_DELETE':
        return 'Delete';
      case 'ORDER_ITEM_REFUND':
        return 'Refund';
      case 'ORDER_ITEM_AMOUNT_CHANGE':
        return 'Amount Change';
      case 'ADDON_SALE':
        return 'Addon Sale';
      case 'STOCK_MODIFICATION':
        return 'Modification';
      case 'TRANSFER_OUT':
        return 'Transfer Out';
      case 'TRANSFER_IN':
        return 'Transfer In';
      default:
        return 'Unknown';
    }
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Stock Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className='p-2'>#</th>
                  <th className="text-left p-2">Type</th>
                  <th>Prev Qty</th>
                  <th className="text-left p-2">New Qty</th>
                  <th className="text-left p-2">Value</th>
                  <th className="text-left p-2">Staff</th>
                  <th className='text-left p-2'>Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement, index) => (
                  <tr key={movement.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${movement.stockMovementType === 'STOCK_INTAKE'
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
                    <td>{Intl.NumberFormat().format(movement.previousTotalQuantity)}</td>
                    <td>{Intl.NumberFormat().format(movement.newTotalQuantity)}</td>
                    <td className="p-2">{Intl.NumberFormat().format(movement.value)}/=</td>
                    <td className="p-2">{movement.staffName}</td>
                    <td className="p-2">{Intl.DateTimeFormat(undefined, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    }).format(new Date(movement.dateCreated))}</td>
                    <td className="p-2">
                      {movement.stockMovementType === 'ORDER_ITEM_SALE' 
                      ? (<BadgeCent className="h-5 w-5 text-blue-500" />) 
                      : movement.stockMovementType === 'STOCK_INTAKE' 
                      ? (<ArrowUp className="h-5 w-5 text-green-500" />)
                      : movement.stockMovementType === 'ORDER_ITEM_DELETE' 
                      ? (<Trash className="h-5 w-5 text-gray-500" />)
                      : movement.stockMovementType === 'ORDER_ITEM_REFUND' 
                      ? (<Redo className="h-5 w-5 text-yellow-500" />)
                      : movement.stockMovementType === 'ORDER_ITEM_AMOUNT_CHANGE' 
                      ? (<Pen className="h-5 w-5 text-purple-500" />)
                      : movement.stockMovementType === 'ADDON_SALE' 
                      ? (<BadgePlus className="h-5 w-5 text-orange-500" />)
                      : movement.stockMovementType === 'STOCK_MODIFICATION' 
                      ? (<PencilLine className="h-5 w-5 text-teal-500" />)
                      : movement.stockMovementType === 'TRANSFER_OUT' 
                      ? (<TrendingDown className="h-5 w-5 text-indigo-500" />)
                      : movement.stockMovementType === 'TRANSFER_IN' 
                      ? (<TrendingUp className="h-5 w-5 text-teal-500" />)
                      : movement.stockMovementType === 'ORDER_ITEM_AMOUNT_CHANGE' 
                      ? (<Pen className="h-5 w-5 text-purple-500" />)
                      : (<span className="text-gray-500">-</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovementDashboard;