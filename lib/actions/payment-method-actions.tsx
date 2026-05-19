"use server";

import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "./business/get-current-business";
import {
  PaymentMethod,
  Provider,
  BusinessProviderConfig,
  ConfigureProviderRequest,
  LocationOverride,
} from "@/types/payments/type";

export const fetchAllPaymentMethods = async (): Promise<PaymentMethod[]> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const data = await apiClient.get("/payments/api/v1/payment-methods");
  return parseStringify(data);
};

export const fetchBusinessPaymentMethods = async (): Promise<
  PaymentMethod[]
> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const business = await getCurrentBusiness();
  const data = await apiClient.get(
    `/payments/api/v1/payment-methods/business/${business?.id}`,
  );
  return parseStringify(data);
};

export const fetchLocationPaymentMethods = async (): Promise<
  PaymentMethod[]
> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const business = await getCurrentBusiness();
  const data = await apiClient.get(
    `/payments/api/v1/payment-methods/location/${location?.id}/business/${business?.id}`,
  );
  return parseStringify(data);
};

export const toggleLocationPaymentMethod = async (
  paymentMethodId: string,
  enabled: boolean,
): Promise<void> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  await apiClient.put(
    `/payments/api/v1/payment-methods/location/${location?.id}/method/${paymentMethodId}`,
    { enabled },
  );
};

// --- Providers ---

export const fetchProviders = async (): Promise<Provider[]> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const data = await apiClient.get("/payments/api/v1/admin/providers");
  return parseStringify(data);
};

export const fetchProvider = async (slug: string): Promise<Provider> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const data = await apiClient.get(`/payments/api/v1/admin/providers/${slug}`);
  return parseStringify(data);
};

// --- Business Provider Configs ---

export const fetchBusinessProviderConfigs = async (): Promise<
  BusinessProviderConfig[]
> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const business = await getCurrentBusiness();
  const data = await apiClient.get(
    `/payments/api/v1/admin/providers/business/${business?.id}`,
  );
  return parseStringify(data);
};

export const configureBusinessProvider = async (
  config: ConfigureProviderRequest,
): Promise<BusinessProviderConfig> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const business = await getCurrentBusiness();
  const data = await apiClient.post(
    `/payments/api/v1/admin/providers/business/${business?.id}`,
    { ...config, businessId: business?.id },
  );
  return parseStringify(data);
};

export const updateBusinessProvider = async (
  slug: string,
  config: ConfigureProviderRequest,
): Promise<BusinessProviderConfig> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const business = await getCurrentBusiness();
  const data = await apiClient.put(
    `/payments/api/v1/admin/providers/business/${business?.id}/${slug}`,
    { ...config, businessId: business?.id },
  );
  return parseStringify(data);
};

export const removeBusinessProvider = async (slug: string): Promise<void> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const business = await getCurrentBusiness();
  await apiClient.delete(
    `/payments/api/v1/admin/providers/business/${business?.id}/${slug}`,
  );
};

// --- Location Overrides ---

export const fetchLocationOverrides = async (): Promise<LocationOverride[]> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const business = await getCurrentBusiness();
  const location = await getCurrentLocation();
  const data = await apiClient.get(
    `/payments/api/v1/admin/providers/business/${business?.id}/location/${location?.id}`,
  );
  return parseStringify(data);
};

export const setLocationOverride = async (
  slug: string,
  override: LocationOverride,
): Promise<void> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const business = await getCurrentBusiness();
  const location = await getCurrentLocation();
  await apiClient.post(
    `/payments/api/v1/admin/providers/business/${business?.id}/location/${location?.id}/${slug}/override`,
    override,
  );
};

export const removeLocationOverride = async (slug: string): Promise<void> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const business = await getCurrentBusiness();
  const location = await getCurrentLocation();
  await apiClient.delete(
    `/payments/api/v1/admin/providers/business/${business?.id}/location/${location?.id}/${slug}/override`,
  );
};
