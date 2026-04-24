"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "./business/get-current-business";
import type {
  BusinessProviderConfig,
  ConfigureProviderRequest,
  LocationOverride,
  PaymentMethod,
  Provider,
} from "@/types/payments/type";

// All payment-service endpoints route through ApiClient("payments") →
// PAYMENT_SERVICE_URL (already ends in `/payments`, so request paths start at
// `/api/v1/...`).

// ──────────────────────────────────────────────────────────────────────
// Payment methods — PaymentMethodController
// ──────────────────────────────────────────────────────────────────────

export const fetchAllPaymentMethods = async (): Promise<PaymentMethod[]> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient("payments");
  const data = await apiClient.get("/api/v1/payment-methods");
  return parseStringify(data);
};

export const fetchBusinessPaymentMethods = async (): Promise<
  PaymentMethod[]
> => {
  await getAuthenticatedUser();
  const business = await getCurrentBusiness();
  if (!business?.id) return [];
  const apiClient = new ApiClient("payments");
  const data = await apiClient.get(
    `/api/v1/payment-methods/business/${business.id}`,
  );
  return parseStringify(data);
};

export const fetchLocationPaymentMethods = async (): Promise<
  PaymentMethod[]
> => {
  await getAuthenticatedUser();
  const [business, location] = await Promise.all([
    getCurrentBusiness(),
    getCurrentLocation(),
  ]);
  if (!business?.id || !location?.id) return [];
  const apiClient = new ApiClient("payments");
  const data = await apiClient.get(
    `/api/v1/payment-methods/location/${location.id}/business/${business.id}`,
  );
  return parseStringify(data);
};

export const toggleLocationPaymentMethod = async (
  paymentMethodId: string,
  enabled: boolean,
): Promise<void> => {
  await getAuthenticatedUser();
  const location = await getCurrentLocation();
  if (!location?.id) throw new Error("No active location");
  const apiClient = new ApiClient("payments");
  await apiClient.put(
    `/api/v1/payment-methods/location/${location.id}/method/${paymentMethodId}`,
    { enabled },
  );
  revalidatePath("/settings");
};

export const initializeLocationPaymentMethods = async (): Promise<void> => {
  await getAuthenticatedUser();
  const location = await getCurrentLocation();
  if (!location?.id) throw new Error("No active location");
  const apiClient = new ApiClient("payments");
  await apiClient.put(
    `/api/v1/payment-methods/location/${location.id}/initialize`,
    {},
  );
  revalidatePath("/settings");
};

// ──────────────────────────────────────────────────────────────────────
// Providers (admin controller on the payments service)
// ──────────────────────────────────────────────────────────────────────

export const fetchProviders = async (): Promise<Provider[]> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient("payments");
  const data = await apiClient.get("/api/v1/admin/providers");
  return parseStringify(data);
};

export const fetchProvider = async (slug: string): Promise<Provider> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient("payments");
  const data = await apiClient.get(`/api/v1/admin/providers/${slug}`);
  return parseStringify(data);
};

export const fetchBusinessProviderConfigs = async (): Promise<
  BusinessProviderConfig[]
> => {
  await getAuthenticatedUser();
  const business = await getCurrentBusiness();
  if (!business?.id) return [];
  const apiClient = new ApiClient("payments");
  const data = await apiClient.get(
    `/api/v1/admin/providers/business/${business.id}`,
  );
  return parseStringify(data);
};

export const configureBusinessProvider = async (
  config: ConfigureProviderRequest,
): Promise<BusinessProviderConfig> => {
  await getAuthenticatedUser();
  const business = await getCurrentBusiness();
  if (!business?.id) throw new Error("No active business");
  const apiClient = new ApiClient("payments");
  const data = await apiClient.post(
    `/api/v1/admin/providers/business/${business.id}`,
    { ...config, businessId: business.id },
  );
  revalidatePath("/settings");
  return parseStringify(data);
};

export const updateBusinessProvider = async (
  slug: string,
  config: ConfigureProviderRequest,
): Promise<BusinessProviderConfig> => {
  await getAuthenticatedUser();
  const business = await getCurrentBusiness();
  if (!business?.id) throw new Error("No active business");
  const apiClient = new ApiClient("payments");
  const data = await apiClient.put(
    `/api/v1/admin/providers/business/${business.id}/${slug}`,
    { ...config, businessId: business.id },
  );
  revalidatePath("/settings");
  return parseStringify(data);
};

export const removeBusinessProvider = async (slug: string): Promise<void> => {
  await getAuthenticatedUser();
  const business = await getCurrentBusiness();
  if (!business?.id) throw new Error("No active business");
  const apiClient = new ApiClient("payments");
  await apiClient.delete(
    `/api/v1/admin/providers/business/${business.id}/${slug}`,
  );
  revalidatePath("/settings");
};

export const fetchLocationOverrides = async (): Promise<LocationOverride[]> => {
  await getAuthenticatedUser();
  const [business, location] = await Promise.all([
    getCurrentBusiness(),
    getCurrentLocation(),
  ]);
  if (!business?.id || !location?.id) return [];
  const apiClient = new ApiClient("payments");
  const data = await apiClient.get(
    `/api/v1/admin/providers/business/${business.id}/location/${location.id}`,
  );
  return parseStringify(data);
};

export const setLocationOverride = async (
  slug: string,
  override: LocationOverride,
): Promise<void> => {
  await getAuthenticatedUser();
  const [business, location] = await Promise.all([
    getCurrentBusiness(),
    getCurrentLocation(),
  ]);
  if (!business?.id || !location?.id)
    throw new Error("No active business or location");
  const apiClient = new ApiClient("payments");
  await apiClient.post(
    `/api/v1/admin/providers/business/${business.id}/location/${location.id}/${slug}/override`,
    override,
  );
  revalidatePath("/settings");
};

export const removeLocationOverride = async (slug: string): Promise<void> => {
  await getAuthenticatedUser();
  const [business, location] = await Promise.all([
    getCurrentBusiness(),
    getCurrentLocation(),
  ]);
  if (!business?.id || !location?.id)
    throw new Error("No active business or location");
  const apiClient = new ApiClient("payments");
  await apiClient.delete(
    `/api/v1/admin/providers/business/${business.id}/location/${location.id}/${slug}/override`,
  );
  revalidatePath("/settings");
};
