
import React, { useState, useEffect } from 'react';
import { XCircle, RefreshCw, Search} from 'lucide-react';
import { supplierCreditReportForWarehouse } from '@/lib/actions/warehouse/supplier-actions';
import { SupplierCreditReports } from '@/types/warehouse/supplier/type';



const SupplierCreditReport = () => {
  const [reportData, setReportData] = useState<SupplierCreditReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });


  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierCreditReportForWarehouse();
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

  // format currency
  const formatCurrency = (amount:number) => {
    return new Intl.NumberFormat().format(amount);
  };

  // Calculate payment metrics for a supplier
  const getSupplierMetrics = (supplier:any) => {
    const paymentRatio = supplier.totalPurchasedAmount > 0 
      ? (supplier.totalPaidAmount / supplier.totalPurchasedAmount) * 100 
      : 0;
    const averagePerPurchase = supplier.totalPurchasesPerformed > 0 
      ? supplier.totalPurchasedAmount / supplier.totalPurchasesPerformed 
      : 0;
    
    let riskLevel = 'low';
    if (paymentRatio < 30) riskLevel = 'high';
    else if (paymentRatio < 70) riskLevel = 'medium';
    
    return { paymentRatio, riskLevel, averagePerPurchase };
  };

  // Calculate overall summary
  const getOverallSummary = (suppliers:any) => {
    if (!suppliers || suppliers.length === 0) return null;
    
    const totals = suppliers.reduce((acc:any, supplier:any) => ({
      totalSuppliers: acc.totalSuppliers + 1,
      totalPurchases: acc.totalPurchases + supplier.totalPurchasesPerformed,
      totalPurchased: acc.totalPurchased + supplier.totalPurchasedAmount,
      totalPaid: acc.totalPaid + supplier.totalPaidAmount,
      totalUnpaid: acc.totalUnpaid + supplier.totalUnpaidAmount
    }), { totalSuppliers: 0, totalPurchases: 0, totalPurchased: 0, totalPaid: 0, totalUnpaid: 0 });

    const overallPaymentRatio = totals.totalPurchased > 0 
      ? (totals.totalPaid / totals.totalPurchased) * 100 
      : 0;

    return { ...totals, overallPaymentRatio };
  };


  const handleSort = (key:any) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort suppliers
  const getFilteredAndSortedSuppliers = () => {
    if (!reportData?.suppliersCreditSummary) return [];
    
    const filtered = reportData.suppliersCreditSummary.filter(supplier => {
      const matchesSearch = supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch ;
    });

    return filtered;
  };

  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-600">Loading suppliers report...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Report</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summary = getOverallSummary(reportData?.suppliersCreditSummary);
  const filteredSuppliers = getFilteredAndSortedSuppliers();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-gray-600 mt-2">Overview of all supplier credit performance and payment history</p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalSuppliers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalPurchases}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchased</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalPurchased)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(summary.totalUnpaid)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredSuppliers.length} of {reportData?.suppliersCreditSummary?.length || 0} suppliers
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('supplierName')}
                  >
                    Supplier Name
                    {sortConfig.key === 'supplierName' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalPurchasesPerformed')}
                  >
                    Purchases
                    {sortConfig.key === 'totalPurchasesPerformed' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalPurchasedAmount')}
                  >
                    Total Purchased
                    {sortConfig.key === 'totalPurchasedAmount' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalPaidAmount')}
                  >
                    Paid Amount
                    {sortConfig.key === 'totalPaidAmount' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalUnpaidAmount')}
                  >
                    Outstanding
                    {sortConfig.key === 'totalUnpaidAmount' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('paymentRatio')}
                  >
                    Payment %
                    {sortConfig.key === 'paymentRatio' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => {
                  const metrics = getSupplierMetrics(supplier);
                  return (
                    <tr key={supplier.supplierId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{supplier.supplierName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.totalPurchasesPerformed}</div>
                        <div className="text-sm text-gray-500">
                          Avg: {formatCurrency(metrics.averagePerPurchase)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(supplier.totalPurchasedAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(supplier.totalPaidAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-600">
                          {formatCurrency(supplier.totalUnpaidAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-grow bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(metrics.paymentRatio, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 min-w-0">
                            {metrics.paymentRatio.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierCreditReport;