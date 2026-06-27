"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type { PublicArInvoice, PublicProforma } from "@/types/invoicing/type";

/**
 * Customer-facing (unauthenticated) views of the Accounting AR share funnel.
 *
 * These hit the Accounting `…/public/ar/*` endpoints which are `permitAll()`
 * and addressed solely by an opaque share token — so we use a "plain" client
 * that skips the auth token + 401-retry machinery. No tenant headers are read
 * (there's no session on a public page).
 */

function plainAccountingClient(): ApiClient {
  const apiClient = new ApiClient("accounting");
  apiClient.isPlain = true;
  return apiClient;
}

export async function getPublicProforma(
  token: string,
): Promise<PublicProforma | null> {
  try {
    const data = await plainAccountingClient().get(
      `/api/v1/public/ar/proformas/${encodeURIComponent(token)}`,
    );
    return parseStringify(data);
  } catch (error) {
    console.error("getPublicProforma failed", error);
    return null;
  }
}

/**
 * Customer accepts a shared proforma. The service converts it to an invoice
 * and returns that invoice's public view (with payment details revealed).
 */
export async function acceptPublicProforma(
  token: string,
  acceptedByName?: string,
): Promise<FormResponse<PublicArInvoice>> {
  try {
    const data = (await plainAccountingClient().post(
      `/api/v1/public/ar/proformas/${encodeURIComponent(token)}/accept`,
      { acceptedByName: acceptedByName?.trim() || undefined },
    )) as PublicArInvoice;
    return {
      responseType: "success",
      message: "Proforma accepted",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return publicError<PublicArInvoice>(error, "Could not accept this proforma");
  }
}

export async function getPublicArInvoice(
  token: string,
): Promise<PublicArInvoice | null> {
  try {
    const data = await plainAccountingClient().get(
      `/api/v1/public/ar/invoices/${encodeURIComponent(token)}`,
    );
    return parseStringify(data);
  } catch (error) {
    console.error("getPublicArInvoice failed", error);
    return null;
  }
}

export async function acceptPublicArInvoice(
  token: string,
  acceptedByName?: string,
): Promise<FormResponse<PublicArInvoice>> {
  try {
    const data = (await plainAccountingClient().post(
      `/api/v1/public/ar/invoices/${encodeURIComponent(token)}/accept`,
      { acceptedByName: acceptedByName?.trim() || undefined },
    )) as PublicArInvoice;
    return {
      responseType: "success",
      message: "Invoice acknowledged",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return publicError<PublicArInvoice>(error, "Could not acknowledge this invoice");
  }
}

function publicError<T>(error: unknown, fallback: string): FormResponse<T> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
