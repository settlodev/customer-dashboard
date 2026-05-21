"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  ApplyDiscountRequest,
  DiscountResponse,
  GenerateInvoiceRequest,
  GrantFreeSubscriptionRequest,
  InvoicePage,
  InvoiceResponse,
  ManualPaymentResponse,
  RefundRequestDto,
  RefundResponse,
  RevokeDiscountRequest,
  SubscriptionDiscountResponse,
  SubscriptionResponse,
} from "@/types/admin/billing";
import {
  ApplyDiscountSchema,
  CreateRefundSchema,
  GenerateInvoiceSchema,
  GrantFreeSubscriptionSchema,
  RecordManualPaymentSchema,
} from "@/types/admin/schemas";

function staffBilling() {
  return new ApiClient("billing", "staff");
}

function revalidateBusiness(businessId: string) {
  revalidatePath("/admin/billing");
  revalidatePath(`/admin/billing?businessId=${businessId}`);
}

// ── Subscription & invoices ─────────────────────────────────────────

export async function getBusinessSubscription(
  businessId: string,
): Promise<SubscriptionResponse> {
  const data = await staffBilling().get<SubscriptionResponse>(
    `/api/v1/support/billing/${businessId}/subscription`,
  );
  return parseStringify(data);
}

export async function listBusinessInvoices(
  businessId: string,
  page = 0,
  size = 20,
): Promise<InvoicePage> {
  const qs = new URLSearchParams();
  qs.set("page", String(Math.max(0, page)));
  qs.set("size", String(size));
  const data = await staffBilling().get<InvoicePage>(
    `/api/v1/support/billing/${businessId}/invoices?${qs.toString()}`,
  );
  return parseStringify(data);
}

