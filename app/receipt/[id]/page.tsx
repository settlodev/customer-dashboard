import { getOrderReceipt, isEfdPrinted } from "@/lib/actions/order-actions";
import { OrderItems } from "@/types/orders/type";
import DownloadButton from "@/components/widgets/download-button";
import ShareButton from "@/components/widgets/share-button";
import GenerateEfdButton from "@/components/widgets/generate-efd-button";

type Params = Promise<{
  id: string;
  download?: string;
}>;

type SearchParams = Promise<{
  location?: string;
  [key: string]: string | string[] | undefined;
}>;

const OrderReceipt = async ({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { id, download } = resolvedParams;

  const orderData = await getOrderReceipt(id);
  const location = resolvedSearchParams.location || orderData.location;

  let efdData = null;
  if (orderData.efdPrinted) {
    efdData = await isEfdPrinted(id, location);
  }

  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/receipt/${orderData.id}`;
  const isDownloadable = download;

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

  const formatDisplayDate = (dateStr: string | number | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: string | number | bigint) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const uniqueMethods = Array.from(
    new Set(
      orderData.transactions
        ?.map((t: { paymentMethodName: string }) => t.paymentMethodName)
        .filter(Boolean),
    ),
  ) as string[];

  const hasCustomerInfo =
    orderData.customerName ||
    orderData.customerPhoneNumber ||
    orderData.customerTinNumber;

  const locationLogo =
    orderData.locationDetails?.logo || orderData.locationDetails?.image;

  const isPaid = orderData.paidAmount === orderData.amount;
  const docType = isPaid ? "RECEIPT" : "INVOICE";

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6"
      style={{ backgroundColor: "#EAEAE5" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Desktop: EFD Generate button */}
        <div className="hidden lg:flex justify-end items-end mr-12 mb-4">
          {!orderData.efdPrinted && (
            <GenerateEfdButton orderId={id} location={location} />
          )}
        </div>

        {/* ── RECEIPT CARD ── */}
        <div
          id="receipt-content"
          className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
          style={{ maxWidth: "794px", pageBreakInside: "avoid" }}
        >
          {/* ── TOP HEADER: Logo left · Doc title right ── */}
          <div className="px-6 lg:px-10 pt-8 lg:pt-10 pb-6 flex flex-col lg:flex-row justify-between items-start gap-6">
            {/* Left: Logo + Business name */}
            <div className="flex items-center gap-4">
              {locationLogo ? (
                <img
                  src={locationLogo}
                  alt={`${orderData.businessName} logo`}
                  className="h-14 lg:h-16 w-auto object-contain flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0"></div>
              )}
            </div>

            {/* Right: Document type + company details */}
            <div className="lg:text-right w-full lg:w-auto">
              <h2
                className="text-3xl lg:text-4xl font-light tracking-wide mb-1"
                style={{ color: "#EB7F44" }}
              >
                {docType}
              </h2>

              {orderData.efdPrinted && efdData ? (
                <div className="text-sm text-gray-600 space-y-0.5 mt-2">
                  {efdData.vfdInformation?.tin && (
                    <p className="font-semibold text-gray-800">
                      TIN: {efdData.vfdInformation.tin}
                    </p>
                  )}
                  <p className="font-semibold text-gray-800">
                    {efdData.clientInformation?.businessName ||
                      orderData.businessName}
                  </p>
                  <p>
                    {efdData.vfdInformation?.physicalAddress ||
                      orderData.locationAddress}
                  </p>
                  {efdData.vfdInformation?.street && (
                    <p>{efdData.vfdInformation.street}</p>
                  )}
                  <p>{orderData.locationCity}</p>
                  {efdData.vfdInformation?.mobile && (
                    <p>Mobile: {efdData.vfdInformation.mobile}</p>
                  )}
                  {efdData.vfdInformation?.uin && (
                    <p>UIN: {efdData.vfdInformation.uin}</p>
                  )}
                  {efdData.vfdInformation?.vrn && (
                    <p>VRN: {efdData.vfdInformation.vrn}</p>
                  )}
                  {efdData.vfdInformation?.taxOffice && (
                    <p>Tax Office: {efdData.vfdInformation.taxOffice}</p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-600 space-y-0.5 mt-2">
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
              )}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div
            className="mx-6 lg:mx-10"
            style={{ height: "1px", backgroundColor: "#EAEAE5" }}
          />

          {/* ── BILL TO + INVOICE META ── */}
          {/* Always render the two-column layout regardless of whether
              customer info exists. Left column shows customer details or
              stays empty; right column always shows the meta table. This
              ensures consistent alignment between receipts with and without
              a customer attached. */}
          <div className="px-6 lg:px-10 py-6 flex flex-col lg:flex-row justify-between gap-6">
            {/* Left column — always present to hold the layout */}
            <div className="flex-1">
              {hasCustomerInfo ? (
                <>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                    Bill To
                  </p>
                  <div className="text-sm text-gray-700 space-y-0.5">
                    {orderData.customerName && (
                      <p className="font-semibold text-gray-900">
                        {orderData.customerName}
                      </p>
                    )}
                    {orderData.customerPhoneNumber && (
                      <p>{orderData.customerPhoneNumber}</p>
                    )}
                    {orderData.customerEmail && (
                      <p>{orderData.customerEmail}</p>
                    )}
                    {orderData.customerTinNumber && (
                      <p>TIN: {orderData.customerTinNumber}</p>
                    )}
                  </div>
                </>
              ) : (
                /* Empty placeholder keeps the meta table right-aligned */
                <div aria-hidden="true" />
              )}
            </div>

            {/* Right column — meta table, always right-aligned */}
            <div className="w-full lg:w-72">
              <table className="w-full text-sm">
                <tbody>
                  <tr style={{ borderBottom: "1px solid #EAEAE5" }}>
                    <td className="py-2 font-semibold text-gray-700 pr-4">
                      {isPaid ? "Receipt" : "Invoice"} Number:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {orderData.orderNumber}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #EAEAE5" }}>
                    <td className="py-2 font-semibold text-gray-700 pr-4">
                      {isPaid ? "Receipt" : "Invoice"} Date:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {formatDisplayDate(orderData.openedDate)}
                    </td>
                  </tr>
                  {orderData.closedDate && (
                    <tr style={{ borderBottom: "1px solid #EAEAE5" }}>
                      <td className="py-2 font-semibold text-gray-700 pr-4">
                        Closed Date:
                      </td>
                      <td className="py-2 text-gray-900 text-right">
                        {formatDisplayDate(orderData.closedDate)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: "1px solid #EAEAE5" }}>
                    <td className="py-2 font-semibold text-gray-700 pr-4">
                      Staff Assigned:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {orderData.assignedToName}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-semibold text-gray-700 pr-4">
                      Amount Due (TZS):
                    </td>
                    <td
                      className="py-2 font-bold text-right"
                      style={{ color: "#EB7F44" }}
                    >
                      {formatCurrency(
                        orderData.unpaidAmount ??
                          orderData.netAmount - orderData.paidAmount,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Status badges */}
              <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={
                    orderData.orderPaymentStatus === "PAID"
                      ? { backgroundColor: "#F2942233", color: "#EB7F44" }
                      : { backgroundColor: "#EAEAE5", color: "#6b7280" }
                  }
                >
                  {orderData.orderPaymentStatus === "NOT_PAID"
                    ? "NOT PAID"
                    : "PAID"}
                </span>
                {orderData.efdPrinted && efdData && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "#F2942233", color: "#EB7F44" }}
                  >
                    EFD RECEIPT
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── ITEMS TABLE — desktop ── */}
          <div className="hidden lg:block px-10 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#EB7F44" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white rounded-tl">
                    Items
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white rounded-tr">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderData.items.map((item: OrderItems, index: number) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#ffffff" : "#EAEAE540",
                      borderBottom: "1px solid #EAEAE5",
                    }}
                  >
                    <td className="px-4 py-3 text-gray-900">
                      <span className="text-gray-400 mr-2">{index + 1}.</span>
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-right">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 text-right">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── ITEMS CARDS — mobile ── */}
          <div className="lg:hidden px-4 mb-6 space-y-3">
            <div
              className="flex justify-between items-center px-4 py-2 rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "#EB7F44" }}
            >
              <span>Items</span>
              <span>Amount</span>
            </div>

            {orderData.items.map((item: OrderItems, index: number) => (
              <div
                key={index}
                className="rounded-lg p-4"
                style={{
                  border: "1px solid #EAEAE5",
                  backgroundColor: index % 2 === 0 ? "#ffffff" : "#EAEAE520",
                }}
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <p className="text-sm font-medium text-gray-900 flex-1">
                    <span className="text-gray-400 mr-1">{index + 1}.</span>
                    {item.name}
                  </p>
                  <p
                    className="text-sm font-bold text-gray-900 whitespace-nowrap"
                    style={{ color: "#EB7F44" }}
                  >
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>
                    <span className="font-medium text-gray-700">Qty:</span>{" "}
                    {item.quantity}
                  </span>
                  <span>
                    <span className="font-medium text-gray-700">
                      Unit price:
                    </span>{" "}
                    {formatCurrency(item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── TOTALS ── */}
          <div className="px-6 lg:px-10 mb-6">
            <div className="flex justify-end">
              <div className="w-full lg:max-w-xs">
                {orderData.efdPrinted && efdData ? (
                  /* EFD Totals */
                  <div>
                    {efdData.vatTotals?.map((vat: any, index: number) => (
                      <div key={index}>
                        <div
                          className="flex justify-between text-sm text-gray-600 py-2"
                          style={{ borderBottom: "1px solid #EAEAE5" }}
                        >
                          <span>
                            VAT{" "}
                            {vat.vatRate === "A"
                              ? "18%"
                              : vat.vatRate === "B"
                                ? "0%"
                                : vat.vatRate}
                            :
                          </span>
                          <span>{formatCurrency(vat.taxAmount)}</span>
                        </div>
                        <div
                          className="flex justify-between text-sm text-gray-600 py-2"
                          style={{ borderBottom: "1px solid #EAEAE5" }}
                        >
                          <span>Net Amount:</span>
                          <span>{formatCurrency(vat.nettAmount)}</span>
                        </div>
                      </div>
                    ))}
                    {efdData.totals && (
                      <>
                        <div
                          className="flex justify-between text-sm text-gray-600 py-2"
                          style={{ borderBottom: "1px solid #EAEAE5" }}
                        >
                          <span>Total (Excl. Tax):</span>
                          <span>
                            {formatCurrency(efdData.totals.totalTaxExcl)}
                          </span>
                        </div>
                        <div
                          className="flex justify-between text-sm text-gray-600 py-2"
                          style={{ borderBottom: "1px solid #EAEAE5" }}
                        >
                          <span>Total Tax:</span>
                          <span>{formatCurrency(efdData.totals.totalTax)}</span>
                        </div>
                        {efdData.totals.discount > 0 && (
                          <div
                            className="flex justify-between text-sm text-gray-600 py-2"
                            style={{ borderBottom: "1px solid #EAEAE5" }}
                          >
                            <span>Discount:</span>
                            <span>
                              -{formatCurrency(efdData.totals.discount)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div
                      className="flex justify-between font-bold py-2"
                      style={{ borderBottom: "1px solid #EAEAE5" }}
                    >
                      <span className="text-gray-900">Total:</span>
                      <span style={{ color: "#EB7F44" }}>
                        {formatCurrency(
                          efdData.totals?.totalTaxIncl || orderData.netAmount,
                        )}
                      </span>
                    </div>
                    {efdData.payments && (
                      <div
                        className="flex justify-between text-sm text-gray-600 py-2"
                        style={{ borderBottom: "1px solid #EAEAE5" }}
                      >
                        <span>
                          Payment via {efdData.payments.pmtType || "CASH"}:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            efdData.payments.pmtAmount || orderData.paidAmount,
                          )}
                        </span>
                      </div>
                    )}
                    <div
                      className="flex justify-between font-bold py-3 mt-1 rounded px-3"
                      style={{ backgroundColor: "#F2942233" }}
                    >
                      <span style={{ color: "#EB7F44" }}>
                        Amount Due (TZS):
                      </span>
                      <span style={{ color: "#EB7F44" }}>
                        {formatCurrency(
                          orderData.unpaidAmount ??
                            orderData.netAmount - orderData.paidAmount,
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Regular Totals */
                  <div>
                    <div
                      className="flex justify-between text-sm text-gray-600 py-2"
                      style={{ borderBottom: "1px solid #EAEAE5" }}
                    >
                      <span>Subtotal:</span>
                      <span>{formatCurrency(orderData.grossAmount)}</span>
                    </div>
                    {orderData.totalDiscount > 0 && (
                      <div
                        className="flex justify-between text-sm text-gray-600 py-2"
                        style={{ borderBottom: "1px solid #EAEAE5" }}
                      >
                        <span>Discount:</span>
                        <span>-{formatCurrency(orderData.totalDiscount)}</span>
                      </div>
                    )}
                    <div
                      className="flex justify-between font-bold py-2"
                      style={{ borderBottom: "1px solid #EAEAE5" }}
                    >
                      <span className="text-gray-900">Total:</span>
                      <span style={{ color: "#EB7F44" }}>
                        {formatCurrency(orderData.netAmount)}
                      </span>
                    </div>

                    {uniqueMethods.length > 1 ? (
                      uniqueMethods.map((method) => (
                        <div
                          key={String(method)}
                          className="flex justify-between text-sm text-gray-600 py-2"
                          style={{ borderBottom: "1px solid #EAEAE5" }}
                        >
                          <span>Payment via {method}:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              orderData.transactions
                                .filter(
                                  (t: { paymentMethodName: string }) =>
                                    t.paymentMethodName === method,
                                )
                                .reduce(
                                  (sum: number, t: { amount: any }) =>
                                    sum + Number(t.amount),
                                  0,
                                ),
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div
                        className="flex justify-between text-sm text-gray-600 py-2"
                        style={{ borderBottom: "1px solid #EAEAE5" }}
                      >
                        <span>
                          Payment via{" "}
                          {orderData.transactions?.[0]?.paymentMethodName ||
                            "N/A"}
                          :
                        </span>
                        <span className="font-medium">
                          {formatCurrency(orderData.paidAmount)}
                        </span>
                      </div>
                    )}

                    <div
                      className="flex justify-between font-bold py-3 mt-1 rounded px-3"
                      style={{ backgroundColor: "#F2942233" }}
                    >
                      <span style={{ color: "#EB7F44" }}>
                        Amount Due (TZS):
                      </span>
                      <span style={{ color: "#EB7F44" }}>
                        {formatCurrency(
                          orderData.unpaidAmount ??
                            orderData.netAmount - orderData.paidAmount,
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── NOTES / TERMS ── */}
          <div
            className="px-6 lg:px-10 pt-6 pb-4 flex flex-col lg:flex-row justify-between items-start gap-6"
            style={{ borderTop: "1px solid #EAEAE5" }}
          >
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm mb-1">
                Notes / Terms
              </p>

              {orderData.digitalReceiptPaymentDetails?.length > 0 ? (
                <div className="text-sm text-gray-600 space-y-0.5 leading-relaxed">
                  {orderData.digitalReceiptPaymentDetails.map(
                    (
                      detail: {
                        id: string;
                        notes?: string;
                        accountNumber?: string;
                        acceptedPaymentMethodTypeName?: string;
                      },
                      idx: number,
                    ) => (
                      <div key={detail.id ?? idx}>
                        {detail.notes &&
                          detail.notes
                            .split("\n")
                            .map((line: string, i: number) => (
                              <p key={i}>{line}</p>
                            ))}
                        {detail.accountNumber && (
                          <p>
                            {detail.acceptedPaymentMethodTypeName
                              ? `${detail.acceptedPaymentMethodTypeName}: `
                              : ""}
                            {detail.accountNumber}
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p>
                    {isPaid ? "Receipt" : "Invoice"} generated on{" "}
                    {formatDate(new Date().toISOString())}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="px-6 lg:px-10 pb-8 pt-4 text-center">
            <p className="text-sm font-semibold">
              Thank you for your business and continued support
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Powered by Settlo Technologies
            </p>
          </div>
        </div>

        {/* Desktop action buttons */}
        <div className="hidden lg:block">
          {!isDownloadable && (
            <div className="flex justify-center items-center mt-6 mb-4 gap-3">
              <DownloadButton
                title={
                  orderData.efdPrinted ? "Download EFD Receipt" : "Download PDF"
                }
                orderNumber={orderData.orderNumber}
                isDownloadable={isDownloadable === "1"}
                fontSize={{ header: "16px", body: "11px", footer: "9px" }}
              />
              <ShareButton url={orderUrl} />
            </div>
          )}
        </div>

        {/* Mobile EFD Generate button */}
        <div className="w-full lg:hidden mt-4">
          {!orderData.efdPrinted && (
            <div className="flex items-center w-full">
              <GenerateEfdButton orderId={id} location={location} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
