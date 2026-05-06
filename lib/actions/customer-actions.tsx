"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import {
  BulkGroupChangeSchema,
  CustomerAddressSchema,
  CustomerGroupSchema,
  CustomerPreferenceSchema,
  CustomerSchema,
} from "@/types/customer/schema";
import {
  Customer,
  CustomerAddress,
  CustomerGroup,
  CustomerPreference,
} from "@/types/customer/type";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";

// ─── Helpers ─────────────────────────────────────────────────────────

const customerMatchesQuery = (customer: Customer, query: string): boolean => {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    customer.firstName,
    customer.lastName,
    customer.fullName,
    customer.phoneNumber,
    customer.email,
    customer.customerAccountNumber,
    customer.identifier,
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle));
};

const groupMatchesQuery = (group: CustomerGroup, query: string): boolean => {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [group.name, group.description, group.identifier]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle));
};

const buildPagedResponse = <T,>(
  items: T[],
  page: number,
  pageLimit: number,
): ApiResponse<T> => {
  const size = pageLimit > 0 ? pageLimit : 10;
  // Dashboard pager is 1-indexed (?page=1 is the first page); convert to a
  // 0-indexed slice index here. Without this, ?page=1 was returning the
  // second slice — empty for most accounts, producing a flash-then-blank.
  const pageIndex = Math.max(0, (page > 0 ? page : 1) - 1);
  const totalElements = items.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
  const start = pageIndex * size;
  const content = items.slice(start, start + size);

  return parseStringify({
    content,
    totalElements,
    totalPages,
    size,
    number: pageIndex,
    first: pageIndex === 0,
    last: pageIndex >= Math.max(0, totalPages - 1),
    numberOfElements: content.length,
    empty: content.length === 0,
    pageable: {
      totalElements,
      pageNumber: pageIndex,
      pageSize: size,
      sort: { empty: true, unsorted: true, sorted: false },
      offset: start,
      paged: true,
      unpaged: false,
    },
    sort: { empty: true, unsorted: true, sorted: false },
    data: null,
    warehouseStockRequestStatus: "",
  });
};

const buildErrorResponse = (
  fallbackMessage: string,
  error: unknown,
): FormResponse => {
  const message =
    (error as { message?: string; details?: { message?: string } })?.message ||
    (error as { details?: { message?: string } })?.details?.message ||
    fallbackMessage;
  return {
    responseType: "error",
    message,
    error: error instanceof Error ? error : new Error(String(message)),
  };
};

// ─── Customers ───────────────────────────────────────────────────────

export const fetchAllCustomers = async (
  options: { includeInactive?: boolean } = {},
): Promise<Customer[]> => {
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const params = new URLSearchParams();
  if (location?.id) params.append("locationId", String(location.id));
  if (options.includeInactive) params.append("includeInactive", "true");
  const query = params.toString();
  const data = await apiClient.get<Customer[]>(
    `/api/v1/customers${query ? `?${query}` : ""}`,
  );
  return parseStringify(data);
};

export const searchCustomer = async (
  q: string,
  page: number,
  pageLimit: number,
  active?: boolean,
): Promise<ApiResponse<Customer>> => {
  const customers = await fetchAllCustomers({ includeInactive: true });
  let filtered = q ? customers.filter((c) => customerMatchesQuery(c, q)) : customers;
  if (active !== undefined) {
    filtered = filtered.filter((c) => c.active === active);
  }
  return buildPagedResponse(filtered, page, pageLimit);
};

/**
 * Roll-up counts for the list KPI strip and status tabs. Computed from
 * the full customer list so `Active` / `Inactive` totals stay in sync
 * regardless of which tab the page is currently rendering.
 */
export const getCustomerCount = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
}> => {
  const customers = await fetchAllCustomers({ includeInactive: true });
  let active = 0;
  let inactive = 0;
  for (const c of customers) {
    if (c.active) active += 1;
    else inactive += 1;
  }
  return { total: customers.length, active, inactive };
};

/**
 * Aggregate stats used by the list-page KPI strip — loyalty totals,
 * credit-line coverage, and no-show counts. Derived from the full
 * customer list so the figures remain stable across pages and tabs.
 */
export const getCustomerSummaryStats = async (): Promise<{
  loyaltyPointsTotal: number;
  creditLimitCount: number;
  withEmail: number;
  noShowCustomers: number;
}> => {
  const customers = await fetchAllCustomers({ includeInactive: true });
  let loyaltyPointsTotal = 0;
  let creditLimitCount = 0;
  let withEmail = 0;
  let noShowCustomers = 0;
  for (const c of customers) {
    loyaltyPointsTotal += c.loyaltyPoints ?? 0;
    if ((c.creditLimit ?? 0) > 0) creditLimitCount += 1;
    if (c.email) withEmail += 1;
    if ((c.noShowCount ?? 0) > 0) noShowCustomers += 1;
  }
  return { loyaltyPointsTotal, creditLimitCount, withEmail, noShowCustomers };
};

export const getCustomer = async (id: UUID): Promise<Customer> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get<Customer>(`/api/v1/customers/${id}`);
  return parseStringify(data);
};

export const getCustomerById = async (id: UUID): Promise<Customer> => getCustomer(id);

export const createCustomer = async (
  customer: z.infer<typeof CustomerSchema>,
): Promise<FormResponse | void> => {
  const validated = CustomerSchema.safeParse(customer);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  const [business, location] = await Promise.all([
    getCurrentBusiness(),
    getCurrentLocation(),
  ]);

  if (!business?.id || !location?.id) {
    return parseStringify({
      responseType: "error",
      message: "Active business or location not selected",
      error: new Error("Missing business/location context"),
    } satisfies FormResponse);
  }

  const payload = {
    ...validated.data,
    businessId: business.id,
    locationId: location.id,
  };

  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/customers`, payload);
  } catch (error) {
    console.error("Error creating customer", error);
    return parseStringify(buildErrorResponse("Failed to create customer", error));
  }

  revalidatePath("/customers");
  return parseStringify({
    responseType: "success",
    message: "Customer created successfully",
  } satisfies FormResponse);
};

export const updateCustomer = async (
  id: UUID,
  customer: z.infer<typeof CustomerSchema>,
): Promise<FormResponse | void> => {
  const validated = CustomerSchema.safeParse(customer);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/customers/${id}`, validated.data);
  } catch (error) {
    console.error("Error updating customer", error);
    return parseStringify(buildErrorResponse("Failed to update customer", error));
  }

  revalidatePath("/customers");
  return parseStringify({
    responseType: "success",
    message: "Customer updated successfully",
  } satisfies FormResponse);
};

export const deleteCustomer = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Customer ID is required to perform this request");
  const apiClient = new ApiClient();
  await apiClient.delete(`/api/v1/customers/${id}`);
  revalidatePath("/customers");
};

export const deactivateCustomer = async (id: UUID | string): Promise<void> => {
  const apiClient = new ApiClient();
  await apiClient.post(`/api/v1/customers/${id}/deactivate`, {});
  revalidatePath("/customers");
};

export const reactivateCustomer = async (id: UUID | string): Promise<void> => {
  const apiClient = new ApiClient();
  await apiClient.post(`/api/v1/customers/${id}/reactivate`, {});
  revalidatePath("/customers");
};

// ─── Customer Groups ─────────────────────────────────────────────────

export const fetchCustomerGroups = async (
  options: { includeInactive?: boolean } = {},
): Promise<CustomerGroup[]> => {
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  if (!location?.id) return [];
  const params = new URLSearchParams({ locationId: String(location.id) });
  if (options.includeInactive) params.append("includeInactive", "true");
  const data = await apiClient.get<CustomerGroup[]>(
    `/api/v1/customer-groups?${params.toString()}`,
  );
  return parseStringify(data);
};

export const searchCustomerGroups = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<CustomerGroup>> => {
  const groups = await fetchCustomerGroups({ includeInactive: true });
  const filtered = q ? groups.filter((g) => groupMatchesQuery(g, q)) : groups;
  return buildPagedResponse(filtered, page, pageLimit);
};

export const getCustomerGroup = async (id: UUID): Promise<CustomerGroup> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get<CustomerGroup>(`/api/v1/customer-groups/${id}`);
  return parseStringify(data);
};

export const createCustomerGroup = async (
  group: z.infer<typeof CustomerGroupSchema>,
): Promise<FormResponse | void> => {
  const validated = CustomerGroupSchema.safeParse(group);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  const [business, location] = await Promise.all([
    getCurrentBusiness(),
    getCurrentLocation(),
  ]);

  if (!business?.id || !location?.id) {
    return parseStringify({
      responseType: "error",
      message: "Active business or location not selected",
      error: new Error("Missing business/location context"),
    } satisfies FormResponse);
  }

  const payload = {
    ...validated.data,
    businessId: business.id,
    locationId: location.id,
  };

  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/customer-groups`, payload);
  } catch (error) {
    console.error("Error creating customer group", error);
    return parseStringify(
      buildErrorResponse("Failed to create customer group", error),
    );
  }

  revalidatePath("/customer-groups");
  return parseStringify({
    responseType: "success",
    message: "Customer group created successfully",
  } satisfies FormResponse);
};

export const updateCustomerGroup = async (
  id: UUID,
  group: z.infer<typeof CustomerGroupSchema>,
): Promise<FormResponse | void> => {
  const validated = CustomerGroupSchema.safeParse(group);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/customer-groups/${id}`, validated.data);
  } catch (error) {
    console.error("Error updating customer group", error);
    return parseStringify(
      buildErrorResponse("Failed to update customer group", error),
    );
  }

  revalidatePath("/customer-groups");
  return parseStringify({
    responseType: "success",
    message: "Customer group updated successfully",
  } satisfies FormResponse);
};

export const deleteCustomerGroup = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Customer group ID is required");
  const apiClient = new ApiClient();
  await apiClient.delete(`/api/v1/customer-groups/${id}`);
  revalidatePath("/customer-groups");
};

export const addCustomersToGroup = async (
  data: z.infer<typeof BulkGroupChangeSchema>,
): Promise<FormResponse | void> => {
  const validated = BulkGroupChangeSchema.safeParse(data);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please provide a valid group and customers",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  const location = await getCurrentLocation();
  if (!location?.id) {
    return parseStringify({
      responseType: "error",
      message: "Active location not selected",
      error: new Error("Missing location context"),
    } satisfies FormResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/v1/customers/bulk/add-to-group?locationId=${location.id}`,
      validated.data,
    );
  } catch (error) {
    return parseStringify(
      buildErrorResponse("Failed to add customers to group", error),
    );
  }

  revalidatePath("/customers");
  revalidatePath("/customer-groups");
  return parseStringify({
    responseType: "success",
    message: "Customers added to group successfully",
  } satisfies FormResponse);
};

export const removeCustomersFromGroup = async (
  data: z.infer<typeof BulkGroupChangeSchema>,
): Promise<FormResponse | void> => {
  const validated = BulkGroupChangeSchema.safeParse(data);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please provide a valid group and customers",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  const location = await getCurrentLocation();
  if (!location?.id) {
    return parseStringify({
      responseType: "error",
      message: "Active location not selected",
      error: new Error("Missing location context"),
    } satisfies FormResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/v1/customers/bulk/remove-from-group?locationId=${location.id}`,
      validated.data,
    );
  } catch (error) {
    return parseStringify(
      buildErrorResponse("Failed to remove customers from group", error),
    );
  }

  revalidatePath("/customers");
  revalidatePath("/customer-groups");
  return parseStringify({
    responseType: "success",
    message: "Customers removed from group successfully",
  } satisfies FormResponse);
};

// ─── Customer Addresses ──────────────────────────────────────────────

