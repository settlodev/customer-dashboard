"use server";

import ApiClient from "@/lib/settlo-api-client";
import type { PaymentResponse } from "@/types/billing/types";

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "";

function paymentUrl(path: string): string {
  return `${PAYMENT_SERVICE_URL}${path}`;
}

/**
 * Initiate a payment for an invoice. `paymentMethodId` is required by the
 * payment service — it picks the provider that handles the push (mobile
 * money MNO today, cards later) so the caller must pass the specific
 * payment-method UUID selected by the merchant.
 */
export async function initiatePayment(params: {
  invoiceId: string;
  amount: number;
  currency: string;
  businessId: string;
  locationId: string;
  paymentMethodId: string;
  customerPhone: string;
  customerEmail: string;
  description?: string;
}): Promise<PaymentResponse> {
  const apiClient = new ApiClient();

  return apiClient.post<PaymentResponse, Record<string, unknown>>(
    paymentUrl("/api/v1/transactions/pay"),
    {
      idempotencyKey: crypto.randomUUID(),
      referenceId: params.invoiceId,
      amount: params.amount,
      currency: params.currency,
      businessId: params.businessId,
      locationId: params.locationId,
      paymentMethodId: params.paymentMethodId,
      customerPhoneNumber: params.customerPhone,
      customerEmail: params.customerEmail,
      description: params.description ?? "Subscription payment",
    },
  );
}

/**
 * Poll payment status by external reference ID.
 */
export async function getPaymentStatus(
  externalReferenceId: string,
): Promise<PaymentResponse> {
  const apiClient = new ApiClient();
  return apiClient.get<PaymentResponse>(
    paymentUrl(`/api/v1/transactions/${externalReferenceId}/status`),
  );
}
