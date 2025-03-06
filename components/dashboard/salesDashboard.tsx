import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line, Area } from 'recharts';
import { 
  TrendingUp, 
  CreditCard, 
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShoppingBag,
  CheckCircle,
  ClipboardCheck,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircleIcon,
  FileText,
  LineChart
} from 'lucide-react';


const SalesDashboard = ({ salesData }: { salesData: any }) => {
    // Enhanced color palette with financial meaning
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];
    
    // Format currency values consistently
    const formatCurrency = (value: number | undefined | null): string => {
      if (value === undefined || value === null) return '0 TSH';
      return `${value.toLocaleString()} TSH`;
    };

    
  
    const formatPercentage = (value: number | undefined | null): string => {
      if (value === undefined || value === null) return '0%';
      return `${value.toFixed(2)}%`;
    };
  

    // Secondary financial metrics
    const secondaryMetrics = [
      {
        name: 'Orders',
        value: salesData.totalOrders,
        description: `${salesData.numberOfSoldItems} items sold`,
        icon: <ShoppingBag className="w-5 h-5 text-indigo-500" />,
        color: 'bg-indigo-50'
      },
      {
        name: 'Average sale',
        value: formatCurrency(salesData.averageSale),
        description: 'Average sale on order',
        icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
        color: 'bg-purple-50'
      },
      {
        name: 'Order Status',
        value: `${salesData.completedOrders}/${salesData.totalOrders}`,
        description: `${salesData.completedOrders} completed, ${salesData.pendingOrders} pending, ${salesData.canceledOrders} canceled`,
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        color: 'bg-emerald-50'
      }
    ];
  
    // Payment Method Data
    const paymentMethodData = salesData.paymentMethodTotals.map((method: { paymentMethodName: any; amount: any; }) => ({
      name: method.paymentMethodName,
      value: method.amount
    }));
  
    // Sales Status Data - including zero values for completeness
    const salesStatusData = [
      { 
        name: 'Completed', 
        value: salesData.completedOrders, 
        color: '#10B981' 
      },
      { 
        name: 'Pending', 
        value: salesData.pendingOrders, 
        color: '#F59E0B' 
      },
      { 
        name: 'Refunded', 
        value: salesData.totalRefunds, 
        color: '#1E2A37' 
      },
      {
        name: 'Canceled', 
        value: salesData.canceledOrders, 
        color: '#EF4444' 
      }
    ];
  
    // Detailed Closing Balance Calculation
    const closingBalanceItems = [
      { 
        label: 'Gross Sales', 
        value: salesData.grossSales,
        type: 'header'
      },
      
      { 
        label: 'Items Removed/Voided', 
        value: -salesData.totalRemovedOrderItemsAmount,
        type: 'deduction',
        subText: `${salesData.totalRemovedOrderItems} items removed`
      },
      { 
        label: 'Discounts', 
        value: -salesData.discounts,
        type: 'deduction'
      },
      { 
        label: 'Refunds', 
        value: -salesData.totalRefundsAmount,
        type: 'deduction',
        subText: `${salesData.totalRefunds} orders refunded`
      },
      
      { 
        label: 'Closing Balance', 
        value: salesData.closingBalance,
        type: 'total'
      },
      { 
        label: 'Cost of Goods Sold', 
        value: -salesData.cost,
        type: 'deduction'
      },
      { 
        label: 'Expenses', 
        value: -salesData.expense,
        type: 'deduction'
      },
      { 
        label: (salesData?.grossProfit ?? 0) >= 0 ? 'Gross Profit' : 'Gross Loss', 
        value: salesData.grossProfit,
        type: 'total'
      },
      { 
        label: (salesData?.margins ?? 0) >= 0 ? 'Profit Margin' : 'Loss Margin', 
        value: salesData.margins,
        type: 'percent'
      }
      
    ];
  
    return (
      <div className="p-4 bg-gray-50 space-y-6">
        {/* Date Range Display */}
        
  
        {/* NEW: Detailed Closing Balance Card */}
        <Card className="bg-white shadow-md border border-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-800 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-emerald-500" />
          Detailed Summary
        </CardTitle>
        <CardDescription>Complete breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-4">
          <table className="w-full text-sm">
            <tbody>
              {closingBalanceItems.map((item, index) => (
                <React.Fragment key={index}>
                  <tr className={`
                    ${item.type === 'header' ? 'font-semibold text-gray-800' : ''}
                    ${item.type === 'subtotal' ? 'border-t border-gray-300 font-semibold text-blue-700' : ''}
                    ${item.type === 'total' ? 'border-t-2 border-gray-400 font-bold text-emerald-700 text-lg' : ''}
                    ${item.type === 'deduction' ? 'text-gray-600' : ''}
                  `}>
                    <td className="py-2">{item.label}</td>
                    <td className={`py-2 text-right ${item.value < 0 ? 'text-red-600' : ''}`}>
                      {item.type === 'percent' 
                        ? formatPercentage(item.value)
                        : formatCurrency(Math.abs(item.value))}
                      {item.value < 0 && item.type !== 'total' && item.type !== 'percent' && ''}
                    </td>
                  </tr>
                  {item.subText && (
                    <tr>
                      <td colSpan={2} className="text-xs text-gray-500 pb-2 pt-0 ">
                        {item.subText}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  
    
        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {secondaryMetrics.map((metric, index) => (
            <Card key={index} className={`hover:shadow-md transition-shadow`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                    <h3 className="text-2xl font-bold">{metric.value}</h3>
                    <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                  </div>
                  <div className={`${metric.color} p-3 rounded-full`}>
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
  
        {/* Rest of the dashboard remains unchanged */}
        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-800 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                Payment Methods
              </CardTitle>
              <CardDescription>Total amounts by payment type</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {paymentMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentMethodData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => [`${value.toLocaleString()} TSH`, 'Amount']} 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend 
                      formatter={(value, entry) => {
                        return (
                          <span className="text-gray-700">{`${value}: ${entry.payload?.value.toLocaleString()} TSH`}</span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <PieChartIcon className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No payments recorded yet</p>
                  <p className="text-gray-400 text-sm mt-1">Charts will appear when payments are processed</p>
                </div>
              )}
            </CardContent>
          </Card>
  
          {/* Sales Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-800 flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2 text-green-500" />
                Order Status
              </CardTitle>
              <CardDescription>Breakdown of order completion status</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {salesStatusData.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip 
                      formatter={(value) => [`${value} orders`, 'Count']}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="value" fill="#8884d8">
                      {salesStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <BarChartIcon className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No orders recorded yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Order statistics will be displayed here once orders are processed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
  
        {/* Hourly Sales Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-gray-800 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Hourly Sales Trend
              </CardTitle>
              {salesData.periodicSales.periodicSalesValues.length > 0 && (
                <div className="text-sm font-medium text-gray-500">
                  Total: {formatCurrency(salesData.totalPaidAmount)}
                </div>
              )}
            </div>
            <CardDescription>Sales performance across the day</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {salesData.periodicSales.periodicSalesValues.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart 
                  data={salesData.periodicSales.periodicSalesValues
                    .map((period: { time: string | number | Date; totalPaidAmount: number; }) => ({
                      time: new Date(period.time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }),
                      sales: period.totalPaidAmount
                    }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: '#6B7280' }}
                    tickLine={{ stroke: '#6B7280' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280' }}
                    tickLine={{ stroke: '#6B7280' }}
                    tickFormatter={(value) => value === 0 ? '0' : `${(value / 1000).toFixed(0)}K`}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`${value.toLocaleString()} TSH`, 'Sales']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={true}
                    activeDot={{ 
                      r: 8,
                      strokeWidth: 2,
                      stroke: '#fff'
                    }}
                    animationDuration={2000}
                    animationEasing="ease-in-out"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <LineChart className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No hourly sales data available</p>
                <p className="text-gray-400 text-sm mt-1">
                  Sales trend will appear as transactions occur
                </p>
              </div>
            )}
          </CardContent>
        </Card>
  
        {/* Payment Status Summary */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Status Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Paid Orders</p>
                <p className="text-lg font-semibold text-green-700">{salesData.paymentStatusSummary.paidOrders}</p>
              </div>
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Partially Paid</p>
                <p className="text-lg font-semibold text-yellow-700">{salesData.paymentStatusSummary.partiallyPaidOrders}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Unpaid Orders</p>
                <p className="text-lg font-semibold text-gray-700">{salesData.paymentStatusSummary.unpaidOrders}</p>
              </div>
              <XCircle className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default SalesDashboard;