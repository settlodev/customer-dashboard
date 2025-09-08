import React from 'react';
import { getOrderReceipt } from '@/lib/actions/order-actions';
import { OrderItems } from '@/types/orders/type';
import DownloadButton from '@/components/widgets/download-button';
import ShareButton from '@/components/widgets/share-button';
import Image from 'next/image';

type Params = Promise<{
  id: string;
  download?: string;
}>;

const OrderReceipt = async ({ params }: { params: Params }) => {
  // Await the params to resolve them
  const resolvedParams = await params;
  const { id, download } = resolvedParams;

  const orderData = await getOrderReceipt(id);
  
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/receipt/${orderData.id}`;

  const isDownloadable = download;

  const formatDate = (dateStr: string | number | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDisplayDate = (dateStr: string | number | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number | bigint) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount));
  };

  const uniqueMethods = Array.from(
    new Set(orderData.transactions?.map((t: { paymentMethodName: string }) => t.paymentMethodName).filter(Boolean))
  ) as string[];

  // Check if customer information is present
  const hasCustomerInfo = orderData.customerName || orderData.customerPhoneNumber || orderData.customerTinNumber;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div
          id="receipt-content"
          className="bg-white shadow-sm border border-gray-200 mx-auto"
          style={{
            maxWidth: '794px',
            pageBreakInside: 'avoid',
            pageBreakBefore: 'auto',
            pageBreakAfter: 'auto'
          }}
        >
          {/* Header Section */}
          <div className="p-8 pb-6">
            <div className="flex flex-col lg:flex-row justify-between lg:items-start  gap-6 mb-8">
              {/* Company Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{orderData.businessName}</h1>
                <div className="text-sm text-gray-600 space-y-1">
                 <div className='flex gap-2'>
                 <p className="font-medium capitalize">{orderData.locationName}</p>
                  <p>{orderData.locationAddress ? 
                    `${orderData.locationAddress}, ${orderData.locationCity}` : 
                    orderData.locationCity}
                  </p>
                 </div>
                  <p>Phone: {orderData.locationPhone}</p>
                </div>
              </div>

              {/* Receipt Title & Number */}
              <div className="lg:text-right">
                <h2 className="lg:text-xl font-bold text-gray-900 mb-1">
                  {orderData.paidAmount === orderData.amount ? 'RECEIPT' : 'INVOICE'}
                </h2>
                <p className="text-sm text-gray-600">#{orderData.orderNumber}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {orderData.paidAmount === orderData.amount ? 'Receipt' : 'Invoice'} Date: {formatDisplayDate(orderData.openedDate)}
                </p>
                {orderData.closedDate && (
                  <p className="text-sm text-gray-600">
                    Closed Date: {formatDisplayDate(orderData.closedDate)}
                  </p>
                )}
                <p className="text-sm mt-3 font-medium">
                  Status: <span className={`px-2 py-1 rounded-full text-xs ${
                    orderData.orderPaymentStatus === 'PAID' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {orderData.orderPaymentStatus === 'NOT_PAID' ? 'NOT PAID' : 'PAID'}
                  </span>
                </p>
              </div>
            </div>

            {/* Bill To & Order Details */}
            <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
              {/* Bill To Section */}
              {hasCustomerInfo && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Bill To:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    {orderData.customerName && (
                      <p><span className="font-medium text-gray-900">Customer Name:</span> {orderData.customerName}</p>
                    )}
                    {orderData.customerPhoneNumber && (
                      <p><span className="font-medium text-gray-900">Customer Phone Number:</span> {orderData.customerPhoneNumber}</p>
                    )}
                    {orderData.customerTinNumber && (
                      <p><span className="font-medium text-gray-900">Customer TIN:</span> {orderData.customerTinNumber}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className={hasCustomerInfo ? 'lg:text-right' : ''}>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Order Details:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Order #:</span> {orderData.orderNumber}</p>
                  <p><span className="font-medium">Started:</span> {formatDisplayDate(orderData.openedDate)}</p>
                  <p><span className="font-medium">Staff Assigned:</span> {orderData.assignedToName}</p>
                  <p><span className="font-medium">Staff Closed:</span> {orderData.finishedByName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 mb-6">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.items.map((item: OrderItems, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name.split(' - ').pop()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="px-8 mb-6">
            <div className="flex justify-end">
              <div className="w-full max-w-sm">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(orderData.grossAmount)}</span>
                  </div>
                  {orderData.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(orderData.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total:</span>
                      <span>{formatCurrency(orderData.netAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Amount Paid:</span>
                      <span className="font-medium text-green-600">{formatCurrency(orderData.paidAmount)}</span>
                    </div>
                    {orderData.paidAmount !== orderData.netAmount && (
                      <div className="flex justify-between text-gray-600">
                        <span>{orderData.paidAmount === orderData.amount ? 'Balance:' : 'Unpaid Amount:'}</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(orderData.netAmount - orderData.paidAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Method{uniqueMethods.length > 1 ? 's' : ''}:</h4>
                    {uniqueMethods.length > 1 ? (
                      <div className="space-y-1">
                        {uniqueMethods.map((method) => (
                          <div key={String(method)} className="flex justify-between text-sm text-gray-600">
                            <span>{method}:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                orderData.transactions
                                  .filter((t: { paymentMethodName: string; }) => t.paymentMethodName === method)
                                  .reduce((sum: number, t: { amount: any; }) => sum + Number(t.amount), 0)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {orderData.transactions?.[0]?.paymentMethodName || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-4 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-gray-900">Thank you for your business!</p>
              <p className="text-sm text-gray-500">
                {orderData.paidAmount === orderData.amount ? 'Receipt' : 'Invoice'} generated on {formatDate(new Date().toISOString())}
              </p>
              <p className="text-sm text-gray-500">Powered by Settlo Technologies</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="hidden lg:block">
          {!isDownloadable && (
            <div className="grid lg:flex lg:justify-center items-center mt-6 mb-4 gap-3">
              <DownloadButton 
                orderNumber={orderData.orderNumber} 
                isDownloadable={isDownloadable === '1'}
                fontSize={{
                  header: '16px',
                  body: '11px', 
                  footer: '9px'
                }}
              />
              <ShareButton url={orderUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;