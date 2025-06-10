
"use client";
import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, MapPin, CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getInvoiceById } from '@/lib/actions/invoice-actions';
import { UUID } from 'crypto';
import { Invoice } from '@/types/invoice/type';
import Loading from '@/app/loading';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat().format(amount );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PARTIALLY_PAID':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'NOT_PAID':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PAID':
      return <CheckCircle className="w-4 h-4" />;
    case 'PARTIALLY_PAID':
      return <Clock className="w-4 h-4" />;
    case 'NOT_PAID':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

export default function InvoicePage({
    params
  }: {
    params: { id: string };
  }) {
    const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    
  
    useEffect(() => {
      const fetchInvoice = async () => {
        try {
          setLoading(true);
          const invoice = await getInvoiceById(params.id as UUID);
          setInvoiceData(invoice);
          console.log(invoice);
        } catch (err) {
          setError('Failed to load invoice');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchInvoice();
    }, [params.id]);
  
    if (loading) {
      return (
        <>
        <Loading/>
        </>
      );
    }
  
    if (error || !invoiceData) {
      return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-gray-50 min-h-screen">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600">{error || 'Invoice not found'}</p>
          </div>
        </div>
      );
    }
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
            <p className="text-lg text-gray-600 mt-1">{invoiceData.invoiceNumber}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon(invoiceData.locationInvoiceStatus)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoiceData.locationInvoiceStatus)}`}>
              {invoiceData.locationInvoiceStatus.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Invoice Details
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Invoice #</label>
                  <p className="text-gray-900 font-mono text-sm">{invoiceData.invoiceNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Location </label>
                  <p className="text-gray-900 font-mono text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {invoiceData.locationName}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Issue Date</label>
                  <p className="text-gray-900">{Intl.DateTimeFormat('en-US').format(new Date(invoiceData.dateCreated))}</p>
                </div>
                
                {/* <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
                  <p className="text-gray-900">July 6, 2025</p>
                </div> */}
              </div>
            </div>
          </div>

          {/* Subscription Items */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Items</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoiceData.locationSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{sub.subscriptionPackageName}</div>
                       
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-emerald-800 rounded-full">
                          {sub.numberOfMonths} {sub.numberOfMonths === 1 ? 'Month' : 'Months'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(sub.amountPerSubscription)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(sub.totalSubscriptionAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Payment Summary */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Payment Summary
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(invoiceData.totalAmount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Paid Amount</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(invoiceData.paidAmount)}
                </span>
              </div>
              
              <hr className="border-gray-200" />
              
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">Outstanding Balance</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(invoiceData.unpaidAmount)}
                </span>
              </div>
              
              {invoiceData.unpaidAmount > 0 && (
                <div className="mt-6">
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Pay Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Progress */}
          {/* <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Progress</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">
                  {Math.round((invoiceData.paidAmount / invoiceData.totalAmount) * 100)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(invoiceData.paidAmount / invoiceData.totalAmount) * 100}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatCurrency(invoiceData.paidAmount)} paid</span>
                <span>{formatCurrency(invoiceData.unpaidAmount)} remaining</span>
              </div>
            </div>
          </div> */}

          {/* Actions */}
          {/* <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <div className="font-medium text-gray-900">Download PDF</div>
                <div className="text-sm text-gray-500">Get a printable version</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <div className="font-medium text-gray-900">Send Reminder</div>
                <div className="text-sm text-gray-500">Email payment reminder</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <div className="font-medium text-gray-900">View History</div>
                <div className="text-sm text-gray-500">Payment & activity log</div>
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}

