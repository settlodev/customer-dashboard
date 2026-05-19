import { getOrderReceipt } from "@/lib/actions/order-actions";
import { OrderItems } from "@/types/orders/type";
import ShareButton from "@/components/widgets/share-button";
import DeliveryNoteDownloadButton from "@/components/widgets/delivery-note-download-button";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

type Params = Promise<{ id: string }>;
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
  const { id } = resolvedParams;

  const orderData = await getOrderReceipt(id);

  const deliveryNoteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/delivery-note/shared/${orderData.id}`;

  const locationLogo =
    orderData.locationDetails?.logo || orderData.locationDetails?.image;

  const formatDisplayDate = (dateStr: string | number | Date) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatDate = (dateStr: string | number | Date) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const deliveryAddress = orderData.customerAddress || "—";

  const totalQty = orderData.items.reduce(
    (sum: number, item: OrderItems) => sum + Number(item.quantity),
    0,
  );

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6"
      style={{ backgroundColor: SECONDARY }}
    >
      <div className="max-w-4xl mx-auto">
        {/* ─── Document ─── */}
        <div
          id="delivery-note-content"
          className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
          style={{ maxWidth: "794px", border: `1px solid ${SECONDARY}` }}
        >
          {/* ── HEADER: Logo+Name left · Title+Address right ── */}
          <div className="px-6 lg:px-10 pt-8 pb-6 flex flex-col lg:flex-row justify-between items-start gap-6">
            {/* Left: logo + business name */}
            <div className="flex items-center gap-4">
              {locationLogo ? (
                <img
                  src={locationLogo}
                  alt={`${orderData.businessName} logo`}
                  className="h-16 w-auto object-contain flex-shrink-0 rounded"
                  style={{ border: `1px solid ${SECONDARY}` }}
                />
              ) : (
                <div
                  className="h-14 w-14 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {orderData.businessName?.charAt(0)}
                </div>
              )}
            </div>

            {/* Right: document title + company details */}
            <div className="lg:text-right">
              <h2
                className="text-3xl lg:text-4xl font-light tracking-wide mb-2"
                style={{ color: PRIMARY }}
              >
                DELIVERY NOTE
              </h2>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-800">
                  {orderData.businessName}
                </p>
                {orderData.locationAddress && (
                  <p>{orderData.locationAddress}</p>
                )}
                {orderData.locationDetails?.street && (
                  <p>{orderData.locationDetails.street}</p>
                )}
                {orderData.locationCity && <p>{orderData.locationCity}</p>}
                {orderData.locationPhone && (
                  <p>Mobile: {orderData.locationPhone}</p>
                )}
                {orderData.locationDetails?.email && (
                  <p>{orderData.locationDetails.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="mx-6 lg:mx-10"
            style={{ height: 1, backgroundColor: SECONDARY }}
          />

          {/* ── DELIVER TO + META TABLE ── */}
          <div className="px-6 lg:px-10 py-6 flex flex-col lg:flex-row justify-between gap-6">
            {/* Deliver To */}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                Deliver To
              </p>
              <div className="text-sm text-gray-700 space-y-0.5">
                {orderData.customerName ? (
                  <p className="font-semibold text-gray-900">
                    {orderData.customerName}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No customer name</p>
                )}
                {orderData.customerPhoneNumber && (
                  <p>{orderData.customerPhoneNumber}</p>
                )}
                {orderData.customerEmail && <p>{orderData.customerEmail}</p>}
                {orderData.customerTinNumber && (
                  <p>TIN: {orderData.customerTinNumber}</p>
                )}
                <p className="pt-1">
                  <span className="font-medium text-gray-900">
                    Delivery Address:{" "}
                  </span>
                  {deliveryAddress}
                </p>
              </div>
            </div>

            {/* Meta table */}
            <div className="w-full lg:w-72">
              <table className="w-full text-sm">
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 pr-4">
                      Order #:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {orderData.orderNumber}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 pr-4">
                      Order Date:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {formatDisplayDate(orderData.openedDate)}
                    </td>
                  </tr>
                  {orderData.closedDate && (
                    <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                      <td className="py-2 font-semibold text-gray-700 pr-4">
                        Closed Date:
                      </td>
                      <td className="py-2 text-gray-900 text-right">
                        {formatDisplayDate(orderData.closedDate)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 pr-4">
                      Prepared By:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {orderData.assignedToName || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-semibold text-gray-700 pr-4">
                      Dispatched By:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {orderData.finishedByName || "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── ITEMS TABLE — desktop ── */}
          <div className="hidden lg:block px-10 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: PRIMARY }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white w-10">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Item Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white w-28">
                    Qty Ordered
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white w-28">
                    Qty Delivered
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white w-36">
                    Condition
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderData.items.map((item: OrderItems, index: number) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#ffffff" : `${SECONDARY}40`,
                      borderBottom: `1px solid ${SECONDARY}`,
                    }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.name.split(" - ").pop()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center font-medium">
                      {item.quantity}
                    </td>
                    {/* Blank — manual fill on printed copy */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-block w-16"
                        style={{ borderBottom: "1.5px dashed #9ca3af" }}
                      >
                        &nbsp;
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block w-24"
                        style={{ borderBottom: "1.5px dashed #9ca3af" }}
                      >
                        &nbsp;
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-sm font-semibold text-right"
                  >
                    Total Items:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-center">
                    {totalQty}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── ITEMS CARDS — mobile ── */}
          <div className="lg:hidden px-4 mb-6 space-y-3">
            <div
              className="flex justify-between items-center px-4 py-2 rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: PRIMARY }}
            >
              <span>Item Description</span>
              <span>Qty</span>
            </div>
            {orderData.items.map((item: OrderItems, index: number) => (
              <div
                key={index}
                className="rounded-lg p-4"
                style={{
                  border: `1px solid ${SECONDARY}`,
                  backgroundColor:
                    index % 2 === 0 ? "#ffffff" : `${SECONDARY}20`,
                }}
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <p className="text-sm font-medium text-gray-900 flex-1">
                    <span className="text-gray-400 mr-1">{index + 1}.</span>
                    {item.name.split(" - ").pop()}
                  </p>
                  <span
                    className="text-sm font-bold whitespace-nowrap"
                    style={{ color: PRIMARY }}
                  >
                    {item.quantity} ordered
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Qty Delivered
                    </p>
                    <div
                      className="h-8 rounded"
                      style={{ border: `1px dashed #9ca3af` }}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Condition
                    </p>
                    <div
                      className="h-8 rounded"
                      style={{ border: `1px dashed #9ca3af` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {/* Total */}
            <div
              className="flex justify-between items-center px-4 py-3 rounded-lg font-semibold text-sm"
              style={{ backgroundColor: PRIMARY_LIGHT }}
            >
              <span style={{ color: PRIMARY }}>Total Items:</span>
              <span style={{ color: PRIMARY }}>{totalQty}</span>
            </div>
          </div>

          {/* ── Notes ── */}
          {orderData.comment && (
            <div className="px-6 lg:px-10 mb-6">
              <div
                className="rounded-lg p-4"
                style={{
                  border: `1px solid ${SECONDARY}`,
                  backgroundColor: `${SECONDARY}40`,
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: PRIMARY }}
                >
                  Notes
                </p>
                <p className="text-sm text-gray-600">{orderData.comment}</p>
              </div>
            </div>
          )}

          {/* ── Signature Block ── */}
          <div className="px-6 lg:px-10 mb-8">
            <div
              className="rounded-lg p-5"
              style={{ border: `1px solid ${SECONDARY}` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-5">
                Acknowledgement
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Delivered By */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Delivered By
                    </p>
                    <p className="text-sm text-gray-800">
                      {(orderData as any).driverName || (
                        <span className="text-gray-300">
                          ___________________________
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="pt-6">
                    <div
                      className="w-full mb-1"
                      style={{ borderBottom: `2px solid #d1d5db` }}
                    />
                    <p className="text-xs text-gray-400">Signature & Date</p>
                  </div>
                </div>

                {/* Received By */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Received By
                    </p>
                    <p className="text-sm text-gray-300 italic">
                      ___________________________
                    </p>
                  </div>
                  <div className="pt-6">
                    <div
                      className="w-full mb-1"
                      style={{ borderBottom: `2px solid #d1d5db` }}
                    />
                    <p className="text-xs text-gray-400">Signature & Date</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div
            className="px-6 lg:px-10 py-6 flex flex-col lg:flex-row justify-between items-start gap-4"
            style={{ borderTop: `1px solid ${SECONDARY}` }}
          >
            <div className="text-sm text-gray-500 space-y-0.5">
              <p className="font-bold text-gray-800 text-sm">Notes / Terms</p>
              <p>
                Delivery note generated on{" "}
                {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>

          <div
            className="px-6 lg:px-10 mb-8 justify-center items-center"
            style={{ borderTop: `1px solid ${SECONDARY}` }}
          >
            <div className="text-left lg:text-center flex-shrink-0 mt-2">
              <p className="text-sm font-semibold text-gray-400">
                Thank you for your business and continued support
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Powered by Settlo Technologies
              </p>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="hidden lg:block">
          <div className="flex justify-center items-center mt-6 mb-4 gap-3">
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
