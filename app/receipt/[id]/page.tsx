import React from 'react';
import { UUID } from 'crypto';
import { getOrderReceipt } from '@/lib/actions/order-actions';
import { OrderItems } from '@/types/orders/type';
import DownloadButton from '@/components/widgets/download-button';
import ShareButton from '@/components/widgets/share-button';

const OrderReceipt = async ({ params }: { params: { id: string } }) => {
  const orderData = await getOrderReceipt(params.id as UUID);
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/receipt/${orderData.id}`;


  // console.log("The order data is",orderData)

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

  const formatCurrency = (amount: string | number | bigint) => {
    return new Intl.NumberFormat().format(Number(amount));
  };

  return (
    <div className="min-h-screen bg-gray-100 mt-2 px-4 sm:px-0">
      <div className="max-w-2xl mx-auto">
        {orderData.paidAmount === orderData.amount ? (
          <>
            


            <div
              id="receipt-content"
              className="bg-white shadow-lg print:shadow-none relative w-full"
              style={{
                pageBreakInside: 'avoid',
                pageBreakBefore: 'auto',
                pageBreakAfter: 'auto'
              }}
            >
              {/* Receipt Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h1 className="text-2xl font-bold">{orderData.locationName}</h1>
                      <div className="text-xs text-white">

                        <p>{orderData.locationAddress ? (
                          `${orderData.locationAddress}, ${orderData.locationCity}`
                        ) : (
                          orderData.locationCity
                        )}</p>
                        <p>Tel: {orderData.locationPhone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">Receipt</p>
                    <p className="text-sm text-blue-100">#{orderData.orderNumber}</p>
                  </div>
                </div>
              </div>

              {/* Receipt Content */}
              <div className="p-6">
                {/* Order Info */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-6">
                  <div className="lg:border-r lg:border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-600 mb-2">Order Details</h2>
                    <p className="text-sm">Order #: <span className='font-semibold'>{orderData.orderNumber}</span></p>
                    <p className="text-sm">Open Date: <span className='font-semibold'>{formatDate(orderData.openedDate)}</span></p>
                    <p className="text-sm">Closed Date: <span className='font-semibold'>{formatDate(orderData.closedDate)}</span></p>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-600 mb-2">Payment Info</h2>
                    <p className="text-sm">Method: <span className='font-semibold'>{orderData.transactions?.length > 0 ? orderData.transactions[0].paymentMethodName : 'N/A'}</span></p>
                    <p className="text-sm">Status: <span className='font-semibold'>{orderData.orderPaymentStatus === 'NOT_PAID' ? 'NOT PAID' : 'PAID'}</span></p>
                    <p className="text-sm">Staff: <span className='font-semibold'>{orderData.finishedByName}</span></p>
                  </div>
                  {orderData.customerName && (
                    <div className="lg:border-r lg:border-gray-200">
                      <h2 className="text-sm font-semibold text-gray-600 mb-2">Customer Details</h2>
                      <p className="text-sm">Customer Name: <span className='font-semibold'>{orderData.customerName}</span></p>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orderData.items.map((item: OrderItems, index: number) => (
                        <tr key={index} className="text-sm">
                          <td className="px-3 py-2">{item.name.split(' - ').pop()}</td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="space-y-2 border-t pt-4 pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(orderData.grossAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span>{formatCurrency(orderData.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(orderData.netAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(orderData.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Balance:</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 text-center">
                  <div className="mt-4">
                    <div className="inline-block px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm font-semibold text-gray-600">Thank you for your business!</p>
                      <p className="text-xs text-gray-500">Receipt generated on {formatDate(new Date().toISOString())}</p>
                    </div>
                  </div>


                  {/* Powered by Settlo Image */}
                  <div className="mt-4">
                    <img
                      src="https://lporvjkotuidemnfvuzt.supabase.co/storage/v1/object/public/Images/others/powered-by-settlo.png"
                      alt="Powered by Settlo"
                      className="mx-auto h-8 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

          </>
        ) : (
          
          <div
            id="receipt-content"
            className="bg-white shadow-lg print:shadow-none relative w-full"
            style={{
              pageBreakInside: 'avoid',
              pageBreakBefore: 'auto',
              pageBreakAfter: 'auto'
            }}
          >
            {/* Receipt Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-2xl font-bold">{orderData.locationName}</h1>
                    <div className="text-xs text-white">

                      <p>{orderData.locationAddress ? (
                        `${orderData.locationAddress}, ${orderData.locationCity}`
                      ) : (
                        orderData.locationCity
                      )}</p>
                      <p>Tel: {orderData.locationPhone}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">Invoice</p>
                  <p className="text-sm text-blue-100">#{orderData.orderNumber}</p>
                </div>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-6">
              {/* Order Info */}
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-6">
                <div className="lg:border-r lg:border-gray-200 gap-6">
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">Order Details</h2>
                  <p className="text-sm">Order #: <span className='font-semibold'>{orderData.orderNumber}</span></p>
                  <p className="text-sm">Order start date: <span className='font-semibold'>{formatDate(orderData.openedDate)}</span></p>
                  <p className="text-sm">Order closed date: <span className='font-semibold'>{formatDate(orderData.closedDate)}</span></p>
                </div>
                <div className='gap-6'>
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">Payment Info</h2>
                  <p className="text-sm">Method: <span className='font-semibold'>{orderData.transactions?.length > 0 ? orderData.transactions[0].paymentMethodName : 'N/A'}</span></p>
                  <p className="text-sm">Status: <span className='font-semibold'>{orderData.orderPaymentStatus === 'NOT_PAID' ? 'NOT PAID' : 'PAID'}</span></p>
                  <p className="text-sm">Staff: <span className='font-semibold'>{orderData.finishedByName}</span></p>
                </div>
                {orderData.customerName && (
                  <div className="lg:border-r lg:border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-600 mb-2">Customer Details</h2>
                    <p className="text-sm">Customer Name: <span className='font-semibold'>{orderData.customerName}</span></p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="px-2 py-1 text-left">Item</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orderData.items.map((item: OrderItems, index: number) => (
                      <tr key={index} className="text-sm">
                        <td className="px-2 py-1">{item.name.split(' - ').pop()}</td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t pt-4 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(orderData.grossAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span>{formatCurrency(orderData.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(orderData.netAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(orderData.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Unpaid Amount:</span>
                  <span>{formatCurrency(orderData.unpaidAmount)}</span>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 text-center">
                <div className="mt-4">
                  <div className="inline-block px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm font-semibold text-gray-600">Thank you for your business!</p>
                    <p className="text-xs text-gray-500">Invoice generated on {formatDate(new Date().toISOString())}</p>
                  </div>
                </div>


                {/* Powered by Settlo Image */}
                <div className="mt-4">
                  <img
                    src="https://lporvjkotuidemnfvuzt.supabase.co/storage/v1/object/public/Images/others/powered-by-settlo.png"
                    alt="Powered by Settlo"
                    className="mx-auto h-8 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="grid  lg:flex lg:justify-center items-center mt-4 mb-4 gap-1 ">
              <DownloadButton orderNumber={orderData.orderNumber} />

              <ShareButton url={orderUrl} />
            </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
