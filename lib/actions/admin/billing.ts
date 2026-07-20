"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { PresignActionResult } from "@/lib/actions/upload-actions";
import type { UploadPresignResult } from "@/lib/uploads/types";
import { FormResponse } from "@/types/types";
import {
  AddonResponse,
  ApplyDiscountRequest,
  AttachInvoiceParams,
  CouponResponse,
  CreateAddonRequest,
  CreateCouponRequest,
  CreateCreditPackRequest,
  CreateDiscountRequest,
  AddonFeatureResponse,
  CreateFeatureRequest,
  CreatePackageRequest,
  CreditPackResponse,
  CreditTypeResponse,
  DiscountResponse,
  FeatureResponse,
  GenerateInvoiceRequest,
  GrantFreeSubscriptionRequest,
  InvoicePage,
  InvoiceResponse,
  ManualPaymentResponse,
  PackageBreakdownResponse,
  PackageFeatureMappingResponse,
  PackageHistoryEntry,
  PackageIncludedCreditResponse,
  PackageResponse,
  BillingConfigResponse,
  PaymentMethod,
  RefundPage,
  RefundRequestDto,
  RefundResponse,
  RepublishSubscriptionsResult,
  RevokeDiscountRequest,
  SetPackageFeatureRequest,
  SetPackageIncludedCreditRequest,
  SetWhitelabelAddonPriceRequest,
  SetWhitelabelPackagePriceRequest,
  SubscriptionDiscountResponse,
  SubscriptionResponse,
  SupportAddonRequest,
  SupportUpgradeRequest,
  WhitelabelAddonPriceOverride,
  WhitelabelPackagePriceOverride,
} from "@/types/admin/billing";
import {
  AddSubscriptionAddonSchema,
  ApplyDiscountSchema,
  AttachInvoiceSchema,
  CreateAddonSchema,
  CreateCouponSchema,
  CreateCreditPackSchema,
  CreateDiscountSchema,
  CreateFeatureSchema,
  CreatePackageSchema,
  CreateRefundSchema,
  GenerateInvoiceSchema,
  GrantFreeSubscriptionSchema,
  RecordManualPaymentSchema,
  SetPackageFeatureSchema,
  SetPackageIncludedCreditSchema,
  SetWhitelabelAddonPriceSchema,
  SetWhitelabelPackagePriceSchema,
  UpgradePlanSchema,
} from "@/types/admin/schemas";

function staffBilling() {
  return new ApiClient("billing", "staff");
}

function revalidateBusiness(businessId: string) {
  // Billing now lives at /businesses/[id]/billing — the legacy
  // /billing route is a redirect, so there's nothing to revalidate
  // there. The business detail page surfaces a subscription summary,
  // so bust that too whenever a mutation lands.
  revalidatePath(`/admin/businesses/${businessId}/billing`);
  revalidatePath(`/admin/businesses/${businessId}`);
  // The refund queue mirrors per-business mutations (approve, reject) —
  // bust it alongside the business view so the queue's status counts
  // refresh after an action.
  revalidatePath("/admin/refunds");
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

// ── Manual payment (presigned proof) ────────────────────────────────

/**
 * Presign a direct-to-storage upload for a manual-payment proof. The file is
 * PUT straight to object storage by the browser; only this small metadata
 * request crosses the server, so it's never bound by the Server Action body
 * limit. Returns the object key to pass to {@link recordManualPayment}.
 */
export async function getPaymentProofPresignUrl(
  invoiceId: string,
  body: { filename: string; contentType: string; contentLength: number },
): Promise<PresignActionResult> {
  try {
    const data = await staffBilling().post<UploadPresignResult, typeof body>(
      `/api/v1/support/billing/invoices/${invoiceId}/payment-proof/presign`,
      body,
    );
    return { ok: true, data };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.message || "Failed to obtain upload URL",
    };
  }
}

