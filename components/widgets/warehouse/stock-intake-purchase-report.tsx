import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, Clock, XCircle,  RefreshCw, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { stockIntakePurchaseReportForWarehouse } from '@/lib/actions/warehouse/purchases-action';
import { StockIntakePurchasesReport } from '@/types/warehouse/purchase/type';



const StockIntakePurchaseReport = () => {
  const [reportData, setReportData] = useState<StockIntakePurchasesReport | null>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stockIntakePurchaseReportForWarehouse();
      setReportData(data);
    } catch (err) {
      
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleRefresh = () => {
    fetchReport();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const calculatePercentage = (value: number | undefined, total: number) => {
    if (!total || value === undefined) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-xl shadow-sm">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-slate-600 font-medium">Loading report...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Unable to Load Report</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium shadow-sm hover:shadow"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalPurchases = reportData?.totalStockIntakePurchases || 0;
  const paidPercentage = calculatePercentage(reportData?.paidStockIntakePurchases, totalPurchases);
  const unpaidPercentage = calculatePercentage(reportData?.unpaidStockIntakePurchases, totalPurchases);
  const partialPercentage = calculatePercentage(reportData?.partiallyPaidStockIntakePurchases, totalPurchases);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-slate-600">Comprehensive overview of stock purchase activities and payment status</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 border border-slate-200 shadow-sm hover:shadow"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Total Purchases */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">TOTAL PURCHASES</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-800">{formatNumber(totalPurchases)}</p>
              <p className="text-sm text-slate-500">Stock intake requests</p>
            </div>
          </div>

          {/* Paid Purchases */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">FULLY PAID</p>
                <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  {paidPercentage}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-emerald-600">{formatNumber(reportData?.paidStockIntakePurchases ?? 0)}</p>
              <p className="text-sm text-slate-500">Completed payments</p>
            </div>
          </div>

          {/* Partial Payments */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">PARTIALLY PAID</p>
                <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  {partialPercentage}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-amber-600">{formatNumber(reportData?.partiallyPaidStockIntakePurchases ?? 0)}</p>
              <p className="text-sm text-slate-500">Pending completion</p>
            </div>
          </div>

          {/* Unpaid Purchases */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">UNPAID</p>
                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  {unpaidPercentage}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-red-600">{formatNumber(reportData?.unpaidStockIntakePurchases ?? 0)}</p>
              <p className="text-sm text-slate-500">Requires attention</p>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Cost */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">TOTAL VALUE</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(reportData?.totalPurchaseCost ?? 0)}</p>
              <p className="text-sm text-slate-500">Total purchase cost</p>
            </div>
          </div>

          {/* Paid Amount */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">COLLECTED</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(reportData?.paidStockIntakePurchasesAmount ?? 0)}</p>
              <p className="text-sm text-slate-500">Amount received</p>
            </div>
          </div>

          {/* Outstanding Amount */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">OUTSTANDING</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-red-600">{formatCurrency(reportData?.unpaidStockIntakePurchasesAmount ?? 0)}</p>
              <p className="text-sm text-slate-500">Amount pending</p>
            </div>
          </div>
        </div>

        {/* Payment Status Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment Status Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Payment Progress</span>
              <span className="font-medium text-slate-800">{paidPercentage + partialPercentage}% Complete</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full flex">
                <div 
                  className="bg-emerald-500 h-full"
                  style={{ width: `${paidPercentage}%` }}
                ></div>
                <div 
                  className="bg-amber-400 h-full"
                  style={{ width: `${partialPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Fully Paid: {paidPercentage}%</span>
              <span>Partially Paid: {partialPercentage}%</span>
              <span>Unpaid: {unpaidPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default StockIntakePurchaseReport;