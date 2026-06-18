"use server";

import { UUID } from "node:crypto";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";
import { FormResponse } from "@/types/types";
import { CartState } from "@/context/cartContext";
import {
  CashFlow,
  CashFlowDailyPoint,
  Credit,
  Order,
  OrderDetail,
  OrderEvent,
  OrderShareResponse,
  OrderStatus,
  OrderVoidsResponse,
  PublicInvoice,
  ReceiptDto,
  VfdPrintResponse,
} from "@/types/orders/type";
import { revalidatePath } from "next/cache";
import { orderRequestSchema } from "@/types/orders/schema";

import { getCurrentLocation } from "./business/get-current-business";

// ─── Service clients ────────────────────────────────────────────────
// Orders + their detail/timeline live on the OMS. Receipts, EFD, cart
// submission, and reports each still target their own legacy services.

const oms = () => new ApiClient("orders");
const ordersBase = "/api/v1/orders";

// ─── Order list / detail (OMS) ──────────────────────────────────────

export interface ListOrdersParams {
  /** ISO date (yyyy-MM-dd). Lower bound (inclusive) on businessDate. */
  fromDate?: string;
  /** ISO date (yyyy-MM-dd). Upper bound (inclusive) on businessDate. */
  toDate?: string;
  status?: OrderStatus | "";
}

/**
 * Fetches orders from OMS for the active location. The endpoint is
 * unpaginated server-side and scoped to the location pulled from
 * cookies. Filtering by business-date range and status is server-driven;
 * results come back sorted by openedDate DESC.
 */
export const listOrders = async (
  params?: ListOrdersParams,
): Promise<Order[]> => {
  const location = await getCurrentLocation();
  if (!location?.id) return [];

  const qs = new URLSearchParams();
  if (params?.fromDate) qs.set("fromDate", params.fromDate);
  if (params?.toDate) qs.set("toDate", params.toDate);
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString();

  const data = await oms().get<Order[]>(
    `${ordersBase}${query ? `?${query}` : ""}`,
  );
  return parseStringify(data ?? []);
};

const EMPTY_VOIDS_REPORT: OrderVoidsResponse = {
  summary: {
    totalOrders: 0,
    voidedOrders: 0,
    voidedItems: 0,
    voidAmount: 0,
    currency: null,
    reasons: [],
  },
  orders: [],
};

export interface VoidsReportParams {
  fromDate?: string;
  toDate?: string;
  status?: OrderStatus | "";
}

/** Orders with >= 1 voided line item in the range, plus server-computed totals (OMS). */
export const getVoidsReport = async (
  params?: VoidsReportParams,
): Promise<OrderVoidsResponse> => {
  const location = await getCurrentLocation();
  if (!location?.id) return EMPTY_VOIDS_REPORT;

  const qs = new URLSearchParams();
  if (params?.fromDate) qs.set("fromDate", params.fromDate);
  if (params?.toDate) qs.set("toDate", params.toDate);
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString();

  const data = await oms().get<OrderVoidsResponse>(
    `${ordersBase}/voids${query ? `?${query}` : ""}`,
  );
  return parseStringify(data ?? EMPTY_VOIDS_REPORT);
};

export const getOrder = async (id: UUID): Promise<Order | null> => {
  if (!id) return null;
  const data = await oms().get<Order>(`${ordersBase}/${id}`);
  return parseStringify(data);
};

export const getOrderDetail = async (id: UUID): Promise<OrderDetail | null> => {
  if (!id) return null;
  const data = await oms().get<OrderDetail>(`${ordersBase}/${id}/detail`);
  return parseStringify(data);
};

export const getOrderTimeline = async (id: UUID): Promise<OrderEvent[]> => {
  if (!id) return [];
  const data = await oms().get<OrderEvent[]>(`${ordersBase}/${id}/timeline`);
  return parseStringify(data ?? []);
};

export const closeOrder = async (id: UUID): Promise<FormResponse | void> => {
  try {
    await oms().post(`${ordersBase}/${id}/close`, {});
    return SettloErrorHandler.createSuccessResponse("Order closed");
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to close order",
    );
  }
};

export const reopenOrder = async (id: UUID): Promise<FormResponse | void> => {
  try {
    await oms().post(`${ordersBase}/${id}/reopen`, {});
    return SettloErrorHandler.createSuccessResponse("Order reopened");
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to reopen order",
    );
  }
};

export const cancelOrder = async (
  id: UUID,
  reason: string,
  reasonType?: string,
): Promise<FormResponse | void> => {
  try {
    await oms().post(`${ordersBase}/${id}/cancel`, {
      reason,
      reasonType,
    });
    return SettloErrorHandler.createSuccessResponse("Order cancelled");
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to cancel order",
    );
  }
};

// ─── Live invoice share (OMS) ───────────────────────────────────────
//
// The OMS endpoint POST /api/v1/orders/{id}/share is idempotent —
// repeated calls return the same token until revoke. We expose two
// thin wrappers so client components can mint, copy, and revoke
// without touching the API client themselves.

/**
 * Mint (or return the existing) live-invoice share token for an
 * unpaid, non-cancelled order. The customer-facing URL is built on
 * the client side from the returned shareToken.
 */
export const shareOrderInvoice = async (
  id: UUID,
): Promise<
  { shareToken: string; shareTokenIssuedAt: string | null } | { error: string }
> => {
  try {
    const result = await oms().post<OrderShareResponse, Record<string, never>>(
      `${ordersBase}/${id}/share`,
      {},
    );
    revalidatePath(`/orders/${id}`);
    if (!result?.shareToken) {
      return { error: "Share token missing from server response" };
    }
    return parseStringify({
      shareToken: result.shareToken,
      shareTokenIssuedAt: result.shareTokenIssuedAt,
    });
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create invoice share link",
    };
  }
};

export const revokeOrderInvoiceShare = async (
  id: UUID,
): Promise<FormResponse> => {
  try {
    await oms().delete(`${ordersBase}/${id}/share`);
    revalidatePath(`/orders/${id}`);
    return SettloErrorHandler.createSuccessResponse(
      "Invoice share link revoked",
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to revoke invoice share link",
    );
  }
};

/**
 * Public lookup by share token. Unauthenticated — possession of the
 * token IS the capability. Returns null on 404.
 */
export const getPublicInvoice = async (
  token: string,
): Promise<PublicInvoice | null> => {
  try {
    const apiClient = new ApiClient("orders");
    apiClient.isPlain = true;
    const data = await apiClient.get<PublicInvoice>(
      `/api/v1/public/invoices/${encodeURIComponent(token)}`,
    );
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
};

// ─── Receipt snapshots (OMS) ────────────────────────────────────────
//
// Snapshots are immutable point-in-time JSON of the order state, so
// each "Share Receipt" click creates a fresh snapshot for the current
// totals/payments. Use listOrderReceipts to surface the history.

export const createReceiptSnapshot = async (
  id: UUID,
): Promise<{ snapshot: ReceiptDto } | { error: string }> => {
  try {
    const data = await oms().post<ReceiptDto, Record<string, never>>(
      `${ordersBase}/${id}/receipts/receipt`,
      {},
    );
    revalidatePath(`/orders/${id}`);
    return parseStringify({ snapshot: data });
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create receipt snapshot",
    };
  }
};

export const listOrderReceipts = async (id: UUID): Promise<ReceiptDto[]> => {
  try {
    const data = await oms().get<ReceiptDto[]>(`${ordersBase}/${id}/receipts`);
    return parseStringify(data ?? []);
  } catch {
    return [];
  }
};

export const getPublicReceiptSnapshot = async (
  slug: string,
): Promise<ReceiptDto | null> => {
  try {
    const apiClient = new ApiClient("orders");
    apiClient.isPlain = true;
    const data = await apiClient.get<ReceiptDto>(
      `/api/v1/public/receipts/${encodeURIComponent(slug)}`,
    );
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
};

// ─── VFD print (OMS — currently stubbed; backed by Accounting later) ─

export const printOrderVfd = async (
  id: UUID,
): Promise<{ vfd: VfdPrintResponse } | { error: string }> => {
  try {
    const data = await oms().post<VfdPrintResponse, Record<string, never>>(
      `${ordersBase}/${id}/prints/vfd`,
      {},
    );
    revalidatePath(`/orders/${id}`);
    return parseStringify({ vfd: data });
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to print VFD receipt",
    };
  }
};

// ─── Reports (reports service) ──────────────────────────────────────

export const cashFlowReport = async (
  startDate?: Date,
  endDate?: Date,
): Promise<CashFlow | null> => {
  const apiClient = new ApiClient("reports");
  const location = await getCurrentLocation();
  const params = { startDate, endDate };
  const report = await apiClient.get(
    `/api/reports/${location?.id}/cash-flow/summary`,
    { params },
  );
  return parseStringify(report);
};

/**
 * Daily cash-flow series (money in vs out per day) for the cash-flow trend
 * chart. Backed by `GET /api/v2/analytics/cash-flow/daily` (Reports Service);
 * the buckets reconcile with `/api/v2/analytics/overview` totals for the same
 * range. Dates are yyyy-MM-dd. Returns [] on any failure so the page can fall
 * back to a modeled trend.
 */
export const cashFlowDaily = async (
  startDate: string,
  endDate?: string,
): Promise<CashFlowDailyPoint[]> => {
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();
    if (!location?.id) return [];
    const series = await apiClient.get(`/api/v2/analytics/cash-flow/daily`, {
      params: { locationId: location.id, startDate, endDate },
    });
    return parseStringify(series) ?? [];
  } catch (error) {
    console.error("[cashFlowDaily] request failed", error);
    return [];
  }
};

export const creditReport = async (
  startDate?: Date,
  endDate?: Date,
): Promise<Credit | null> => {
  const apiClient = new ApiClient("reports");
  const params = { startDate, endDate };
  const report = await apiClient.get(`/api/v2/analytics/credit/unpaid-orders`, {
    params,
  });
  return parseStringify(report);
};

// ─── Cart submission (legacy order-request service) ─────────────────

export const submitOrderRequest = async (cartState: CartState) => {
  if (!cartState.locationId) {
    const formResponse: FormResponse = {
      responseType: "error",
      message: "Location information is missing. Please refresh and try again.",
      error: new Error("Missing locationId in cart state"),
    };
    console.log("Missing locationId error:", formResponse);
    return parseStringify(formResponse);
  }

  const payload = {
    comment: cartState.globalComment || "",
    customerFirstName: cartState.customerDetails.firstName,
    customerLastName: cartState.customerDetails.lastName,
    customerPhoneNumber: cartState.customerDetails.phoneNumber,
    customerGender: cartState.customerDetails.gender,
    customerEmailAddress: cartState.customerDetails.emailAddress,

    orderRequestItems: cartState.orderRequestitems.map((item) => {
      let variantId = item.variantId;

      if (!variantId && item.variants && item.variants.length > 0) {
        variantId = item.variants[0].id;
      }

      if (!variantId) {
        throw new Error(`Missing variant ID for product: ${item.name}`);
      }

      return {
        quantity: item.quantity,
        comment: item?.comment || "",
        variant: variantId,
        discount: "",
        modifiers: item?.modifiers || [],
        addons: item?.addons || [],
      };
    }),
  };

  const validRequestData = orderRequestSchema.safeParse(payload);

  if (!validRequestData.success) {
    const formResponse: FormResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validRequestData.error.message),
    };
    console.log("validation error", formResponse);
    return parseStringify(formResponse);
  }

  const location = cartState.locationId;
  const finalPayload = {
    ...validRequestData.data,
    orderRequestServingType: "DINE_IN",
  };

  try {
    const apiClient = new ApiClient();
    const requestedOrder = await apiClient.post(
      `/api/order-request/${location}/create`,
      finalPayload,
      {
        headers: {
          "Request-Origin": "ECOMMERCE",
        },
      },
    );

    const formResponse: FormResponse = {
      responseType: "success",
      message: "Order has been requested successfully",
      data: requestedOrder,
    };
    return parseStringify(formResponse);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while processing your request, please try again";
    console.error("Order submission error:", message);
    const formResponse: FormResponse = {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
    return parseStringify(formResponse);
  }
};
