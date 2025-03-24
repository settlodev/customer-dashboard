import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, TrendingDown, DollarSign, RefreshCcw, ShoppingCart, TrendingUp, BarChart } from 'lucide-react';

const SalesDashboard = ({ salesData }: { salesData: any }) => {
  // Format currency with TZS
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0 TZS';
    return `${value.toLocaleString()} TZS`;
  };

  // Calculate percentages for visual indicators
  const paidPercentage = salesData.netSales > 0 ? (salesData.paidAmount / salesData.netSales) * 100 : 0;
  const unpaidPercentage = salesData.netSales > 0 ? (salesData.unpaidAmount / salesData.netSales) * 100 : 0;
  const profitMargin = salesData.netSales > 0 ? (salesData.netProfit / salesData.netSales) * 100 : 0;

  return (
    <div className="p-6 bg-gray-50 space-y-8">
      {/* Main Financial Overview Section */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-2 border-b border-blue-50">
          <CardTitle className="text-xl text-blue-800">Financial Overview</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-6">

            {/* Payment Status Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-purple-700 flex items-center">
                <BarChart className="w-5 h-5 mr-2" /> Payment Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                          <span className="text-xs font-medium text-green-700">{paidPercentage.toFixed(1)}%</span>
                        </div>
                        <h3 className="text-xl font-bold text-green-700">{formatCurrency(salesData.paidAmount)}</h3>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${paidPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium text-gray-600">Unpaid Amount</p>
                          <span className="text-xs font-medium text-amber-700">{unpaidPercentage.toFixed(1)}%</span>
                        </div>
                        <h3 className="text-2xl font-bold text-amber-700">{formatCurrency(salesData.unpaidAmount)}</h3>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-amber-600 h-2 rounded-full"
                            style={{ width: `${unpaidPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Revenue Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-blue-700 flex items-center">
                <BarChart className="w-5 h-5 mr-2" /> Revenue Stream
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Gross Sales</p>
                        <h3 className="text-xl font-bold text-blue-700">{formatCurrency(salesData.grossSales)}</h3>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full shadow-sm">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Refunds</p>
                        <h3 className="text-xl font-bold text-orange-700">{formatCurrency(salesData.refundsAmount)}</h3>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-full shadow-sm">
                        <RefreshCcw className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Discounts</p>
                        <h3 className="text-xl font-bold text-orange-700">{formatCurrency(salesData.discountsAmount)}</h3>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-full shadow-sm">
                        <RefreshCcw className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Net Sales</p>
                        <h3 className="text-xl font-bold text-emerald-700">{formatCurrency(salesData.netSales)}</h3>
                      </div>
                      <div className="bg-emerald-100 p-3 rounded-full shadow-sm">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Profit Analysis Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-indigo-700 flex items-center">
                <BarChart className="w-5 h-5 mr-2" /> Profit Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Costs (COGS)</p>
                        <h3 className="text-2xl font-bold text-red-700">{formatCurrency(salesData.costsAmount)}</h3>
                      </div>
                      <div className="bg-red-100 p-3 rounded-full shadow-sm">
                        <ShoppingCart className="w-5 h-5 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                        <h3 className="text-2xl font-bold text-blue-700">{formatCurrency(salesData.grossProfit)}</h3>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full shadow-sm">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                        <h3 className="text-2xl font-bold text-purple-700">{formatCurrency(salesData.expensesAmount)}</h3>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full shadow-sm">
                        <ShoppingCart className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom Line Section */}
            <div className="mt-4">
              <Card className={`bg-gradient-to-br ${salesData.netProfit >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'}`}>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-lg font-medium text-gray-700">{salesData.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
                        <span className={`text-sm font-medium ${salesData.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {profitMargin.toFixed(1)}% margin
                        </span>
                      </div>
                      <h3 className={`text-3xl font-bold ${salesData.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(salesData.netProfit)}
                      </h3>
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                        <div
                          className={`${salesData.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'} h-3 rounded-full`}
                          style={{ width: `${Math.min(Math.abs(profitMargin), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className={`${salesData.netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'} p-4 rounded-full shadow-sm ml-4`}>
                      {salesData.netProfit >= 0 ?
                        <ArrowUpCircle className="w-6 h-6 text-emerald-600" /> :
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesDashboard;