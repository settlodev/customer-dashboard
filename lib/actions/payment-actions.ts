"use server";

import ApiClient from "@/lib/settlo-api-client";
import type { PaymentResponse } from "@/types/billing/types";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "";

function billingUrl(path: string): string {
  return `${BILLING_SERVICE_URL}${path}`;
}

/**
 * Initiate a subscription payment for a pending invoice. Routed through
 * Billing's direct Selcom integration (no longer the multi-tenant Payment
 * Service), so this only needs the invoice id + minimal customer details —
 * Billing derives amount, currency, and routing from the invoice itself.
 *
 * Selcom auto-detects the MNO from the phone number; the merchant's brand
 * picker on the UI is purely cosmetic and is not sent here.
 */
export async function initiatePayment(params: {
  invoiceId: string;
  customerPhone: string;
  customerEmail: string;
  customerName?: string;
  channel?: "MOBILE_MONEY" | "CARD";
  /** Accepted for backwards compatibility with old call sites; ignored. */
  amount?: number;
  currency?: string;
  businessId?: string;
  locationId?: string;
  paymentMethodId?: string;
  description?: string;
}): Promise<PaymentResponse> {
  const apiClient = new ApiClient();

  return apiClient.post<PaymentResponse, Record<string, unknown>>(
    billingUrl(`/api/v1/billing/invoices/${params.invoiceId}/pay`),
    {
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      channel: params.channel ?? "MOBILE_MONEY",
    },
  );
}

/**
 * Poll payment status by external reference id (the SelcomPayment row id).
 */
export async function getPaymentStatus(
  externalReferenceId: string,
): Promise<PaymentResponse> {
  const apiClient = new ApiClient();
  return apiClient.get<PaymentResponse>(
    billingUrl(`/api/v1/billing/payments/${externalReferenceId}/status`),
  );
}

/**
 * Mark a payment attempt FAILED because the polling window expired. The
 * server may still flip the row back to SUCCESS later if Selcom belatedly
 * confirms via webhook — call this purely so we don't leave an in-flight
 * row dangling.
 */
export async function markPaymentTimedOut(
  externalReferenceId: string,
): Promise<PaymentResponse> {
  const apiClient = new ApiClient();
  return apiClient.post<PaymentResponse, Record<string, unknown>>(
    billingUrl(`/api/v1/billing/payments/${externalReferenceId}/timeout`),
    {},
  );
}

/**
 * All payment attempts (succeeded, failed, in-flight) for an invoice,
 * newest first. Drives the "Payment attempts" history in the invoice
 * details dialog.
 */
export async function listInvoicePayments(
  invoiceId: string,
): Promise<PaymentResponse[]> {
  const apiClient = new ApiClient();
  return apiClient.get<PaymentResponse[]>(
    billingUrl(`/api/v1/billing/invoices/${invoiceId}/payments`),
  );
}
