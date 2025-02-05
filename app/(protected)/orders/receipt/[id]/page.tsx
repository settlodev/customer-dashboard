import React from 'react';
import { Camera } from 'lucide-react';
import { UUID } from 'crypto';
import { getOrder } from '@/lib/actions/order-actions';
import { Orders } from '@/types/orders/type';

const OrderReceipt =async ({ params }: { params: { id: string } }) =>{

  const order = await getOrder(params.id as UUID);
  const orderData: Orders | null = order?.content[0];

  // console.log("orderData:", orderData);

  // const isValidImageUrl = (image: string) => {
  //     return image && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/'));
  // };

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(amount));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="bg-white p-2 rounded-full">
                  <Camera className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Auto Parts Store</h1>
                  <p className="text-blue-100">Premium Car Parts & Accessories</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">Receipt</p>
                <p className="text-sm text-blue-100">#{orderData.orderNumber}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border-r border-gray-200">
                <h2 className="text-sm font-semibold text-gray-600 mb-2">Order Details</h2>
                <p className="text-sm">Order #: <span className='font-semibold'>{orderData.orderNumber}</span></p>
                <p className="text-sm">Open Date: <span className='font-semibold'>{formatDate(orderData.openedDate)}</span></p>
                <p className="text-sm">Closed Date: <span className='font-semibold'>{formatDate(orderData.closedDate)}</span></p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-2">Payment Info</h2>
                <p className="text-sm">Method: <span className='font-semibold'>{orderData.transactions[0].paymentMethodName}</span></p>
                <p className="text-sm">Status: <span className='font-semibold'>{orderData.orderPaymentStatus}</span></p>
                <p className="text-sm">Staff: <span className='font-semibold'>{orderData.finishedByName}</span></p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {
                    orderData.items.map((item, index) => (
                      <tr key={index} className="text-sm">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))
                  }
                 
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t pt-4">
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
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 text-center">
            <div className="mb-4">
              <div className="inline-block px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm font-semibold text-gray-600">Thank you for your business!</p>
                <p className="text-xs text-gray-500">Receipt generated on {formatDate(new Date().toISOString())}</p>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              <p>Auto Parts Store</p>
              <p>123 Auto Plaza, Downtown</p>
              <p>Tel: +255 123 456 789</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;