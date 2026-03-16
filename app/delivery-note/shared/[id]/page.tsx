import { getOrderReceipt } from "@/lib/actions/order-actions";
import { OrderItems } from "@/types/orders/type";
import DownloadButton from "@/components/widgets/download-button";
import ShareButton from "@/components/widgets/share-button";
import DeliveryNoteDownloadButton from "@/components/widgets/delivery-note-download-button";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  location?: string;
  [key: string]: string | string[] | undefined;
}>;

const DeliveryNote = async ({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { id } = resolvedParams;

  const orderData = await getOrderReceipt(id);
  const location = resolvedSearchParams.location || orderData.location;

  const deliveryNoteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/delivery-note/shared/${orderData.id}`;

  const formatDisplayDate = (dateStr: string | number | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDate = (dateStr: string | number | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasCustomerInfo =
    orderData.customerName ||
    orderData.customerPhoneNumber ||
    orderData.customerTinNumber;

  // Derive delivery address: prefer customerAddress if available, else fall back to locationAddress
  const deliveryAddress = orderData.customerAddress || "—";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto rounded-lg">
        {/* ─── Document ─── */}
        <div
          id="delivery-note-content"
          className="bg-white rounded-lg shadow-sm border border-gray-200 mx-auto"
          style={{
            maxWidth: "794px",
            pageBreakInside: "avoid",
            pageBreakBefore: "auto",
            pageBreakAfter: "auto",
          }}
        >
          {/* ── Header ── */}
          <div className="p-8 pb-6">
            <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-6 mb-8">
              {/* Company Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {orderData.businessName}
                </h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex gap-2">
                    <p className="font-medium capitalize">
                      {orderData.locationName}
                    </p>
                    <p>
                      {orderData.locationAddress
                        ? `${orderData.locationAddress}, ${orderData.locationCity}`
                        : orderData.locationCity}
                    </p>
                  </div>
                  <p>Phone: {orderData.locationPhone}</p>
                </div>
              </div>

              {/* Title Block */}
              <div className="lg:text-right">
                <h2 className="text-xl font-bold text-gray-900 mb-1 uppercase tracking-wide">
                  Delivery Note
                </h2>
                <p className="text-sm text-gray-600">
                  order #{orderData.orderNumber}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Order Date: {formatDisplayDate(orderData.openedDate)}
                </p>
                {orderData.closedDate && (
                  <p className="text-sm text-gray-600">
                    Closed Date: {formatDisplayDate(orderData.closedDate)}
                  </p>
                )}
              </div>
            </div>

            {/* ── Deliver To + Order Details ── */}
            <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
              {/* Deliver To */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Deliver To:
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {orderData.customerName ? (
                    <p>
                      <span className="font-medium text-gray-900">Name:</span>{" "}
                      {orderData.customerName}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">No customer name</p>
                  )}
                  {orderData.customerPhoneNumber && (
                    <p>
                      <span className="font-medium text-gray-900">Phone:</span>{" "}
                      {orderData.customerPhoneNumber}
                    </p>
                  )}
                  {orderData.customerTinNumber && (
                    <p>
                      <span className="font-medium text-gray-900">TIN:</span>{" "}
                      {orderData.customerTinNumber}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-gray-900">
                      Delivery Address:
                    </span>{" "}
                    {deliveryAddress}
                  </p>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="lg:text-right">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Delivery Details:
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Order #:</span>{" "}
                    {orderData.orderNumber}
                  </p>
                  <p>
                    <span className="font-medium">Prepared By:</span>{" "}
                    {orderData.assignedToName || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Dispatched By:</span>{" "}
                    {orderData.finishedByName || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Driver / Carrier + Delivery Date ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Driver / Carrier
                </p>
                {/* 
                  If your orderData includes a driverName / carrierName field, replace the
                  placeholder below. Otherwise this can be filled in manually on the printed copy.
                  Example: orderData.driverName || "___________________________"
                */}
                <p className="text-sm text-gray-800 font-medium border-b border-dashed border-gray-300 pb-1 min-h-[24px]">
                  {(orderData as any).driverName ||
                    "___________________________"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Delivery Date
                </p>
                {/* 
                  If your orderData includes a deliveryDate field, replace the placeholder.
                  Example: orderData.deliveryDate
                    ? formatDisplayDate(orderData.deliveryDate)
                    : "___________________________"
                */}
                <p className="text-sm text-gray-800 font-medium border-b border-dashed border-gray-300 pb-1 min-h-[24px]">
                  {(orderData as any).deliveryDate
                    ? formatDisplayDate((orderData as any).deliveryDate)
                    : "___________________________"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Items Table (no prices) ── */}
          <div className="px-8 mb-6">
            <div className="overflow-x-auto">
              <div className="border border-gray-200 rounded-lg min-w-full overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-8">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Item Description
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Qty Ordered
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Qty Delivered
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                        Condition
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderData.items.map((item: OrderItems, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.name.split(" - ").pop()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">
                          {item.quantity}
                        </td>
                        {/* Qty Delivered — blank for manual fill-in on printed copy */}
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">
                          <span className="border-b border-dashed border-gray-300 inline-block w-12">
                            &nbsp;
                          </span>
                        </td>
                        {/* Condition — blank for manual fill-in */}
                        <td className="px-4 py-3 text-sm text-gray-400">
                          <span className="border-b border-dashed border-gray-300 inline-block w-24">
                            &nbsp;
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-sm font-semibold text-gray-700 text-right"
                      >
                        Total Items:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-center">
                        {orderData.items.reduce(
                          (sum: number, item: OrderItems) =>
                            sum + Number(item.quantity),
                          0,
                        )}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          {orderData.notes && (
            <div className="px-8 mb-6">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Notes
                </h4>
                <p className="text-sm text-gray-600">{orderData.notes}</p>
              </div>
            </div>
          )}

          {/* ── Signature Block ── */}
          <div className="px-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              {/* Delivered By */}
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Delivered By (Driver)
                  </p>
                  <p className="text-sm text-gray-800">
                    {(orderData as any).driverName ||
                      "___________________________"}
                  </p>
                </div>
                <div>
                  <div className="border-b-2 border-gray-400 w-full mb-1" />
                  <p className="text-xs text-gray-500">Signature & Date</p>
                </div>
              </div>

              {/* Received By */}
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Received By (Customer)
                  </p>
                  <p className="text-sm text-gray-400 italic">
                    ___________________________
                  </p>
                </div>
                <div>
                  <div className="border-b-2 border-gray-400 w-full mb-1" />
                  <p className="text-xs text-gray-500">Signature & Date</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-8 pb-8 pt-4 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-gray-900">
                Thank you for your business!
              </p>
              <p className="text-sm text-gray-500">
                Delivery note generated on{" "}
                {formatDate(new Date().toISOString())}
              </p>
              <p className="text-sm text-gray-500">
                Powered by Settlo Technologies
              </p>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="hidden lg:block">
          <div className="grid lg:flex lg:justify-center items-center mt-6 mb-4 gap-3 mr-12 ml-12">
            <DeliveryNoteDownloadButton
              title="Download Delivery Note"
              orderNumber={orderData.orderNumber}
              isDownloadable={false}
              fontSize={{ header: "16px", body: "11px", footer: "9px" }}
            />
            <ShareButton url={deliveryNoteUrl} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryNote;
