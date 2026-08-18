"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import type { ApiResponse, FormResponse } from "@/types/types";
import type {
  Invoice,
  Proforma,
  ProformaStatus,
  InvoicingEvent,
} from "@/types/invoicing/type";
import {
  ProformaSchema,
  type ProformaFormValues,
} from "@/types/invoicing/schema";

import { accountingUrl } from "./accounting-client";

interface ListProformasOpts {
  status?: ProformaStatus | string;
  page?: number;
  size?: number;
}

export async function listProformas(
  opts: ListProformasOpts = {},
): Promise<ApiResponse<Proforma>> {
  try {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", String(opts.status));
    params.set("page", String(opts.page ?? 0));
    params.set("size", String(opts.size ?? 20));

    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/proformas?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listProformas failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: opts.page ?? 0, pageSize: opts.size ?? 20 },
      last: true,
    } as unknown as ApiResponse<Proforma>;
  }
}

export async function getProforma(id: string): Promise<Proforma | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(accountingUrl(`/api/v1/proformas/${id}`));
    return parseStringify(data);
  } catch (error) {
    console.error("getProforma failed", error);
    return null;
  }
}

export async function getProformaTimeline(
  id: string,
): Promise<InvoicingEvent[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/proformas/${id}/timeline`),
    );
    return (parseStringify(data) as InvoicingEvent[]) ?? [];
  } catch (error) {
    console.error("getProformaTimeline failed", error);
    return [];
  }
}

export async function createProforma(
  values: ProformaFormValues,
): Promise<FormResponse<Proforma>> {
  const parsed = ProformaSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl("/api/v1/proformas"),
      toRequest(parsed.data),
    )) as Proforma;
    revalidatePath("/proforma-invoices");
    return {
      responseType: "success",
      message: "Proforma created",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse<Proforma>(error, "Failed to create proforma");
  }
}

export async function updateProforma(
  id: string,
  values: ProformaFormValues,
): Promise<FormResponse<Proforma>> {
  const parsed = ProformaSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.patch(
      accountingUrl(`/api/v1/proformas/${id}`),
      toRequest(parsed.data),
    )) as Proforma;
    revalidatePath("/proforma-invoices");
    revalidatePath(`/proforma-invoices/${id}`);
    return {
      responseType: "success",
      message: "Proforma updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse<Proforma>(error, "Failed to update proforma");
  }
}

export async function shareProforma(
  id: string,
): Promise<FormResponse<Proforma>> {
  return workflowAction(id, "share", "Proforma shared — link is ready");
}

export async function cancelProforma(
  id: string,
): Promise<FormResponse<Proforma>> {
  return workflowAction(id, "cancel", "Proforma cancelled");
}

/**
 * Convert a proforma into an invoice. The Accounting Service returns the newly
 * created *invoice* — the caller should navigate to it.
 */
export async function convertProforma(
  id: string,
): Promise<FormResponse<Invoice>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/proformas/${id}/convert`),
      {},
    )) as Invoice;
    revalidatePath("/proforma-invoices");
    revalidatePath(`/proforma-invoices/${id}`);
    revalidatePath("/invoices");
    return {
      responseType: "success",
      message: `Invoice ${data?.invoiceNumber ?? ""} created`.trim(),
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse<Invoice>(error, "Failed to convert proforma");
  }
}

async function workflowAction(
  id: string,
  action: "share" | "cancel",
  successMessage: string,
): Promise<FormResponse<Proforma>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/proformas/${id}/${action}`),
      {},
    )) as Proforma;
    revalidatePath("/proforma-invoices");
    revalidatePath(`/proforma-invoices/${id}`);
    return {
      responseType: "success",
      message: successMessage,
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse<Proforma>(error, `Failed to ${action} proforma`);
  }
}

/** Map the form values onto the Accounting `ProformaRequest` shape. */
function toRequest(values: ProformaFormValues) {
  return {
    customerId: values.customerId,
    customerName: values.customerName,
    customerPhone: values.customerPhone || undefined,
    customerEmail: values.customerEmail || undefined,
    customerTin: values.customerTin || undefined,
    currencyCode: values.currencyCode,
    validUntil: values.validUntil || undefined,
    notes: values.notes || undefined,
    lines: values.lines.map((l) => ({
      productId: l.productId || undefined,
      productVariantId: l.productVariantId || undefined,
      stockVariantId: l.stockVariantId || undefined,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineDiscountAmount: l.lineDiscountAmount ?? undefined,
      // The form captures tax as a percentage; the service expects a fraction.
      taxRate: l.taxRate != null ? l.taxRate / 100 : undefined,
      taxInclusive: !!l.taxInclusive,
    })),
  };
}

function errorResponse<T>(error: unknown, fallback: string): FormResponse<T> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
