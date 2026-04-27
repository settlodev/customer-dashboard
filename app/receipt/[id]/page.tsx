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

  // Single source of truth — used for layout choice, button label, and download type
  const isEfd = Boolean(orderData.efdPrinted && efdData);

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

  const formatEfdDate = (dateStr: string | number | Date) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatEfdTime = (dateStr: string | number | Date) => {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatEfdDateTime = (dateStr: string | number | Date) => {
    if (!dateStr) return "—";
    return `${formatEfdDate(dateStr)} ${formatEfdTime(dateStr)}`;
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

  // Build QR code URL from TRA verification URL (only meaningful when EFD)
  const verificationUrl = efdData?.data?.traReceiptVerificationUrl
    ? efdData.data.traReceiptVerificationUrl.startsWith("http")
      ? efdData.data.traReceiptVerificationUrl
      : `https://${efdData.data.traReceiptVerificationUrl}`
    : "";
  const qrCodeUrl = verificationUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        verificationUrl,
      )}`
    : "";

  // ============================================================
  // EFD RECEIPT LAYOUT (TRA-compliant style)
  // ============================================================
  if (isEfd && efdData) {
    const dottedBorder = { borderTop: "1px dashed #999" };

    return (
      <div
        className="min-h-screen py-4 px-2 sm:py-8 sm:px-6"
        style={{ backgroundColor: "#EAEAE5" }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            id="receipt-content"
            className="bg-white shadow-sm mx-auto overflow-hidden"
            style={{ maxWidth: "420px", pageBreakInside: "avoid" }}
          >
            {/* HEADER: Business info (centered) */}
            <div className="px-6 pt-6 pb-3 text-center">
              {locationLogo && (
                <img
                  src={locationLogo}
                  alt={`${orderData.businessName} logo`}
                  className="h-16 w-auto object-contain mx-auto mb-3"
                />
              )}
              <h1 className="text-base font-bold tracking-wide text-gray-900 uppercase">
                {efdData.clientInformation?.businessName ||
                  orderData.businessName}
              </h1>
              <div className="text-[11px] text-gray-800 mt-2 space-y-0.5">
                {efdData.vfdInformation?.mobile && (
                  <p>
                    <span className="font-bold">MOBILE:</span>{" "}
                    {efdData.vfdInformation.mobile}
                  </p>
                )}
                {efdData.vfdInformation?.tin && (
                  <p>
                    <span className="font-bold">TIN:</span>{" "}
                    {efdData.vfdInformation.tin}
                  </p>
                )}
                {efdData.vfdInformation?.vrn && (
                  <p>
                    <span className="font-bold">VRN:</span>{" "}
                    {efdData.vfdInformation.vrn}
                  </p>
                )}
                {efdData.vfdInformation?.uin && (
                  <p>
                    <span className="font-bold">UIN:</span>{" "}
                    {efdData.vfdInformation.uin}
                  </p>
                )}
                {efdData.vfdInformation?.taxOffice && (
                  <p>
                    <span className="font-bold">TAX OFFICE:</span>{" "}
                    {efdData.vfdInformation.taxOffice}
                  </p>
                )}
                {efdData.vfdInformation?.physicalAddress && (
                  <p>
                    <span className="font-bold">ADDRESS:</span>{" "}
                    {efdData.vfdInformation.physicalAddress}
                  </p>
                )}
                {efdData.vfdInformation?.street && (
                  <p>{efdData.vfdInformation.street}</p>
                )}
              </div>
            </div>

            {/* CUSTOMER INFO (only if present) */}
            {hasCustomerInfo && (
              <div className="px-6 py-3" style={dottedBorder}>
                <div className="text-[11px] text-gray-800 space-y-0.5">
                  {orderData.customerName && (
                    <p>
                      <span className="font-bold">CUSTOMER NAME:</span>{" "}
                      {orderData.customerName}
                    </p>
                  )}
                  {orderData.customerTinNumber && (
                    <>
                      <p>
                        <span className="font-bold">CUSTOMER ID TYPE:</span>{" "}
                        TAXPAYER IDENTIFICATION NUMBER
                      </p>
                      <p>
                        <span className="font-bold">CUSTOMER ID:</span>{" "}
                        {orderData.customerTinNumber}
                      </p>
                    </>
                  )}
                  {orderData.customerPhoneNumber && (
                    <p>
                      <span className="font-bold">CUSTOMER MOBILE:</span>{" "}
                      {orderData.customerPhoneNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* RECEIPT META */}
            <div className="px-6 py-3" style={dottedBorder}>
              <div className="text-[11px] text-gray-800 space-y-0.5">
                <p>
                  <span className="font-bold">RECEIPT NO:</span>{" "}
                  {orderData.orderNumber}
                </p>
                {efdData.data?.zNum && (
                  <p>
                    <span className="font-bold">Z NUMBER:</span>{" "}
                    {efdData.data.zNum}/{efdData.data.rctNum || ""}
                  </p>
                )}
                <p>
                  <span className="font-bold">RECEIPT DATE:</span>{" "}
                  {formatEfdDate(
                    efdData.data?.dateTime || orderData.closedDate,
                  )}
                </p>
                <p>
                  <span className="font-bold">RECEIPT TIME:</span>{" "}
                  {formatEfdTime(
                    efdData.data?.dateTime || orderData.closedDate,
                  )}
                </p>
              </div>
            </div>

            {/* ORDER DETAILS */}
            <div className="px-6 py-3" style={dottedBorder}>
              <p className="text-[11px] font-bold text-gray-900 mb-1.5 tracking-wide">
                ORDER DETAILS
              </p>
              <div className="text-[11px] text-gray-800 space-y-0.5">
                <p>
                  <span className="font-bold">ORDER NO:</span>{" "}
                  {orderData.orderNumber}
                </p>
                {orderData.startedByName && (
                  <p>
                    <span className="font-bold">SERVED BY:</span>{" "}
                    {orderData.startedByName}
                  </p>
                )}
                {orderData.finishedByName &&
                  orderData.finishedByName !== orderData.startedByName && (
                    <p>
                      <span className="font-bold">CLOSED BY:</span>{" "}
                      {orderData.finishedByName}
                    </p>
                  )}
                {orderData.openedDate && (
                  <p>
                    <span className="font-bold">OPENED:</span>{" "}
                    {formatEfdDateTime(orderData.openedDate)}
                  </p>
                )}
                {orderData.closedDate && (
                  <p>
                    <span className="font-bold">CLOSED:</span>{" "}
                    {formatEfdDateTime(orderData.closedDate)}
                  </p>
                )}
              </div>
            </div>

            {/* ITEMS HEADING */}
            <div className="px-6 pt-4 pb-2" style={dottedBorder}>
              <h2 className="text-lg font-bold text-gray-900">Items</h2>
            </div>

            {/* ITEMS TABLE */}
            <div className="px-6 pb-3">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-gray-800 border-b border-gray-300">
                    <th className="py-2 text-left font-bold">Description</th>
                    <th className="py-2 text-center font-bold">Qty</th>
                    <th className="py-2 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items.map((item: OrderItems, index: number) => (
                    <tr key={index} className="text-gray-900">
                      <td className="py-2 pr-2 uppercase">{item.name}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        {Number(item.totalPrice).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS */}
            <div className="px-6 py-3" style={dottedBorder}>
              <div className="text-[11px] text-gray-900 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold">TOTAL EXCL OF TAX:</span>
                  <span>
                    {Number(efdData.totals?.totalTaxExcl || 0).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                </div>
                {efdData.totals?.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-bold">DISCOUNT:</span>
                    <span>
                      -
                      {Number(efdData.totals.discount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {efdData.vatTotals?.map((vat: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span className="font-bold">
                      VAT{" "}
                      {vat.vatRate === "A"
                        ? "18%"
                        : vat.vatRate === "B"
                          ? "0%"
                          : vat.vatRate}
                      :
                    </span>
                    <span>
                      {Number(vat.taxAmount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="font-bold">TOTAL TAX:</span>
                  <span>
                    {Number(efdData.totals?.totalTax || 0).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-400 pt-1.5">
                  <span>TOTAL INCL OF TAX:</span>
                  <span>
                    {Number(
                      efdData.totals?.totalTaxIncl || orderData.netAmount,
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {efdData.payments && (
                  <div className="flex justify-between pt-1">
                    <span className="font-bold">
                      PAID BY {efdData.payments.pmtType || "CASH"}:
                    </span>
                    <span>
                      {Number(
                        efdData.payments.pmtAmount || orderData.paidAmount,
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-bold">ITEMS NUMBER:</span>
                  <span>{orderData.items.length}</span>
                </div>
              </div>
            </div>

            {/* VERIFICATION CODE + QR */}
            <div className="px-6 py-4 text-center" style={dottedBorder}>
              <p className="text-[11px] font-bold text-gray-900 mb-1">
                RECEIPT VERIFICATION CODE
              </p>
              {efdData.data?.traReceiptVerificationCode && (
                <p className="text-base font-bold text-gray-900 mb-3 tracking-wider">
                  {efdData.data.traReceiptVerificationCode}
                </p>
              )}

              {qrCodeUrl && (
                <div className="flex justify-center my-3">
                  <img
                    src={qrCodeUrl}
                    alt="TRA Receipt Verification QR Code"
                    width={160}
                    height={160}
                    className="border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="px-6 pb-6 pt-3 text-center" style={dottedBorder}>
              <p className="text-[12px] font-bold text-gray-900 tracking-wide">
                *** END OF LEGAL RECEIPT ***
              </p>
              <p className="text-[9px] font-semibold text-black mt-3">
                Powered by Settlo Technologies
              </p>
            </div>
          </div>

          {/* Action buttons (EFD) */}
          {!isDownloadable && (
            <div className="flex justify-center items-center mt-6 mb-4 gap-3">
              <DownloadButton
                title="Download EFD Receipt"
                orderNumber={orderData.orderNumber}
                isDownloadable={isDownloadable === "1"}
                isEfd={true}
                fontSize={{ header: "14px", body: "10px", footer: "8px" }}
              />
              <ShareButton url={orderUrl} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // NON-EFD RECEIPT (modern card design)
  // ============================================================
  return (
    <div
      className="min-h-screen py-4 px-2 sm:py-8 sm:px-6"
      style={{ backgroundColor: "#EAEAE5" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Desktop: EFD Generate button */}
        <div className="hidden lg:flex justify-end items-end mr-12 mb-4">
          {!orderData.efdPrinted && (
            <GenerateEfdButton orderId={id} location={location} />
          )}
        </div>

        {/* RECEIPT CARD */}
        <div
          id="receipt-content"
          className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
          style={{ maxWidth: "794px", pageBreakInside: "avoid" }}
        >
          {/* TOP HEADER: Logo left · Doc title right */}
          <div className="px-4 pt-4 pb-3 lg:px-10 lg:pt-10 lg:pb-6 flex flex-row justify-between items-start gap-3">
            <div className="flex items-center gap-3">
              {locationLogo ? (
                <img
                  src={locationLogo}
                  alt={`${orderData.businessName} logo`}
                  className="h-16 lg:h-32 w-auto object-contain flex-shrink-0 rounded-lg"
                />
              ) : (
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0" />
              )}
            </div>

            <div className="text-right">
              <h2
                className="text-xl lg:text-4xl font-light tracking-wide mb-0.5"
                style={{ color: "#EB7F44" }}
              >
                {docType}
              </h2>

              <div className="text-[10px] lg:text-sm text-gray-600 space-y-0 mt-1">
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

          {/* DIVIDER */}
          <div
            className="mx-4 lg:mx-10"
            style={{ height: "1px", backgroundColor: "#EAEAE5" }}
          />

          {/* BILL TO + INVOICE META */}
          <div className="px-4 py-3 lg:px-10 lg:py-6 flex flex-col lg:flex-row justify-between gap-3 lg:gap-6">
            <div className="flex-1">
              {hasCustomerInfo ? (
                <>
                  <p className="text-[9px] lg:text-xs uppercase tracking-widest text-gray-400 mb-1">
                    Bill To
                  </p>
                  <div className="text-[10px] lg:text-sm text-gray-700 space-y-0">
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
                <div aria-hidden="true" />
              )}
            </div>

            <div className="w-full lg:w-72">
              <table className="w-full text-[10px] lg:text-sm">
                <tbody>
                  <tr style={{ borderBottom: "1px solid #EAEAE5" }}>
                    <td className="py-1 lg:py-2 font-semibold text-gray-700 pr-2">
                      {isPaid ? "Receipt" : "Invoice"} No:
                    </td>
                    <td className="py-1 lg:py-2 text-gray-900 text-right">
                      {orderData.orderNumber}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #EAEAE5" }}>
                    <td className="py-1 lg:py-2 font-semibold text-gray-700 pr-2">
                      Date:
                    </td>
                    <td className="py-1 lg:py-2 text-gray-900 text-right">
                      {formatDisplayDate(orderData.openedDate)}
                    </td>
                  </tr>
                  {orderData.closedDate && (
                    <tr style={{ borderBottom: "1px solid #EAEAE5" }}>
                      <td className="py-1 lg:py-2 font-semibold text-gray-700 pr-2">
                        Closed:
                      </td>
                      <td className="py-1 lg:py-2 text-gray-900 text-right">
                        {formatDisplayDate(orderData.closedDate)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: "1px solid #EAEAE5" }}>
                    <td className="py-1 lg:py-2 font-semibold text-gray-700 pr-2">
                      Staff:
                    </td>
                    <td className="py-1 lg:py-2 text-gray-900 text-right">
                      {orderData.assignedToName}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 lg:py-2 font-semibold text-gray-700 pr-2">
                      Due (TZS):
                    </td>
                    <td
                      className="py-1 lg:py-2 font-bold text-right"
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

              <div className="mt-2 flex flex-wrap gap-1.5 lg:gap-2 lg:justify-end">
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] lg:text-xs font-semibold"
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
              </div>
            </div>
          </div>

          {/* ITEMS TABLE — desktop */}
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

          {/* ITEMS — mobile compact table */}
          <div className="lg:hidden px-3 mb-4">
            <table className="w-full text-[10px]">
              <thead>
                <tr style={{ backgroundColor: "#EB7F44" }}>
                  <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-white rounded-tl w-1/2">
                    Item
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-wide text-white">
                    Qty
                  </th>
                  <th className="px-2 py-1.5 text-right font-semibold uppercase tracking-wide text-white">
                    Price
                  </th>
                  <th className="px-2 py-1.5 text-right font-semibold uppercase tracking-wide text-white rounded-tr">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderData.items.map((item: OrderItems, index: number) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#ffffff" : "#EAEAE530",
                      borderBottom: "1px solid #EAEAE5",
                    }}
                  >
                    <td className="px-2 py-1.5 text-gray-900">
                      <span className="text-gray-400 mr-1">{index + 1}.</span>
                      {item.name}
                    </td>
                    <td className="px-2 py-1.5 text-gray-600 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-2 py-1.5 text-gray-600 text-right whitespace-nowrap">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-2 py-1.5 font-medium text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS */}
          <div className="px-4 lg:px-10 mb-4 lg:mb-6">
            <div className="flex justify-end">
              <div className="w-full lg:max-w-xs">
                <div className="text-[10px] lg:text-sm">
                  <div
                    className="flex justify-between text-gray-600 py-1 lg:py-2"
                    style={{ borderBottom: "1px solid #EAEAE5" }}
                  >
                    <span>Subtotal:</span>
                    <span>{formatCurrency(orderData.grossAmount)}</span>
                  </div>
                  {orderData.totalDiscount > 0 && (
                    <div
                      className="flex justify-between text-gray-600 py-1 lg:py-2"
                      style={{ borderBottom: "1px solid #EAEAE5" }}
                    >
                      <span>Discount:</span>
                      <span>-{formatCurrency(orderData.totalDiscount)}</span>
                    </div>
                  )}
                  <div
                    className="flex justify-between font-bold py-1 lg:py-2"
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
                        className="flex justify-between text-gray-600 py-1 lg:py-2"
                        style={{ borderBottom: "1px solid #EAEAE5" }}
                      >
                        <span>Via {method}:</span>
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
                      className="flex justify-between text-gray-600 py-1 lg:py-2"
                      style={{ borderBottom: "1px solid #EAEAE5" }}
                    >
                      <span>
                        Via{" "}
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
                    className="flex justify-between font-bold py-2 mt-1 rounded px-2 lg:px-3"
                    style={{ backgroundColor: "#F2942233" }}
                  >
                    <span style={{ color: "#EB7F44" }}>Amount Due (TZS):</span>
                    <span style={{ color: "#EB7F44" }}>
                      {formatCurrency(
                        orderData.unpaidAmount ??
                          orderData.netAmount - orderData.paidAmount,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NOTES / TERMS */}
          <div
            className="px-4 lg:px-10 pt-3 lg:pt-6 pb-3 lg:pb-4 flex flex-col lg:flex-row justify-between items-start gap-3 lg:gap-6"
            style={{ borderTop: "1px solid #EAEAE5" }}
          >
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-[10px] lg:text-sm mb-0.5">
                Notes / Terms
              </p>

              {orderData.digitalReceiptPaymentDetails?.length > 0 ? (
                <div className="text-[10px] lg:text-sm text-gray-600 space-y-0 leading-snug">
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
                <div className="text-[10px] lg:text-sm text-gray-600">
                  <p>
                    {isPaid ? "Receipt" : "Invoice"} generated on{" "}
                    {formatDate(new Date().toISOString())}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-4 lg:px-10 pb-5 lg:pb-8 pt-2 lg:pt-4 text-center">
            <p className="text-[10px] lg:text-sm font-semibold">
              Thank you for your business and continued support
            </p>
            <p className="text-[9px] lg:text-xs text-gray-400 mt-0.5">
              Powered by Settlo Technologies
            </p>
          </div>
        </div>

        {/* Desktop action buttons (non-EFD) */}
        <div className="hidden lg:block">
          {!isDownloadable && (
            <div className="flex justify-center items-center mt-6 mb-4 gap-3">
              <DownloadButton
                title="Download PDF"
                orderNumber={orderData.orderNumber}
                isDownloadable={isDownloadable === "1"}
                isEfd={false}
                fontSize={{ header: "16px", body: "11px", footer: "9px" }}
              />
              <ShareButton url={orderUrl} />
            </div>
          )}
        </div>

        {/* Mobile EFD Generate button */}
        <div className="w-full lg:hidden mt-3">
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
