"use server";

import { z } from "zod";
import {
  CustomerSchema,
  CustomerAddressSchema,
  CustomerPreferenceSchema,
  CustomerGroupSchema,
  CustomersGroupChangeSchema,
} from "@/types/customer/schema";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import {
  Customer,
  CustomerAddress,
  CustomerPreference,
  CustomerGroup,
} from "@/types/customer/type";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";

// ─── Customers ───────────────────────────────────────────────────────

export const fetchAllCustomers = async (): Promise<Customer[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const customerData = await apiClient.get(
      `/api/v1/customers?locationId=${location?.id}`,
    );
    return parseStringify(customerData);
  } catch (error) {
    throw error;
  }
};

export const searchCustomer = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Customer>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = new URLSearchParams({
      search: q,
      page: String(page ? page - 1 : 0),
      size: String(pageLimit ? pageLimit : 10),
      locationId: String(location?.id),
    });
    const customerData = await apiClient.get(
      `/api/v1/customers?${params.toString()}`,
    );
    return parseStringify(customerData);
  } catch (error) {
    throw error;
  }
};

export const createCustomer = async (
  customer: z.infer<typeof CustomerSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const customerValidData = CustomerSchema.safeParse(customer);

  if (!customerValidData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(customerValidData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  const payload = {
    ...customerValidData.data,
    location: location?.id,
  };

  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/customers`, payload);
    formResponse = {
      responseType: "success",
      message: "Customer created successfully",
    };
  } catch (error: any) {
    console.error("Error creating customer", error);
    const apiMessage = error?.message || error?.details?.message;
    formResponse = {
      responseType: "error",
      message: apiMessage || "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(apiMessage || error)),
    };
  }

  if (formResponse?.responseType === "error")
    return parseStringify(formResponse);

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

export const getCustomer = async (
  id: UUID,
): Promise<Customer> => {
  const apiClient = new ApiClient();
  const customerResponse = await apiClient.get(`/api/v1/customers/${id}`);
  return parseStringify(customerResponse);
};

export const getCustomerById = async (id: UUID): Promise<Customer> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const data = await apiClient.get(`/api/v1/customers/${id}`);
  return parseStringify(data);
};

export const updateCustomer = async (
  id: UUID,
  customer: z.infer<typeof CustomerSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const customerValidData = CustomerSchema.safeParse(customer);

  if (!customerValidData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(customerValidData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();
  const payload = {
    ...customerValidData.data,
    location: location?.id,
  };

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/customers/${id}`, payload);
    formResponse = {
      responseType: "success",
      message: "Customer updated successfully",
    };
  } catch (error: any) {
    const apiMessage = error?.message || error?.details?.message;
    formResponse = {
      responseType: "error",
      message: apiMessage || "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(apiMessage || error)),
    };
  }

  if (formResponse?.responseType === "error")
    return parseStringify(formResponse);

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

export const deleteCustomer = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Customer ID is required to perform this request");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/customers/${id}`);
    revalidatePath("/customers");
  } catch (error) {
    throw error;
  }
};

export const deactivateCustomer = async (id: string): Promise<void> => {
  const apiClient = new ApiClient();
  await apiClient.post(`/api/v1/customers/${id}/deactivate`, {});
  revalidatePath("/customers");
};

export const reactivateCustomer = async (id: string): Promise<void> => {
  const apiClient = new ApiClient();
  await apiClient.post(`/api/v1/customers/${id}/reactivate`, {});
  revalidatePath("/customers");
};

// ─── Customer Groups ─────────────────────────────────────────────────

