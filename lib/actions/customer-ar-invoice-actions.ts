"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import type { FormResponse } from "@/types/types";
import type {
  CustomerArInvoice,
  CustomerArInvoicePaymentResult,
  CustomerArInvoiceShare,
  CustomerArInvoiceSummary,
  CustomerSignedBill,
} from "@/types/customer-ar-invoice/type";

/**
 * Consolidated customer A/R invoices, served by the Order Management
 * Service.
 *
 * These deliberately do NOT go through the Accounting Service's invoicing
 * module. Signing a bill already posted Dr A/R / Cr Revenue, so issuing an
 * Accounting invoice over the same orders would recognise the sale twice.
 * The OMS document posts nothing and settles through the ordinary per-order
 * flow, which books Dr Cash / Cr A/R exactly once.
 */

const oms = () => new ApiClient("orders");

/**
 * The customer's unsettled signed bills — what they actually owe, and the
 * candidates for a consolidated invoice. Fails soft: an empty list reads as
 * "nothing outstanding", which is the truthful default for this screen.
 */
export async function listCustomerSignedBills(
  customerId: string,
  locationId: string,
): Promise<CustomerSignedBill[]> {
  try {
    const data = await oms().get<CustomerSignedBill[]>(
      `/api/v1/customers/${customerId}/signed-bills?locationId=${locationId}`,
    );
    // The endpoint returns every signed bill including settled ones; only
    // those still carrying a receivable can be invoiced.
    return parseStringify(
      (data ?? []).filter((o) => Number(o.signedAmount ?? 0) > 0),
    );
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listCustomerSignedBills failed", error);
    return [];
  }
}

export async function listCustomerArInvoices(
  customerId: string,
): Promise<CustomerArInvoiceSummary[]> {
  try {
    const data = await oms().get<CustomerArInvoiceSummary[]>(
      `/api/v1/customers/${customerId}/ar-invoices`,
    );
    return parseStringify(data ?? []);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listCustomerArInvoices failed", error);
    return [];
  }
}

export async function getCustomerArInvoice(
  invoiceId: string,
): Promise<CustomerArInvoice | null> {
  try {
    const data = await oms().get<CustomerArInvoice>(
      `/api/v1/ar-invoices/${invoiceId}`,
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getCustomerArInvoice failed", error);
    return null;
  }
}

interface CreateInput {
  customerId: string;
  /** Omit to bill every outstanding signed bill the customer holds. */
  orderIds?: string[];
  dueDate?: string;
  notes?: string;
}

export async function createCustomerArInvoice(
  input: CreateInput,
): Promise<FormResponse<CustomerArInvoice>> {
  try {
    const data = (await oms().post(
      `/api/v1/customers/${input.customerId}/ar-invoices`,
      {
        orderIds: input.orderIds?.length ? input.orderIds : undefined,
        dueDate: input.dueDate || undefined,
        notes: input.notes || undefined,
      },
    )) as CustomerArInvoice;

    revalidatePath(`/customers/${input.customerId}`);
    revalidatePath("/debtors");
    return {
      responseType: "success",
      message: `Invoice ${data.invoiceNumber} issued over ${data.orders.length} ${
        data.orders.length === 1 ? "bill" : "bills"
      }`,
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("createCustomerArInvoice failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to issue invoice",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function shareCustomerArInvoice(
  invoiceId: string,
): Promise<FormResponse<CustomerArInvoiceShare>> {
  try {
    const data = (await oms().post(
      `/api/v1/ar-invoices/${invoiceId}/share`,
      {},
    )) as CustomerArInvoiceShare;
    revalidatePath(`/ar-invoices/${invoiceId}`);
    return {
      responseType: "success",
      message: "Share link ready",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("shareCustomerArInvoice failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to create share link",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function revokeCustomerArInvoiceShare(
  invoiceId: string,
): Promise<FormResponse<CustomerArInvoiceShare>> {
  try {
    const data = (await oms().delete(
      `/api/v1/ar-invoices/${invoiceId}/share`,
    )) as CustomerArInvoiceShare;
    revalidatePath(`/ar-invoices/${invoiceId}`);
    return {
      responseType: "success",
      message: "Share link revoked",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("revokeCustomerArInvoiceShare failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to revoke share link",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

interface PaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethodId: string;
  note?: string;
}

/**
 * Records a payment against the invoice. The backend allocates it oldest-first
 * across exactly the bills this invoice covers, settling each through the same
 * per-order flow the POS uses — so the orders really are marked paid, not just
 * the document.
 */
export async function recordCustomerArInvoicePayment(
  input: PaymentInput,
): Promise<FormResponse<CustomerArInvoicePaymentResult>> {
  try {
    const data = (await oms().post(
      `/api/v1/ar-invoices/${input.invoiceId}/payments`,
      {
        amount: input.amount,
        paymentMethodId: input.paymentMethodId,
        note: input.note || undefined,
      },
    )) as CustomerArInvoicePaymentResult;

    revalidatePath(`/ar-invoices/${input.invoiceId}`);
    revalidatePath("/debtors");
    const count = data.allocations?.length ?? 0;
    return {
      responseType: "success",
      message: `Payment recorded — ${count} ${count === 1 ? "bill" : "bills"} settled${
        data.outstandingAfter > 0
          ? `, ${data.outstandingAfter.toLocaleString()} still outstanding`
          : " and the invoice is now clear"
      }`,
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("recordCustomerArInvoicePayment failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to record payment",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function cancelCustomerArInvoice(
  invoiceId: string,
): Promise<FormResponse<CustomerArInvoice>> {
  try {
    const data = (await oms().post(
      `/api/v1/ar-invoices/${invoiceId}/cancel`,
      {},
    )) as CustomerArInvoice;
    revalidatePath(`/ar-invoices/${invoiceId}`);
    revalidatePath(`/customers/${data.customerId}`);
    return {
      responseType: "success",
      message: "Invoice cancelled — its bills are free to invoice again",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("cancelCustomerArInvoice failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to cancel invoice",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Public lookup by share token. Unauthenticated — possession of the token IS
 * the capability. Returns null on 404 so the route can render notFound().
 */
export async function getPublicCustomerArInvoice(
  token: string,
): Promise<CustomerArInvoice | null> {
  try {
    const apiClient = new ApiClient("orders");
    apiClient.isPlain = true;
    const data = await apiClient.get<CustomerArInvoice>(
      `/api/v1/public/ar-invoices/${encodeURIComponent(token)}`,
    );
    return parseStringify(data);
  } catch (error: unknown) {
    if ((error as { status?: number })?.status === 404) return null;
    console.error("getPublicCustomerArInvoice failed", error);
    return null;
  }
}