export async function generateInvoice(
  businessId: string,
  payload: z.infer<typeof GenerateInvoiceSchema>,
): Promise<FormResponse<InvoiceResponse>> {
  const validated = GenerateInvoiceSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid months value",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: GenerateInvoiceRequest = validated.data;
    const result = await staffBilling().post<
      InvoiceResponse,
      GenerateInvoiceRequest
    >(`/api/v1/support/billing/${businessId}/invoices`, body);
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: `Invoice ${result.invoiceNumber} created`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to generate invoice",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function cancelSupportInvoice(
  businessId: string,
  invoiceId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().post<void, Record<string, never>>(
      `/api/v1/support/billing/invoices/${invoiceId}/cancel`,
      {},
    );
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Invoice cancelled",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to cancel invoice",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Manual payment (multipart) ──────────────────────────────────────

export async function recordManualPayment(
  businessId: string,
  invoiceId: string,
  formData: FormData,
): Promise<FormResponse<ManualPaymentResponse>> {
  const paymentMethod = formData.get("paymentMethod");
  const referenceNumber = formData.get("referenceNumber");
  const amountRaw = formData.get("amount");
  const notes = formData.get("notes");
  const proof = formData.get("proof");

  const parsed = RecordManualPaymentSchema.safeParse({
    paymentMethod: typeof paymentMethod === "string" ? paymentMethod : "",
    referenceNumber: typeof referenceNumber === "string" ? referenceNumber : "",
    amount: typeof amountRaw === "string" ? Number(amountRaw) : NaN,
    notes: typeof notes === "string" && notes ? notes : undefined,
  });
  if (!parsed.success) {
    return parseStringify({
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid payment data",
      error: new Error(parsed.error.message),
    });
  }
  if (!(proof instanceof File) || proof.size === 0) {
    return parseStringify({
      responseType: "error",
      message: "Proof of payment file is required",
      error: new Error("MISSING_PROOF"),
    });
  }
  if (proof.size > 10 * 1024 * 1024) {
    return parseStringify({
      responseType: "error",
      message: "Proof file must be 10MB or smaller",
      error: new Error("PROOF_TOO_LARGE"),
    });
  }

  // Re-pack with normalized field names + the file so axios sends a clean
  // multipart body (the inbound FormData from the client may include extra
  // fields like React Server Action keys).
  const upstream = new FormData();
  upstream.append("paymentMethod", parsed.data.paymentMethod);
  upstream.append("referenceNumber", parsed.data.referenceNumber);
  upstream.append("amount", String(parsed.data.amount));
  if (parsed.data.notes) upstream.append("notes", parsed.data.notes);
  upstream.append("proof", proof);

  try {
    const result = await staffBilling().post<ManualPaymentResponse, FormData>(
      `/api/v1/support/billing/invoices/${invoiceId}/record-payment`,
      upstream,
    );
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Payment recorded",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to record payment",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Refunds ─────────────────────────────────────────────────────────

export async function createRefund(
  businessId: string,
  payload: z.infer<typeof CreateRefundSchema>,
): Promise<FormResponse<RefundResponse>> {
  const validated = CreateRefundSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid refund data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: RefundRequestDto = validated.data;
    const result = await staffBilling().post<
      RefundResponse,
      RefundRequestDto
    >(`/api/v1/refunds`, body);
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Refund requested",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to request refund",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function listInvoiceRefunds(
  invoiceId: string,
): Promise<RefundResponse[]> {
  const data = await staffBilling().get<RefundResponse[]>(
    `/api/v1/refunds/invoice/${invoiceId}`,
  );
  return parseStringify(data);
}

export async function processRefund(
  businessId: string,
  refundId: string,
): Promise<FormResponse<RefundResponse>> {
  try {
    const result = await staffBilling().post<
      RefundResponse,
      Record<string, never>
    >(`/api/v1/refunds/${refundId}/process`, {});
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Refund processed",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to process refund",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function rejectRefund(
  businessId: string,
  refundId: string,
): Promise<FormResponse<RefundResponse>> {
  try {
    const result = await staffBilling().post<
      RefundResponse,
      Record<string, never>
    >(`/api/v1/refunds/${refundId}/reject`, {});
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Refund rejected",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to reject refund",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Discounts ───────────────────────────────────────────────────────

export async function listAvailableDiscounts(): Promise<DiscountResponse[]> {
  const data = await staffBilling().get<DiscountResponse[]>(
    "/api/v1/support/discounts/available",
  );
  return parseStringify(data);
}

export async function listBusinessActiveDiscounts(
  businessId: string,
): Promise<SubscriptionDiscountResponse[]> {
  const data = await staffBilling().get<SubscriptionDiscountResponse[]>(
    `/api/v1/support/discounts/business/${businessId}`,
  );
  return parseStringify(data);
}

export async function applyDiscount(
  businessId: string,
  payload: z.infer<typeof ApplyDiscountSchema>,
): Promise<FormResponse<SubscriptionDiscountResponse>> {
  const validated = ApplyDiscountSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Choose a discount",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: ApplyDiscountRequest = {
      businessId,
      discountId: validated.data.discountId,
      reason: validated.data.reason,
    };
    const result = await staffBilling().post<
      SubscriptionDiscountResponse,
      ApplyDiscountRequest
    >("/api/v1/support/discounts/apply", body);
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Discount applied",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to apply discount",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function revokeDiscount(
  businessId: string,
  subscriptionDiscountId: string,
  reason?: string,
): Promise<FormResponse<void>> {
  try {
    const body: RevokeDiscountRequest = {
      subscriptionDiscountId,
      reason: reason || undefined,
    };
    await staffBilling().post<void, RevokeDiscountRequest>(
      "/api/v1/support/discounts/revoke",
      body,
    );
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Discount revoked",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to revoke discount",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function grantFreeSubscription(
  businessId: string,
  payload: z.infer<typeof GrantFreeSubscriptionSchema>,
): Promise<FormResponse<SubscriptionDiscountResponse>> {
  const validated = GrantFreeSubscriptionSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Reason is required",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: GrantFreeSubscriptionRequest = {
      businessId,
      durationMonths: validated.data.durationMonths,
      reason: validated.data.reason,
    };
    const result = await staffBilling().post<
      SubscriptionDiscountResponse,
      GrantFreeSubscriptionRequest
    >("/api/v1/support/discounts/free-subscription", body);
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Free subscription granted",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to grant free subscription",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