export const fetchCustomerGroups = async (): Promise<CustomerGroup[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/customer-groups`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const searchCustomerGroups = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<CustomerGroup>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      search: q,
      page: String(page ? page - 1 : 0),
      size: String(pageLimit ? pageLimit : 10),
    });
    const data = await apiClient.get(
      `/api/v1/customer-groups?${params.toString()}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createCustomerGroup = async (
  group: z.infer<typeof CustomerGroupSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = CustomerGroupSchema.safeParse(group);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/customer-groups`, validated.data);
    formResponse = {
      responseType: "success",
      message: "Customer group created successfully",
    };
  } catch (error) {
    console.error("Error creating customer group", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

export const updateCustomerGroup = async (
  id: UUID,
  group: z.infer<typeof CustomerGroupSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = CustomerGroupSchema.safeParse(group);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/customer-groups/${id}`, validated.data);
    formResponse = {
      responseType: "success",
      message: "Customer group updated successfully",
    };
  } catch (error) {
    console.error("Error updating customer group", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

export const deleteCustomerGroup = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Customer group ID is required");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/customer-groups/${id}`);
    revalidatePath("/customers");
  } catch (error) {
    throw error;
  }
};

export const addCustomersToGroup = async (
  data: z.infer<typeof CustomersGroupChangeSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/customers/bulk/add-to-group`, data);
    formResponse = {
      responseType: "success",
      message: "Customers added to group successfully",
    };
  } catch (error) {
    formResponse = {
      responseType: "error",
      message: "Failed to add customers to group",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

export const removeCustomersFromGroup = async (
  data: z.infer<typeof CustomersGroupChangeSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/customers/bulk/remove-from-group`, data);
    formResponse = {
      responseType: "success",
      message: "Customers removed from group successfully",
    };
  } catch (error) {
    formResponse = {
      responseType: "error",
      message: "Failed to remove customers from group",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

// ─── Customer Addresses ──────────────────────────────────────────────

export const fetchCustomerAddresses = async (
  customerId: UUID,
): Promise<CustomerAddress[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      `/api/v1/customers/${customerId}/addresses`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createCustomerAddress = async (
  customerId: UUID,
  address: z.infer<typeof CustomerAddressSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = CustomerAddressSchema.safeParse(address);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/v1/customers/${customerId}/addresses`,
      validated.data,
    );
    formResponse = {
      responseType: "success",
      message: "Address added successfully",
    };
  } catch (error) {
    formResponse = {
      responseType: "error",
      message: "Failed to add address",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

export const updateCustomerAddress = async (
  customerId: UUID,
  addressId: UUID,
  address: z.infer<typeof CustomerAddressSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = CustomerAddressSchema.safeParse(address);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/v1/customers/${customerId}/addresses/${addressId}`,
      validated.data,
    );
    formResponse = {
      responseType: "success",
      message: "Address updated successfully",
    };
  } catch (error) {
    formResponse = {
      responseType: "error",
      message: "Failed to update address",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

export const deleteCustomerAddress = async (
  customerId: UUID,
  addressId: UUID,
): Promise<void> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      `/api/v1/customers/${customerId}/addresses/${addressId}`,
    );
    revalidatePath("/customers");
  } catch (error) {
    throw error;
  }
};

// ─── Customer Preferences ────────────────────────────────────────────

export const fetchCustomerPreferences = async (
  customerId: UUID,
): Promise<CustomerPreference[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      `/api/v1/customers/${customerId}/preferences`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createCustomerPreference = async (
  customerId: UUID,
  preference: z.infer<typeof CustomerPreferenceSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = CustomerPreferenceSchema.safeParse(preference);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/v1/customers/${customerId}/preferences`,
      validated.data,
    );
    formResponse = {
      responseType: "success",
      message: "Preference added successfully",
    };
  } catch (error) {
    formResponse = {
      responseType: "error",
      message: "Failed to add preference",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

export const updateCustomerPreference = async (
  customerId: UUID,
  preferenceId: UUID,
  preference: z.infer<typeof CustomerPreferenceSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = CustomerPreferenceSchema.safeParse(preference);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/v1/customers/${customerId}/preferences/${preferenceId}`,
      validated.data,
    );
    formResponse = {
      responseType: "success",
      message: "Preference updated successfully",
    };
  } catch (error) {
    formResponse = {
      responseType: "error",
      message: "Failed to update preference",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/customers");
  return parseStringify(formResponse);
};

export const deleteCustomerPreference = async (
  customerId: UUID,
  preferenceId: UUID,
): Promise<void> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      `/api/v1/customers/${customerId}/preferences/${preferenceId}`,
    );
    revalidatePath("/customers");
  } catch (error) {
    throw error;
  }
};
