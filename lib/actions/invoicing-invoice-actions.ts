"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import type { ApiResponse, FormResponse } from "@/types/types";
import type {
  Invoice,
  InvoicePayment,
  InvoicingEvent,
} from "@/types/invoicing/type";
import {
  InvoicePaymentSchema,
  type InvoicePaymentFormValues,
} from "@/types/invoicing/schema";

import { accountingUrl } from "./accounting-client";

interface ListInvoicesOpts {
  page?: number;
  size?: number;
}

export async function listInvoices(
  opts: ListInvoicesOpts = {},
): Promise<ApiResponse<Invoice>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(opts.page ?? 0));
    params.set("size", String(opts.size ?? 20));

    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/invoices?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listInvoices failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: opts.page ?? 0, pageSize: opts.size ?? 20 },
      last: true,
    } as unknown as ApiResponse<Invoice>;
  }
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(accountingUrl(`/api/v1/invoices/${id}`));
    return parseStringify(data);
  } catch (error) {
    console.error("getInvoice failed", error);
    return null;
  }
}

export async function getInvoiceTimeline(
  id: string,
): Promise<InvoicingEvent[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/invoices/${id}/timeline`),
    );
    return (parseStringify(data) as InvoicingEvent[]) ?? [];
  } catch (error) {
    console.error("getInvoiceTimeline failed", error);
    return [];
  }
}

export async function recordInvoicePayment(
  id: string,
  values: InvoicePaymentFormValues,
): Promise<FormResponse<InvoicePayment>> {
  const parsed = InvoicePaymentSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }

  try {
    const v = parsed.data;
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/invoices/${id}/payments`),
      {
        amount: v.amount,
        paymentMethodCode: v.paymentMethodCode,
        paymentMethodId: v.paymentMethodId || undefined,
        sourceAccountId: v.sourceAccountId || undefined,
        paymentDate: v.paymentDate,
        reference: v.reference || undefined,
        notes: v.notes || undefined,
      },
    )) as InvoicePayment;
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    return {
      responseType: "success",
      message: "Payment recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse<InvoicePayment>(error, "Failed to record payment");
  }
}

export async function voidInvoice(id: string): Promise<FormResponse<Invoice>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/invoices/${id}/void`),
      {},
    )) as Invoice;
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    return {
      responseType: "success",
      message: "Invoice voided",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse<Invoice>(error, "Failed to void invoice");
  }
}

/**
 * Issue (or re-issue) the public receipt link for a fully-paid invoice. The
 * Accounting Service mints the share token (gated on PAID) and returns the
 * invoice with `shareToken` set; the customer-facing snapshot lives at
 * `/receipt/{shareToken}`. Mirrors {@link shareProforma}.
 */
export async function shareInvoiceReceipt(
  id: string,
): Promise<FormResponse<Invoice>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/invoices/${id}/share`),
      {},
    )) as Invoice;
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    return {
      responseType: "success",
      message: "Receipt link is ready",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse<Invoice>(error, "Failed to share receipt");
  }
}

function errorResponse<T>(error: unknown, fallback: string): FormResponse<T> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