export async function recordManualPayment(
  businessId: string,
  invoiceId: string,
  payload: {
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    amount: number;
    notes?: string;
    proofKey: string;
  },
): Promise<FormResponse<ManualPaymentResponse>> {
  const parsed = RecordManualPaymentSchema.safeParse(payload);
  if (!parsed.success) {
    return parseStringify({
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid payment data",
      error: new Error(parsed.error.message),
    });
  }

  try {
    const result = await staffBilling().post<
      ManualPaymentResponse,
      typeof parsed.data
    >(`/api/v1/support/billing/invoices/${invoiceId}/record-payment`, parsed.data);
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

/**
 * Admin refund queue. Optional status filter is one of PENDING,
 * PROCESSED, REJECTED — any other value (or omitted) returns every
 * refund regardless of status.
 */
export async function listRefunds(params: {
  status?: "PENDING" | "PROCESSED" | "REJECTED";
  page?: number;
  size?: number;
} = {}): Promise<RefundPage> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  qs.set("page", String(Math.max(0, params.page ?? 0)));
  qs.set("size", String(params.size ?? 20));
  const data = await staffBilling().get<RefundPage>(
    `/api/v1/refunds?${qs.toString()}`,
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

// ── Subscription plan changes / addons / prospect attachment ────────

export async function upgradeSubscriptionPlan(
  businessId: string,
  payload: z.infer<typeof UpgradePlanSchema>,
): Promise<FormResponse<SubscriptionResponse>> {
  const validated = UpgradePlanSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Pick a target package",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: SupportUpgradeRequest = {
      businessId,
      subscriptionItemId: validated.data.subscriptionItemId,
      newPackageId: validated.data.newPackageId,
    };
    const result = await staffBilling().post<
      SubscriptionResponse,
      SupportUpgradeRequest
    >("/api/v1/support/billing/upgrade", body);
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Plan upgraded — prorated invoice issued",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to upgrade plan",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function addSubscriptionAddon(
  businessId: string,
  payload: z.infer<typeof AddSubscriptionAddonSchema>,
): Promise<FormResponse<SubscriptionResponse>> {
  const validated = AddSubscriptionAddonSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Pick an addon",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: SupportAddonRequest = {
      businessId,
      subscriptionItemId: validated.data.subscriptionItemId,
      addonId: validated.data.addonId,
    };
    const result = await staffBilling().post<
      SubscriptionResponse,
      SupportAddonRequest
    >("/api/v1/support/billing/addon", body);
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Addon attached — prorated invoice issued",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to add addon",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function attachProspectInvoice(
  payload: AttachInvoiceParams,
): Promise<FormResponse<InvoiceResponse>> {
  const validated = AttachInvoiceSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid IDs",
      error: new Error(validated.error.message),
    });
  }
  try {
    const qs = new URLSearchParams();
    qs.set("businessId", validated.data.businessId);
    if (validated.data.locationId) qs.set("locationId", validated.data.locationId);
    if (validated.data.subscriptionId)
      qs.set("subscriptionId", validated.data.subscriptionId);
    const result = await staffBilling().post<
      InvoiceResponse,
      Record<string, never>
    >(
      `/api/v1/support/billing/invoices/${validated.data.invoiceId}/attach?${qs.toString()}`,
      {},
    );
    revalidateBusiness(validated.data.businessId);
    return parseStringify({
      responseType: "success",
      message: `Invoice ${result.invoiceNumber} attached`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to attach invoice",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Catalog: packages (super admin) ─────────────────────────────────

function revalidateCatalog(kind: "packages" | "addons") {
  revalidatePath(`/${kind}`);
}

export async function listPackages(
  entityType?: "LOCATION" | "WAREHOUSE" | "STORE",
): Promise<PackageResponse[]> {
  const qs = entityType ? `?entityType=${entityType}` : "";
  const data = await staffBilling().get<PackageResponse[]>(
    `/api/v1/packages${qs}`,
  );
  return parseStringify(data);
}

export async function getPackage(packageId: string): Promise<PackageResponse> {
  const data = await staffBilling().get<PackageResponse>(
    `/api/v1/packages/${packageId}`,
  );
  return parseStringify(data);
}

export async function createPackage(
  payload: z.infer<typeof CreatePackageSchema>,
): Promise<FormResponse<PackageResponse>> {
  const validated = CreatePackageSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid package data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreatePackageRequest = {
      name: validated.data.name,
      description: validated.data.description || undefined,
      basePrice: validated.data.basePrice,
      billingInterval: validated.data.billingInterval,
      entityType: validated.data.entityType,
      includedWarehouseCount: validated.data.includedWarehouseCount,
      includedStoreCount: validated.data.includedStoreCount,
    };
    const result = await staffBilling().post<
      PackageResponse,
      CreatePackageRequest
    >("/api/v1/packages", body);
    revalidateCatalog("packages");
    return parseStringify({
      responseType: "success",
      message: `Package "${result.name}" created`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create package",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updatePackage(
  packageId: string,
  payload: z.infer<typeof CreatePackageSchema>,
): Promise<FormResponse<PackageResponse>> {
  const validated = CreatePackageSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid package data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreatePackageRequest = {
      name: validated.data.name,
      description: validated.data.description || undefined,
      basePrice: validated.data.basePrice,
      billingInterval: validated.data.billingInterval,
      entityType: validated.data.entityType,
      includedWarehouseCount: validated.data.includedWarehouseCount,
      includedStoreCount: validated.data.includedStoreCount,
    };
    const result = await staffBilling().put<
      PackageResponse,
      CreatePackageRequest
    >(`/api/v1/packages/${packageId}`, body);
    revalidateCatalog("packages");
    return parseStringify({
      responseType: "success",
      message: `Package "${result.name}" updated`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update package",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deactivatePackage(
  packageId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(`/api/v1/packages/${packageId}`);
    revalidateCatalog("packages");
    return parseStringify({
      responseType: "success",
      message: "Package deactivated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate package",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Term pricing (1/3/6/12-month commitments + savings) computed by the backend. */
export async function getPackageBreakdown(
  packageId: string,
): Promise<PackageBreakdownResponse> {
  const data = await staffBilling().get<PackageBreakdownResponse>(
    `/api/v1/packages/${packageId}/breakdown`,
  );
  return parseStringify(data);
}

/** Platform-wide billing config (trial length, grace period, prepay discounts). */
export async function getBillingConfig(): Promise<BillingConfigResponse> {
  const data = await staffBilling().get<BillingConfigResponse>(
    `/api/v1/admin/billing-config`,
  );
  return parseStringify(data);
}

/**
 * Switch the platform prepayment discount on/off and set its rate.
 *
 * Annual-only by design: a commitment shorter than 12 months never earns it, whatever
 * rate is stored. Off means every term is billed gross.
 */
export async function updatePrepayDiscount(
  enabled: boolean,
  annualPercentage: number,
): Promise<FormResponse<BillingConfigResponse>> {
  if (annualPercentage < 0 || annualPercentage > 100) {
    return parseStringify({
      responseType: "error",
      message: "Discount must be between 0 and 100%",
      error: new Error("annualPercentage out of range"),
    });
  }
  try {
    const data = await staffBilling().put<
      BillingConfigResponse,
      { enabled: boolean; annualPercentage: number }
    >(`/api/v1/admin/billing-config/prepay-discount`, {
      enabled,
      annualPercentage,
    });
    revalidateCatalog("packages");
    return parseStringify({
      responseType: "success",
      message: enabled
        ? `Prepay discount on — ${annualPercentage}% off annual commitments`
        : "Prepay discount off — every term bills gross",
      data,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update the prepay discount",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Package config/pricing change history (audit trail), most-recent first. */
export async function getPackageHistory(
  packageId: string,
): Promise<PackageHistoryEntry[]> {
  const data = await staffBilling().get<PackageHistoryEntry[]>(
    `/api/v1/admin/packages/${packageId}/history`,
  );
  return parseStringify(data);
}

// ── Catalog: addons (super admin) ───────────────────────────────────

export async function listAddons(): Promise<AddonResponse[]> {
  const data = await staffBilling().get<AddonResponse[]>(`/api/v1/addons`);
  return parseStringify(data);
}

export async function createAddon(
  payload: z.infer<typeof CreateAddonSchema>,
): Promise<FormResponse<AddonResponse>> {
  const validated = CreateAddonSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid addon data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreateAddonRequest = {
      name: validated.data.name,
      description: validated.data.description || undefined,
      price: validated.data.price,
      entityType: validated.data.entityType,
    };
    const result = await staffBilling().post<AddonResponse, CreateAddonRequest>(
      "/api/v1/addons",
      body,
    );
    revalidateCatalog("addons");
    return parseStringify({
      responseType: "success",
      message: `Addon "${result.name}" created`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create addon",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateAddon(
  addonId: string,
  payload: z.infer<typeof CreateAddonSchema>,
): Promise<FormResponse<AddonResponse>> {
  const validated = CreateAddonSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid addon data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreateAddonRequest = {
      name: validated.data.name,
      description: validated.data.description || undefined,
      price: validated.data.price,
      entityType: validated.data.entityType,
    };
    const result = await staffBilling().put<AddonResponse, CreateAddonRequest>(
      `/api/v1/addons/${addonId}`,
      body,
    );
    revalidateCatalog("addons");
    return parseStringify({
      responseType: "success",
      message: `Addon "${result.name}" updated`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update addon",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deactivateAddon(
  addonId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(`/api/v1/addons/${addonId}`);
    revalidateCatalog("addons");
    return parseStringify({
      responseType: "success",
      message: "Addon deactivated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate addon",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Catalog: discount definitions (super admin) ─────────────────────

export async function listAllDiscounts(): Promise<DiscountResponse[]> {
  const data = await staffBilling().get<DiscountResponse[]>(
    "/api/v1/support/discounts",
  );
  return parseStringify(data);
}

export async function createDiscountDefinition(
  payload: z.infer<typeof CreateDiscountSchema>,
): Promise<FormResponse<DiscountResponse>> {
  const validated = CreateDiscountSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid discount data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreateDiscountRequest = {
      name: validated.data.name,
      description: validated.data.description || undefined,
      discountType: validated.data.discountType,
      discountValue: validated.data.discountValue,
      scope: validated.data.scope,
      source: validated.data.source,
      durationMonths: validated.data.durationMonths,
      stackable: validated.data.stackable,
      maxApplications: validated.data.maxApplications,
      validFrom: validated.data.validFrom,
      validUntil: validated.data.validUntil || undefined,
    };
    const result = await staffBilling().post<
      DiscountResponse,
      CreateDiscountRequest
    >("/api/v1/support/discounts", body);
    revalidatePath("/admin/discounts");
    return parseStringify({
      responseType: "success",
      message: `Discount "${result.name}" created`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create discount",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deactivateDiscountDefinition(
  discountId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(
      `/api/v1/support/discounts/${discountId}`,
    );
    revalidatePath("/admin/discounts");
    return parseStringify({
      responseType: "success",
      message: "Discount deactivated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate discount",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Catalog: coupons (super admin) ──────────────────────────────────

export async function getCouponByCode(
  code: string,
): Promise<CouponResponse | null> {
  try {
    const data = await staffBilling().get<CouponResponse>(
      `/api/v1/coupons/${encodeURIComponent(code)}`,
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function listCoupons(): Promise<CouponResponse[]> {
  const data = await staffBilling().get<CouponResponse[]>("/api/v1/coupons");
  return parseStringify(data);
}

export async function createCoupon(
  payload: z.infer<typeof CreateCouponSchema>,
): Promise<FormResponse<CouponResponse>> {
  const validated = CreateCouponSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid coupon data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreateCouponRequest = {
      code: validated.data.code.toUpperCase(),
      description: validated.data.description || undefined,
      discountType: validated.data.discountType,
      discountValue: validated.data.discountValue,
      maxUses: validated.data.maxUses,
      validFrom: validated.data.validFrom,
      validUntil: validated.data.validUntil,
    };
    const result = await staffBilling().post<
      CouponResponse,
      CreateCouponRequest
    >("/api/v1/coupons", body);
    revalidatePath("/admin/coupons");
    return parseStringify({
      responseType: "success",
      message: `Coupon "${result.code}" created`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create coupon",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deactivateCoupon(
  couponId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(`/api/v1/coupons/${couponId}`);
    revalidatePath("/admin/coupons");
    return parseStringify({
      responseType: "success",
      message: "Coupon deactivated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate coupon",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Catalog: addon → feature bindings (super admin) ─────────────────
//
// What makes an addon actually DO something. Without a binding an addon is priced and
// billable but lifts no limit at all — only the seeded capacity addons had bindings,
// because they were written directly into migration V8.

/** Feature ceilings this addon lifts. Empty means the addon changes nothing. */
export async function getAddonFeatures(
  addonId: string,
): Promise<AddonFeatureResponse[]> {
  const data = await staffBilling().get<AddonFeatureResponse[]>(
    `/api/v1/admin/addons/${addonId}/features`,
  );
  return parseStringify(data);
}

/**
 * Bind a feature to this addon at `featureValue`, upserting by feature.
 *
 * `featureValue` is the NEW CEILING for the feature, not an increment: entitlements take
 * `Math.max` of the package value and each active addon value. To turn a 10-staff package
 * into a 20-staff one, store `20`.
 */
export async function setAddonFeature(
  addonId: string,
  featureId: string,
  featureValue: string,
): Promise<FormResponse<AddonFeatureResponse>> {
  try {
    const data = await staffBilling().post<
      AddonFeatureResponse,
      { featureId: string; featureValue: string; isIncluded: boolean }
    >(`/api/v1/admin/addons/${addonId}/features`, {
      featureId,
      featureValue,
      isIncluded: true,
    });
    revalidateCatalog("addons");
    return parseStringify({
      responseType: "success",
      message: "Addon limit saved",
      data,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to save the addon limit",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function removeAddonFeature(
  addonId: string,
  featureKey: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(
      `/api/v1/admin/addons/${addonId}/features/${featureKey}`,
    );
    revalidateCatalog("addons");
    return parseStringify({
      responseType: "success",
      message: "Addon limit removed",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to remove the addon limit",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Catalog: features + package-feature mapping (super admin) ───────

export async function listFeatures(): Promise<FeatureResponse[]> {
  const data = await staffBilling().get<FeatureResponse[]>(
    "/api/v1/admin/features",
  );
  return parseStringify(data);
}

export async function createFeature(
  payload: z.infer<typeof CreateFeatureSchema>,
): Promise<FormResponse<FeatureResponse>> {
  const validated = CreateFeatureSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid feature data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreateFeatureRequest = {
      name: validated.data.name,
      featureKey: validated.data.featureKey,
      featureType: validated.data.featureType,
      description: validated.data.description || undefined,
    };
    const result = await staffBilling().post<
      FeatureResponse,
      CreateFeatureRequest
    >("/api/v1/admin/features", body);
    revalidatePath("/admin/features");
    return parseStringify({
      responseType: "success",
      message: `Feature "${result.name}" created`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create feature",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateFeature(
  featureId: string,
  payload: z.infer<typeof CreateFeatureSchema>,
): Promise<FormResponse<FeatureResponse>> {
  const validated = CreateFeatureSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid feature data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreateFeatureRequest = {
      name: validated.data.name,
      featureKey: validated.data.featureKey,
      featureType: validated.data.featureType,
      description: validated.data.description || undefined,
    };
    const result = await staffBilling().put<
      FeatureResponse,
      CreateFeatureRequest
    >(`/api/v1/admin/features/${featureId}`, body);
    revalidatePath("/admin/features");
    return parseStringify({
      responseType: "success",
      message: `Feature "${result.name}" updated`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update feature",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function toggleFeature(
  featureId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().patch<void, Record<string, never>>(
      `/api/v1/admin/features/${featureId}/toggle`,
      {},
    );
    revalidatePath("/admin/features");
    return parseStringify({
      responseType: "success",
      message: "Feature toggled",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to toggle feature",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function listPackageFeatures(
  packageId: string,
): Promise<PackageFeatureMappingResponse[]> {
  const data = await staffBilling().get<PackageFeatureMappingResponse[]>(
    `/api/v1/admin/packages/${packageId}/features`,
  );
  return parseStringify(data);
}

export async function setPackageFeature(
  packageId: string,
  payload: z.infer<typeof SetPackageFeatureSchema>,
): Promise<FormResponse<PackageFeatureMappingResponse>> {
  const validated = SetPackageFeatureSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Pick a feature",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: SetPackageFeatureRequest = {
      featureId: validated.data.featureId,
      featureValue: validated.data.featureValue || undefined,
      isIncluded: validated.data.isIncluded,
    };
    const result = await staffBilling().post<
      PackageFeatureMappingResponse,
      SetPackageFeatureRequest
    >(`/api/v1/admin/packages/${packageId}/features`, body);
    revalidatePath(`/admin/features`);
    revalidatePath(`/admin/packages`);
    return parseStringify({
      responseType: "success",
      message: `Feature attached to package`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to set package feature",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function removePackageFeature(
  packageId: string,
  featureKey: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(
      `/api/v1/admin/packages/${packageId}/features/${encodeURIComponent(featureKey)}`,
    );
    revalidatePath(`/admin/features`);
    revalidatePath(`/admin/packages`);
    return parseStringify({
      responseType: "success",
      message: "Feature removed from package",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to remove feature",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Ops: subscription event republish ───────────────────────────────

// ── Whitelabel package + addon pricing (super admin) ───────────────

function revalidateWhitelabelPricing() {
  revalidatePath("/admin/whitelabel-pricing");
}

export async function listWhitelabelPackagePrices(
  whitelabelId: string,
): Promise<WhitelabelPackagePriceOverride[]> {
  const data = await staffBilling().get<WhitelabelPackagePriceOverride[]>(
    `/api/v1/admin/whitelabel/${whitelabelId}/package-prices`,
  );
  return parseStringify(data);
}

export async function setWhitelabelPackagePrice(
  whitelabelId: string,
  payload: z.infer<typeof SetWhitelabelPackagePriceSchema>,
): Promise<FormResponse<WhitelabelPackagePriceOverride>> {
  const validated = SetWhitelabelPackagePriceSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid price",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: SetWhitelabelPackagePriceRequest = {
      packageId: validated.data.packageId,
      price: validated.data.price,
    };
    const result = await staffBilling().put<
      WhitelabelPackagePriceOverride,
      SetWhitelabelPackagePriceRequest
    >(`/api/v1/admin/whitelabel/${whitelabelId}/package-prices`, body);
    revalidateWhitelabelPricing();
    return parseStringify({
      responseType: "success",
      message: "Package price override saved",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to save price override",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function removeWhitelabelPackagePrice(
  whitelabelId: string,
  packageId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(
      `/api/v1/admin/whitelabel/${whitelabelId}/package-prices/${packageId}`,
    );
    revalidateWhitelabelPricing();
    return parseStringify({
      responseType: "success",
      message: "Override removed — base price restored",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to remove override",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function listWhitelabelAddonPrices(
  whitelabelId: string,
): Promise<WhitelabelAddonPriceOverride[]> {
  const data = await staffBilling().get<WhitelabelAddonPriceOverride[]>(
    `/api/v1/admin/whitelabel/${whitelabelId}/addon-prices`,
  );
  return parseStringify(data);
}

export async function setWhitelabelAddonPrice(
  whitelabelId: string,
  payload: z.infer<typeof SetWhitelabelAddonPriceSchema>,
): Promise<FormResponse<WhitelabelAddonPriceOverride>> {
  const validated = SetWhitelabelAddonPriceSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid price",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: SetWhitelabelAddonPriceRequest = {
      addonId: validated.data.addonId,
      price: validated.data.price,
    };
    const result = await staffBilling().put<
      WhitelabelAddonPriceOverride,
      SetWhitelabelAddonPriceRequest
    >(`/api/v1/admin/whitelabel/${whitelabelId}/addon-prices`, body);
    revalidateWhitelabelPricing();
    return parseStringify({
      responseType: "success",
      message: "Addon price override saved",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to save price override",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function removeWhitelabelAddonPrice(
  whitelabelId: string,
  addonId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(
      `/api/v1/admin/whitelabel/${whitelabelId}/addon-prices/${addonId}`,
    );
    revalidateWhitelabelPricing();
    return parseStringify({
      responseType: "success",
      message: "Override removed — base price restored",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to remove override",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Credit packs + package included credits (super admin) ───────────

function revalidateCreditPacks() {
  revalidatePath("/admin/credit-packs");
}

export async function listCreditTypes(): Promise<CreditTypeResponse[]> {
  const data = await staffBilling().get<CreditTypeResponse[]>(
    "/api/v1/credits/types",
  );
  return parseStringify(data);
}

export async function listCreditPacks(): Promise<CreditPackResponse[]> {
  const data = await staffBilling().get<CreditPackResponse[]>(
    "/api/v1/admin/credit-packs",
  );
  return parseStringify(data);
}

export async function createCreditPack(
  payload: z.infer<typeof CreateCreditPackSchema>,
): Promise<FormResponse<CreditPackResponse>> {
  const validated = CreateCreditPackSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid credit pack data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreateCreditPackRequest = {
      creditTypeId: validated.data.creditTypeId,
      name: validated.data.name,
      description: validated.data.description || undefined,
      creditAmount: validated.data.creditAmount,
      price: validated.data.price,
    };
    const result = await staffBilling().post<
      CreditPackResponse,
      CreateCreditPackRequest
    >("/api/v1/admin/credit-packs", body);
    revalidateCreditPacks();
    return parseStringify({
      responseType: "success",
      message: `Credit pack "${result.name}" created`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create credit pack",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateCreditPack(
  packId: string,
  payload: z.infer<typeof CreateCreditPackSchema>,
): Promise<FormResponse<CreditPackResponse>> {
  const validated = CreateCreditPackSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid credit pack data",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: CreateCreditPackRequest = {
      creditTypeId: validated.data.creditTypeId,
      name: validated.data.name,
      description: validated.data.description || undefined,
      creditAmount: validated.data.creditAmount,
      price: validated.data.price,
    };
    const result = await staffBilling().put<
      CreditPackResponse,
      CreateCreditPackRequest
    >(`/api/v1/admin/credit-packs/${packId}`, body);
    revalidateCreditPacks();
    return parseStringify({
      responseType: "success",
      message: `Credit pack "${result.name}" updated`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update credit pack",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deactivateCreditPack(
  packId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(`/api/v1/admin/credit-packs/${packId}`);
    revalidateCreditPacks();
    return parseStringify({
      responseType: "success",
      message: "Credit pack deactivated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate credit pack",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function listPackageIncludedCredits(
  packageId: string,
): Promise<PackageIncludedCreditResponse[]> {
  const data = await staffBilling().get<PackageIncludedCreditResponse[]>(
    `/api/v1/admin/packages/${packageId}/credits`,
  );
  return parseStringify(data);
}

export async function setPackageIncludedCredit(
  packageId: string,
  payload: z.infer<typeof SetPackageIncludedCreditSchema>,
): Promise<FormResponse<PackageIncludedCreditResponse>> {
  const validated = SetPackageIncludedCreditSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid value",
      error: new Error(validated.error.message),
    });
  }
  try {
    const body: SetPackageIncludedCreditRequest = {
      creditTypeId: validated.data.creditTypeId,
      monthlyAmount: validated.data.monthlyAmount,
    };
    const result = await staffBilling().post<
      PackageIncludedCreditResponse,
      SetPackageIncludedCreditRequest
    >(`/api/v1/admin/packages/${packageId}/credits`, body);
    revalidateCreditPacks();
    return parseStringify({
      responseType: "success",
      message: "Package credit allowance saved",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to save credit allowance",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function removePackageIncludedCredit(
  packageId: string,
  creditTypeId: string,
): Promise<FormResponse<void>> {
  try {
    await staffBilling().delete<void>(
      `/api/v1/admin/packages/${packageId}/credits/${creditTypeId}`,
    );
    revalidateCreditPacks();
    return parseStringify({
      responseType: "success",
      message: "Credit allowance removed",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to remove allowance",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function extendEntityTrial(
  businessId: string,
  subscriptionId: string,
  itemId: string,
): Promise<FormResponse<SubscriptionResponse>> {
  try {
    const result = await staffBilling().post<
      SubscriptionResponse,
      Record<string, never>
    >(
      `/api/v1/support/billing/subscriptions/${subscriptionId}/items/${itemId}/extend-trial`,
      {},
    );
    revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: "Trial extended",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to extend trial",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function republishSubscriptions(
  businessId?: string,
): Promise<FormResponse<RepublishSubscriptionsResult>> {
  try {
    const path = businessId
      ? `/api/v1/admin/subscriptions/republish?businessId=${businessId}`
      : `/api/v1/admin/subscriptions/republish`;
    const result = await staffBilling().post<
      RepublishSubscriptionsResult,
      Record<string, never>
    >(path, {});
    if (businessId) revalidateBusiness(businessId);
    return parseStringify({
      responseType: "success",
      message: `Republished ${result.published}/${result.considered}${result.failed ? ` · ${result.failed} failed` : ""}`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to republish events",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
