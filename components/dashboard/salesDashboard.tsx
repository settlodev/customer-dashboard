import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line, Area } from 'recharts';
import { 
  TrendingUp, 
  CreditCard, 
  PieChart as PieChartIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircleIcon,
  LineChart,
  DollarSign,
  ShoppingCart,
  ArrowUpCircle,
  RefreshCcw,
  TrendingDown
} from 'lucide-react';

const SalesDashboard = ({ salesData }: { salesData: any }) => {
 
  // Enhanced color palette with financial meaning
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];
  
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0 TZS';
    return `${value.toLocaleString()} TZS`;
  };

  // Performance Metrics with enhanced styling and semantic colors
  const performanceMetrics = [
    {
      name: 'Closing Balance',
      value: formatCurrency(salesData.closingBalance),
      icon: <DollarSign className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-100',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100'
    },
    // {
    //   name: 'Net Sales',
    //   value: formatCurrency(salesData.netSales),
    //   icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
    //   color: 'bg-emerald-50',
    //   textColor: 'text-emerald-700',
    //   borderColor: 'border-emerald-100',
    //   bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100'
    // },
    {
      name: 'Total Collection',
      value: formatCurrency(salesData.totalCollections),
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
      color: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-100',
      bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100'
    },
    
    {
      name: 'Total Discount',
      value: formatCurrency(salesData.discountsAmount),
      icon: <TrendingDown className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-100',
      bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100'
    },
    {
      name: 'Total Refunds',
      value: formatCurrency(salesData.totalRefundsAmount),
      icon: <RefreshCcw className="w-5 h-5 text-orange-600" />,
      color: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-100',
      bgGradient: 'bg-gradient-to-br from-orange-50 to-orange-100'
    },
    {
      name: 'Total Expenses',
      value: formatCurrency(salesData.expense),
      icon: <ShoppingCart className="w-5 h-5 text-red-600" />,
      color: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-100',
      bgGradient: 'bg-gradient-to-br from-red-50 to-red-100'
    },
    {
      name: 'Cost of Goods Sold',
      value: formatCurrency(salesData.costAmount),
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-100',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100'
    },
    // {
    //   name: (salesData?.grossProfit ?? 0) >= 0 ? 'Gross Profit' : 'Gross Loss',
    //   value: formatCurrency(salesData.grossProfit),
    //   icon:(salesData?.grossProfit ?? 0) >= 0 ? <ArrowUpCircle className="w-5 h-5 text-emerald-600" />: <TrendingDown className="w-5 h-5 text-red-600" />,
    //   color: (salesData?.grossProfit ?? 0) >= 0 ? 'bg-emerald-50': 'bg-red-50',
    //   textColor: (salesData?.grossProfit ?? 0) >= 0 ? 'text-emerald-700': 'text-red-700',
    //   borderColor:(salesData?.grossProfit ?? 0) >= 0 ? 'border-emerald-100': 'border-red-100',
    //   bgGradient: (salesData?.grossProfit ?? 0) >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : 'bg-gradient-to-br from-red-50 to-red-100',
    //   positive: (salesData?.grossProfit ?? 0) >= 0 ? true: false
    // }
  ];

  // Secondary financial metrics with enhanced styling
  const secondaryMetrics = [
    {
      name: 'Total Order',
      value: `${salesData.completedOrders}`,
      description: `${salesData.completedOrders} completed, ${salesData.pendingOrders} pending, ${salesData.canceledOrders} canceled, ${salesData.totalRefunds} refunded`,
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      color: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-100',
      bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100'
    },
    {
      name: 'Total Unpaid',
      value: formatCurrency(salesData.totalUnpaidAmount),
      description: 'Total amount of unpaid orders',
      icon: <DollarSign className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-100',
      bgGradient: 'bg-gradient-to-br from-amber-50 to-amber-100'
    },
    {
      name: (salesData?.grossProfit ?? 0) >= 0 ? 'Gross Profit' : 'Gross Loss',
      value: formatCurrency(salesData.grossProfit),
      icon:(salesData?.grossProfit ?? 0) >= 0 ? <ArrowUpCircle className="w-5 h-5 text-emerald-600" />: <TrendingDown className="w-5 h-5 text-red-600" />,
      color: (salesData?.grossProfit ?? 0) >= 0 ? 'bg-emerald-50': 'bg-red-50',
      textColor: (salesData?.grossProfit ?? 0) >= 0 ? 'text-emerald-700': 'text-red-700',
      borderColor:(salesData?.grossProfit ?? 0) >= 0 ? 'border-emerald-100': 'border-red-100',
      bgGradient: (salesData?.grossProfit ?? 0) >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : 'bg-gradient-to-br from-red-50 to-red-100',
      positive: (salesData?.grossProfit ?? 0) >= 0 ? true: false,
      description:'Gross sales - cost of goods sold (COGS).'
    },
    // {
    //   name: (salesData?.netProfit ?? 0) >= 0 ? 'Net Profit' : 'Net Loss',
    //   value: formatCurrency(salesData.netProfit),
    //   icon:(salesData?.netProfit ?? 0) >= 0 ? <ArrowUpCircle className="w-5 h-5 text-emerald-600" />: <TrendingDown className="w-5 h-5 text-red-600" />,
    //   color: (salesData?.netProfit ?? 0) >= 0 ? 'bg-emerald-50': 'bg-red-50',
    //   textColor: (salesData?.netProfit ?? 0) >= 0 ? 'text-emerald-700': 'text-red-700',
    //   borderColor:(salesData?.netProfit ?? 0) >= 0 ? 'border-emerald-100': 'border-red-100',
    //   bgGradient: (salesData?.netProfit ?? 0) >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : 'bg-gradient-to-br from-red-50 to-red-100',
    //   positive: (salesData?.netProfit ?? 0) >= 0 ? true: false,
    //   description:'Gross profit - expenses, taxes, and other costs.'
    // }    
  ];

  // Payment Method Data
  const paymentMethodData = salesData.paymentMethodTotals.map((method: { paymentMethodName: any; amount: any; }) => ({
    name: method.paymentMethodName,
    value: method.amount
  }));

  return (
    <div className="p-4 w-full bg-gray-50 space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card 
            key={index} 
            className={`hover:shadow-md transition-shadow border ${metric.borderColor} ${metric.bgGradient}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                  <h3 className={`text-2xl font-bold ${metric.textColor}`}>{metric.value}</h3>
                  
                </div>
                <div className={`${metric.color} p-3 rounded-full shadow-sm`}>
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {secondaryMetrics.map((metric, index) => (
          <Card 
            key={index} 
            className={`hover:shadow-md transition-shadow border ${metric.borderColor} ${metric.bgGradient}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                  <h3 className={`text-2xl font-bold ${metric.textColor}`}>{metric.value}</h3>
                  <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
                  {metric.positive && <p className="text-xs text-emerald-600 mt-1 font-medium">↑ Positive trend</p>}
                </div>
                <div className={`${metric.color} p-3 rounded-full shadow-sm`}>
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card className="bg-gradient-to-br from-white to-blue-50">
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
        <Card className="bg-gradient-to-br from-white to-indigo-50">
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
      </div>

      {/* Payment Status Summary */}
      <div className="bg-gradient-to-r from-white to-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Status Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg flex items-center justify-between border border-green-100">
            <div>
              <p className="text-xs text-gray-600">Paid Orders</p>
              <p className="text-lg font-semibold text-green-700">{salesData.paymentStatusSummary.paidOrders}</p>
            </div>
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg flex items-center justify-between border border-yellow-100">
            <div>
              <p className="text-xs text-gray-600">Partially Paid</p>
              <p className="text-lg font-semibold text-yellow-700">{salesData.paymentStatusSummary.partiallyPaidOrders}</p>
            </div>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg flex items-center justify-between border border-gray-200">
            <div>
              <p className="text-xs text-gray-600">Unpaid Orders</p>
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