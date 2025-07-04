import React from 'react';
// import { UUID } from 'crypto';
import { getOrderReceipt } from '@/lib/actions/order-actions';
import { OrderItems } from '@/types/orders/type';
import DownloadButton from '@/components/widgets/download-button';
import ShareButton from '@/components/widgets/share-button';

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

  const formatCurrency = (amount: string | number | bigint) => {
    return new Intl.NumberFormat().format(Number(amount));
  };

  const uniqueMethods = Array.from(
    new Set(orderData.transactions?.map((t: { paymentMethodName: string }) => t.paymentMethodName).filter(Boolean))
  ) as string[];

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
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-6 rounded-t-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className='flex flex-col gap-2'>
                      <h1 className="text-2xl font-bold">{orderData.businessName}</h1>
                      <p className="text-xs font-semibold">{orderData.locationName}</p>
                      <div className="flex flex-col gap-1 text-xs text-white">

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

                <div className='border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm p-3 mb-6'>
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-6  ">
                <div className="lg:border-r lg:border-gray-200 gap-6">
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">Order Details</h2>
                  <p className="text-sm">Order #: <span className='font-semibold'>{orderData.orderNumber}</span></p>
                  <p className="text-sm">Order start date: <span className='font-semibold'>{formatDate(orderData.openedDate)}</span></p>
                  <p className="text-sm">Status: <span className='font-semibold'>{orderData.orderPaymentStatus === 'NOT_PAID' ? 'NOT PAID' : 'PAID'}</span></p>
                  <p className="text-sm">Order closed date: <span className='font-semibold'>{orderData.closedDate ? formatDate(orderData.closedDate) : '-'}</span></p>
                </div>
                {(orderData.customerName || orderData.customerPhoneNumber || orderData.customerTinNumber) && (
                  <div >
                    <h2 className="text-sm font-semibold text-gray-600 mb-2">Customer Details</h2>
                    {orderData.customerName && (
                      <p className="text-sm">Name: <span className='font-semibold'>{orderData.customerName}</span></p>
                    )}
                    {orderData.customerPhoneNumber && (
                      <p className="text-sm">Phone Number: <span className='font-semibold'>{orderData.customerPhoneNumber}</span></p>
                    )}
                    {orderData.customerTinNumber && (
                      <p className="text-sm">TIN: <span className='font-semibold'>{orderData.customerTinNumber}</span></p>
                    )}
                  </div>
                )}
                <div className="lg:border-r lg:border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-600 mb-2">Staff Details</h2>
                    <p className="text-sm">Staff Assigned: <span className='font-semibold'>{orderData.assignedToName}</span></p>
                    <p className="text-sm">Staff Closed: <span className='font-semibold'>{orderData.finishedByName}</span></p>
                  </div>
                
                <div className='gap-6'>
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">Payment Info</h2>
                  {uniqueMethods.length > 1 ? (
                    <div>
                    <ul className="">
                      {uniqueMethods.map((method) => (
                        <li key={String(method)} className="text-sm">
                          {method}:{' '}
                          <span className="font-semibold">
                            {formatCurrency(
                              orderData.transactions
                                .filter((t: { paymentMethodName: string; }) => t.paymentMethodName === method)
                                .reduce((sum: number, t: { amount: any; }) => sum + Number(t.amount), 0)
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  ) : (
                    <p className="text-sm">
                      Method:{' '}
                      <span className="font-semibold">
                        {orderData.transactions?.[0]?.paymentMethodName || 'N/A'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              </div>    
                
               

                {/* Items Table */}
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm">
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
                <div className="space-y-2  pt-4 pb-4 mb-6">
                 
                  <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-medium">{formatCurrency(orderData.grossAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Discount:</span>
                        <span className="font-medium">{formatCurrency(orderData.totalDiscount)}</span>
                      </div>
                      <div className="border-t-2 border-dashed border-gray-300 pt-3">
                        <div className="flex justify-between text-xl font-bold text-gray-800">
                          <span>Total:</span>
                          <span className="text-emerald-600">{formatCurrency(orderData.netAmount)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Amount Paid:</span>
                        <span className="font-medium text-green-600">{formatCurrency(orderData.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Balance:</span>
                        <span>{formatCurrency(orderData.netAmount - orderData.paidAmount)}</span>
                      </div>
                    </div>
              </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-3 mt-12 text-center border border-emerald-200">
                    <div className="inline-block px-6 py-3 bg-white rounded-lg shadow-sm border-2 border-dashed border-emerald-300">
                      <p className="text-lg font-semibold text-emerald-800">Thank you for your business!</p>
                      <p className="text-sm text-emerald-600 mt-1">Receipt generated on {formatDate(new Date().toISOString())}</p>
                    </div>
        
                    {/* Powered by Settlo */}
                    <div className="mt-6">
                      <div className="inline-block bg-white rounded-lg p-1 shadow-sm">
                        <img
                          src="https://lporvjkotuidemnfvuzt.supabase.co/storage/v1/object/public/Images/others/powered-by-settlo.png"
                          alt="Powered by Settlo"
                          className="h-8 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </>
        ) : (
          
          <div
            id="receipt-content"
            className="bg-white shadow-lg print:shadow-none relative w-full mx-auto max-w-3xl overflow-hidden"
            style={{
              pageBreakInside: 'avoid',
              pageBreakBefore: 'auto',
              pageBreakAfter: 'auto'
            }}
          >
            {/* Receipt Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-6 rounded-t-md ">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className='flex flex-col gap-2'>
                    <h1 className="text-2xl font-bold">{orderData.businessName}</h1>
                    <h1 className="text-xs font-semibold">{orderData.locationName}</h1>
                    <div className="flex flex-col gap-1 text-xs text-white">

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
              <div className='border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm p-3 mb-6'>
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-6  ">
                <div className="lg:border-r lg:border-gray-200 gap-6">
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">Order Details</h2>
                  <p className="text-sm">Order #: <span className='font-semibold'>{orderData.orderNumber}</span></p>
                  <p className="text-sm">Order start date: <span className='font-semibold'>{formatDate(orderData.openedDate)}</span></p>
                  <p className="text-sm">Status: <span className='font-semibold'>{orderData.orderPaymentStatus === 'NOT_PAID' ? 'NOT PAID' : 'PAID'}</span></p>
                  <p className="text-sm">Order closed date: <span className='font-semibold'>{orderData.closedDate ? formatDate(orderData.closedDate) : '-'}</span></p>
                </div>
                {(orderData.customerName || orderData.customerPhoneNumber || orderData.customerTinNumber) && (
                  <div >
                    <h2 className="text-sm font-semibold text-gray-600 mb-2">Customer Details</h2>
                    {orderData.customerName && (
                      <p className="text-sm">Name: <span className='font-semibold'>{orderData.customerName}</span></p>
                    )}
                    {orderData.customerPhoneNumber && (
                      <p className="text-sm">Phone Number: <span className='font-semibold'>{orderData.customerPhoneNumber}</span></p>
                    )}
                    {orderData.customerTinNumber && (
                      <p className="text-sm">TIN: <span className='font-semibold'>{orderData.customerTinNumber}</span></p>
                    )}
                  </div>
                )}
                <div className="lg:border-r lg:border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-600 mb-2">Staff Details</h2>
                    <p className="text-sm">Staff Assigned: <span className='font-semibold'>{orderData.assignedToName}</span></p>
                    <p className="text-sm">Staff Closed: <span className='font-semibold'>{orderData.finishedByName}</span></p>
                  </div>
                
                <div className='gap-6'>
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">Payment Info</h2>
                  {uniqueMethods.length > 1 ? (
                    <div>
                    <ul className="">
                      {uniqueMethods.map((method) => (
                        <li key={String(method)} className="text-sm">
                          {method}:{' '}
                          <span className="font-semibold">
                            {formatCurrency(
                              orderData.transactions
                                .filter((t: { paymentMethodName: string; }) => t.paymentMethodName === method)
                                .reduce((sum: number, t: { amount: any; }) => sum + Number(t.amount), 0)
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  ) : (
                    <p className="text-sm">
                      Method:{' '}
                      <span className="font-semibold">
                        {orderData.transactions?.[0]?.paymentMethodName || 'N/A'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              </div>

              {/* Items Table */}
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm">
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
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-medium">{formatCurrency(orderData.grossAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Discount:</span>
                        <span className="font-medium">{formatCurrency(orderData.totalDiscount)}</span>
                      </div>
                      <div className="border-t-2 border-dashed border-gray-300 pt-3">
                        <div className="flex justify-between text-xl font-bold text-gray-800">
                          <span>Total:</span>
                          <span className="text-emerald-600">{formatCurrency(orderData.netAmount)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Amount Paid:</span>
                        <span className="font-medium text-green-600">{formatCurrency(orderData.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Unpaid Amount:</span>
                        <span className="font-medium text-red-600">{formatCurrency(orderData.unpaidAmount)}</span>
                      </div>
                    </div>
              </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4 mt-8 text-center border border-emerald-200">
                    <div className="inline-block px-6 py-3 bg-white rounded-lg shadow-sm border-2 border-dashed border-emerald-300">
                      <p className="text-lg font-semibold text-emerald-800">Thank you for your business!</p>
                      <p className="text-sm text-emerald-600 mt-1">Invoice generated on {formatDate(new Date().toISOString())}</p>
                    </div>
        
                    {/* Powered by Settlo */}
                    <div className="mt-6">
                      <div className="inline-block bg-white rounded-lg p-3 shadow-sm">
                        <img
                          src="https://lporvjkotuidemnfvuzt.supabase.co/storage/v1/object/public/Images/others/powered-by-settlo.png"
                          alt="Powered by Settlo"
                          className="h-8 object-contain"
                        />
                      </div>
                    </div>
                  </div>
            </div>
          </div>
        )}
       <div className='hidden lg:block'>
       {!isDownloadable && (
          <div className="grid lg:flex lg:justify-center items-center mt-4 mb-4 gap-1">
            <DownloadButton orderNumber={orderData.orderNumber} isDownloadable={isDownloadable==='1'}/>
            <ShareButton url={orderUrl} />
          </div>
        )}
       </div>
      </div>
    </div>
  );
};

export default OrderReceipt;