export const fetchCustomerAddresses = async (
  customerId: UUID,
): Promise<CustomerAddress[]> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get<CustomerAddress[]>(
    `/api/v1/customers/${customerId}/addresses`,
  );
  return parseStringify(data);
};

export const getCustomerAddress = async (
  customerId: UUID,
  addressId: UUID,
): Promise<CustomerAddress> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get<CustomerAddress>(
    `/api/v1/customers/${customerId}/addresses/${addressId}`,
  );
  return parseStringify(data);
};

export const createCustomerAddress = async (
  customerId: UUID,
  address: z.infer<typeof CustomerAddressSchema>,
): Promise<FormResponse | void> => {
  const validated = CustomerAddressSchema.safeParse(address);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/v1/customers/${customerId}/addresses`,
      validated.data,
    );
  } catch (error) {
    return parseStringify(buildErrorResponse("Failed to add address", error));
  }

  revalidatePath("/customers");
  return parseStringify({
    responseType: "success",
    message: "Address added successfully",
  } satisfies FormResponse);
};

export const updateCustomerAddress = async (
  customerId: UUID,
  addressId: UUID,
  address: z.infer<typeof CustomerAddressSchema>,
): Promise<FormResponse | void> => {
  const validated = CustomerAddressSchema.safeParse(address);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/v1/customers/${customerId}/addresses/${addressId}`,
      validated.data,
    );
  } catch (error) {
    return parseStringify(buildErrorResponse("Failed to update address", error));
  }

  revalidatePath("/customers");
  return parseStringify({
    responseType: "success",
    message: "Address updated successfully",
  } satisfies FormResponse);
};

export const deleteCustomerAddress = async (
  customerId: UUID,
  addressId: UUID,
): Promise<void> => {
  const apiClient = new ApiClient();
  await apiClient.delete(
    `/api/v1/customers/${customerId}/addresses/${addressId}`,
  );
  revalidatePath("/customers");
};

// ─── Customer Preferences ────────────────────────────────────────────

export const fetchCustomerPreferences = async (
  customerId: UUID,
): Promise<CustomerPreference[]> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get<CustomerPreference[]>(
    `/api/v1/customers/${customerId}/preferences`,
  );
  return parseStringify(data);
};

export const getCustomerPreference = async (
  customerId: UUID,
  preferenceId: UUID,
): Promise<CustomerPreference> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get<CustomerPreference>(
    `/api/v1/customers/${customerId}/preferences/${preferenceId}`,
  );
  return parseStringify(data);
};

export const createCustomerPreference = async (
  customerId: UUID,
  preference: z.infer<typeof CustomerPreferenceSchema>,
): Promise<FormResponse | void> => {
  const validated = CustomerPreferenceSchema.safeParse(preference);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/v1/customers/${customerId}/preferences`,
      validated.data,
    );
  } catch (error) {
    return parseStringify(buildErrorResponse("Failed to add preference", error));
  }

  revalidatePath("/customers");
  return parseStringify({
    responseType: "success",
    message: "Preference added successfully",
  } satisfies FormResponse);
};

export const updateCustomerPreference = async (
  customerId: UUID,
  preferenceId: UUID,
  preference: z.infer<typeof CustomerPreferenceSchema>,
): Promise<FormResponse | void> => {
  const validated = CustomerPreferenceSchema.safeParse(preference);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    } satisfies FormResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/v1/customers/${customerId}/preferences/${preferenceId}`,
      validated.data,
    );
  } catch (error) {
    return parseStringify(buildErrorResponse("Failed to update preference", error));
  }

  revalidatePath("/customers");
  return parseStringify({
    responseType: "success",
    message: "Preference updated successfully",
  } satisfies FormResponse);
};

export const deleteCustomerPreference = async (
  customerId: UUID,
  preferenceId: UUID,
): Promise<void> => {
  const apiClient = new ApiClient();
  await apiClient.delete(
    `/api/v1/customers/${customerId}/preferences/${preferenceId}`,
  );
  revalidatePath("/customers");
};
