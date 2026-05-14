import { UUID } from "node:crypto";
import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { OrdersRealtimeBridge } from "@/components/realtime/orders-realtime-bridge";
import { OrderInvoiceShareButton } from "@/components/widgets/orders/invoice-share-dialog";
import { OrderReceiptShareButton } from "@/components/widgets/orders/receipt-share-dialog";
import { PrintVfdButton } from "@/components/widgets/orders/print-vfd-button";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getOrderDetail } from "@/lib/actions/order-actions";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_PILL,
  OrderStatus,
  PaymentStatus,
} from "@/types/orders/type";
import { OrderDetailView } from "./order-detail-view";

type Params = Promise<{ id: string }>;

export default async function OrderPage({ params }: { params: Params }) {
  const { id } = await params;

  let detail;
  try {
    detail = await getOrderDetail(id as UUID);
  } catch {
    throw new Error("Failed to load order data");
  }
  if (!detail) notFound();

  const currentLocation = await getCurrentLocation();

  const status = detail.orderStatus as OrderStatus;
  const statusClass = ORDER_STATUS_PILL[status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = ORDER_STATUS_LABELS[status] ?? String(status);

  // Title: order #, then customer/staff label so the page is scannable.
  const customerName = detail.customer?.name;
  const headerName = customerName
    ? `${customerName}`
    : detail.assignedTo?.name
      ? `Assigned to ${detail.assignedTo.name}`
      : "Walk-in order";

  const opened = new Date(detail.openedDate);
  const subtitleParts: string[] = [`#${detail.orderNumber}`];
  if (!Number.isNaN(opened.getTime())) {
    subtitleParts.push(
      new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: false,
      }).format(opened),
    );
  }
  if (detail.itemCount) {
    subtitleParts.push(
      `${detail.itemCount} item${detail.itemCount === 1 ? "" : "s"}`,
    );
  }

  // Action gating mirrors the OMS guards on the underlying endpoints
  // — keeping them in sync avoids a button that always toasts an error.
  const paymentStatus = (detail.paymentStatus ?? "").toUpperCase();
  const canShareReceipt =
    paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.PARTIAL;
  const canShareInvoice =
    paymentStatus === PaymentStatus.NOT_PAID && status !== OrderStatus.CANCELLED;
  const canPrintVfd = status === OrderStatus.CLOSED;

  const orderId = detail.id as UUID;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Orders", href: "/orders" },
          { title: `#${detail.orderNumber}` },
        ]}
      />
      <PageHeader
        title={headerName}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
          >
            {statusLabel}
          </span>
        }
        subtitle={subtitleParts.join(" · ")}
        actions={
          canShareReceipt || canShareInvoice || canPrintVfd ? (
            <div className="flex flex-wrap gap-2">
              {canShareInvoice && (
                <OrderInvoiceShareButton
                  orderId={orderId}
                  orderNumber={detail.orderNumber}
                />
              )}
              {canShareReceipt && (
                <OrderReceiptShareButton
                  orderId={orderId}
                  orderNumber={detail.orderNumber}
                />
              )}
              {canPrintVfd && (
                <PrintVfdButton
                  orderId={orderId}
                  orderNumber={detail.orderNumber}
                />
              )}
            </div>
          ) : undefined
        }
      />
      {currentLocation?.id && (
        <OrdersRealtimeBridge
          locationId={currentLocation.id}
          orderId={detail.id as string}
        />
      )}

      <PageBody>
        <OrderDetailView order={detail} />
      </PageBody>
    </PageShell>
  );
}
