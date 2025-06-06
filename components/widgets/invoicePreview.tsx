
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InvoicePreviewProps {
  formData: {
    owner?: any;
    devices?: Array<{
      device?: any;
      quantity?: number;
      price?: number;
    }>;
    subscriptions?: Array<{
      subscription?: any;
      quantity?: number;
    }>;
    note?: string;
    due_date?: string;
    invoice_date?: string;
    discount?: number;
    vat_inclusive?: boolean;
    // New fields for update scenario
    billingDetails?: {
      billed_name?: string;
      billed_email?: string;
      billed_phone?: string;
      billed_address?: string;
    };
    invoice_number?: string;
    isUpdating?: boolean;
  };
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ formData }) => {
  console.log("The form data is ", formData);
  
  // Format date for display
  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get invoice number - use existing one for updates or generate a random one for new invoices
  const invoiceNumber = formData.invoice_number || 
    `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  // Get owner details - use form selection if available, otherwise use billing details
  const ownerName = (typeof formData.owner === 'object' && formData.owner)
    ? `${formData.owner.firstName} ${formData.owner.lastName}`
    : formData.billingDetails?.billed_name || 'Customer Name';

  const ownerEmail = (typeof formData.owner === 'object' && formData.owner?.email)
    ? formData.owner.email
    : formData.billingDetails?.billed_email || 'customer@example.com';

  const ownerPhone = (typeof formData.owner === 'object' && formData.owner?.phoneNumber)
    ? formData.owner.phoneNumber
    : formData.billingDetails?.billed_phone || '';

  const ownerLocation = (typeof formData.owner === 'object' && formData.owner?.countryName)
    ? formData.owner.countryName
    : formData.billingDetails?.billed_address || '';

  // Calculate subtotal from all devices
  const calculateDevicesSubtotal = () => {
    if (!formData.devices || formData.devices.length === 0) return 0;
    
    return formData.devices.reduce((total, item) => {
      const devicePrice = item.price || 
        (typeof item.device === 'object' && item.device ? item.device.selling_price : 0);
      const quantity = item.quantity || 0;
      return total + (devicePrice * quantity);
    }, 0);
  };
  
  // Calculate subtotal from all subscriptions
  const calculateSubscriptionsSubtotal = () => {
    if (!formData.subscriptions || formData.subscriptions.length === 0) return 0;
    
    return formData.subscriptions.reduce((total, item) => {
      const subscriptionPrice = 
        (typeof item.subscription === 'object' && item.subscription ? item.subscription.amount : 0);
      const quantity = item.quantity || 0;
      return total + (subscriptionPrice * quantity);
    }, 0);
  };

  // Check if we have actual device data
  const hasDeviceData = formData.devices && formData.devices.length > 0 && 
    formData.devices.some(item => item.device || item.price);

  // Check if we have actual subscription data
  const hasSubscriptionData = formData.subscriptions && formData.subscriptions.length > 0 &&
    formData.subscriptions.some(item => item.subscription);

  // Calculate total subtotal
  const devicesSubtotal = calculateDevicesSubtotal();
  const subscriptionsSubtotal = calculateSubscriptionsSubtotal();
  const subtotal = devicesSubtotal + subscriptionsSubtotal;
  
  const discount = formData.discount || 0;
  const vatRate = 0.18; // 18% VAT
  const vatInclusive = formData.vat_inclusive;

  // Calculate tax and total based on VAT inclusive/exclusive
  let tax: number = 0;
  let total: number;

  if (vatInclusive === true) {
    // If VAT is inclusive, we need to extract it from the subtotal
    const subtotalBeforeVat = subtotal / (1 + vatRate);
    tax = subtotal - subtotalBeforeVat;
    total = subtotal - discount;
  } else {
    total = subtotal - discount;
  }

  // Format numbers for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Function to get detailed device name
  const getDeviceDetails = (device: any) => {
    if (!device) return 'Unknown Device';
    
    let details = [];
    
    if (device.brand) details.push(device.brand);
    if (device.model) details.push(device.model);
    if (device.device_type) details.push(device.device_type);
    if (device.serial_number) details.push(`SN: ${device.serial_number}`);
    
    // If we have specifications, add them
    if (device.specifications) {
      const specs = typeof device.specifications === 'object' ? device.specifications : {};
      if (specs.storage) details.push(`${specs.storage} Storage`);
      if (specs.memory) details.push(`${specs.memory} RAM`);
      if (specs.processor) details.push(specs.processor);
    }

    return details.length > 0 ? details.join(' - ') : 'Device Details Not Available';
  };

  // Function to get subscription details
  const getSubscriptionDetails = (subscription: any) => {
    // console.log("The subscription",subscription)
    if (!subscription) return 'Unknown Package';
    
    let details = [];
    
    if (subscription.subscription_name) details.push(subscription.subscription_name);
   
    
    return details.length > 0 ? details.join(' - ') : 'Package Details Not Available';
  };
  
  
  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-xl font-bold text-center">
          {formData.isUpdating ? 'Invoice Update Preview' : 'Invoice Preview'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <div>
                <h3 className="font-semibold">Settlo Technologies Ltd</h3>
                <p className="text-sm text-gray-500">8th Floor Noble Centre Building, Bagamoyo Road</p>
                <p className="text-sm text-gray-500">Dar es Salaam, Tanzania</p>
                <p className="text-sm mt-1 text-gray-600">TAX IDENTIFICATION NUMBER (TIN): 153-112-053</p>
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">Contact</h2>
                <p className="text-sm text-gray-500">Phone: +255 788 000 000</p>
                <p className="text-sm text-gray-500">Email: accounts@settlo.co.tz</p>
                <p className="text-sm text-gray-500">Website: www.settlo.co.tz</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
              <p className="text-sm text-gray-500">#{invoiceNumber}</p>
              <p className="text-sm text-gray-500">Invoice Date: {formatDisplayDate(formData.invoice_date)}</p>
              <p className="text-sm text-gray-500">Invoice Due Date: {formatDisplayDate(formData.due_date)}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-700">Bill To:</h3>
            <p className="font-medium">{ownerName}</p>
            <p className="text-sm text-gray-500">{ownerEmail}</p>
            {ownerPhone && <p className="text-sm text-gray-500">{ownerPhone}</p>}
            {ownerLocation && <p className="text-sm text-gray-500">{ownerLocation}</p>}
          </div>

          {/* Devices Table - Only shown when there's device data */}
          {hasDeviceData && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-2">Devices:</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-1">Item</th>
                    <th className="text-right py-2 px-1">Price</th>
                    <th className="text-right py-2 px-1">Quantity</th>
                    <th className="text-right py-2 px-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.devices?.map((item, index) => {
                    const device = typeof item.device === 'object' && item.device;
                    const deviceName = device ? getDeviceDetails(device) : 'Device';
                    const devicePrice = item.price || (device ? device.selling_price : 0);
                    const quantity = item.quantity || 0;
                    const itemTotal = devicePrice * quantity;

                    return (
                      <tr key={`device-${index}`} className="border-b border-gray-200">
                        <td className="py-2 px-1">{deviceName}</td>
                        <td className="text-right py-2 px-1">{formatCurrency(devicePrice)}</td>
                        <td className="text-right py-2 px-1">{formatNumber(quantity)}</td>
                        <td className="text-right py-2 px-1">{formatCurrency(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Subscriptions Table - Only shown when there's subscription data */}
          {hasSubscriptionData && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-2">Subscriptions:</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-1">Package</th>
                    <th className="text-right py-2 px-1">Price</th>
                    <th className="text-right py-2 px-1">Duration (Months)</th>
                    <th className="text-right py-2 px-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.subscriptions?.map((item, index) => {
                    const subscription = typeof item.subscription === 'object' && item.subscription;
                    // const packageNamex = subscription ? subscription.subscription_name : '';
                    const packageName = subscription ? getSubscriptionDetails(subscription) : '';
                    const subscriptionPrice = subscription ? subscription.amount : 0;
                    const quantity = item.quantity || 0;
                    const itemTotal = subscriptionPrice * quantity;

                    return (
                      <tr key={`subscription-${index}`} className="border-b border-gray-200">
                        <td className="py-2 px-1">{packageName}</td>
                        <td className="text-right py-2 px-1">{formatCurrency(subscriptionPrice)}</td>
                        <td className="text-right py-2 px-1">{formatNumber(quantity)}</td>
                        <td className="text-right py-2 px-1">{formatCurrency(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* If no items added */}
          {!hasDeviceData && !hasSubscriptionData && (
            <div className="mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-1">Item</th>
                    <th className="text-right py-2 px-1">Price</th>
                    <th className="text-right py-2 px-1">Quantity</th>
                    <th className="text-right py-2 px-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td colSpan={4} className="py-2 px-1 text-center text-gray-500">No items added</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="mt-4 flex flex-col items-end">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-1">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              {vatInclusive === true && (
                <div className="flex justify-between py-1">
                  <span>VAT ({vatRate * 100}%) (Included):</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 font-bold border-t border-gray-300 mt-2 pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700">Notes:</h4>
            {formData.note ? (
              <p className="text-sm mt-1 text-gray-600">{formData.note}</p>
            ) : (
              <p className="text-sm mt-1 text-gray-400 italic">No notes provided</p>
            )}
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Payment Details:</h4>
              <p className="text-sm text-gray-600 font-bold mb-2">A/C Name: Settlo Technologies Ltd</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="border rounded p-3">
                  <h5 className="font-semibold text-gray-800">Ecobank Tz</h5>
                  <p className="text-sm text-gray-600">A/C #: 7080004083</p>
                </div>
                <div className="border rounded p-3">
                  <h5 className="font-semibold text-gray-800">CRDB</h5>
                  <p className="text-sm text-gray-600">A/C #: 0150885684800</p>
                </div>
                <div className="border rounded p-3">
                  <h5 className="font-semibold text-gray-800">NMB</h5>
                  <p className="text-sm text-gray-600">A/C #: 24110011133</p>
                </div>
                <div className="border rounded p-3">
                  <h5 className="font-semibold text-gray-800">M-PESA</h5>
                  <p className="text-sm text-gray-600">A/C #: 54224615</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Powered by */}
        <div className="mt-6 pt-6 border-t border-gray-200 items-center">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Powered by</p>
              <p className="text-sm text-gray-500">Settlo Technologies Ltd</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
  
export default InvoicePreview;