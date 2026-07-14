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
    const customerData = await apiClient.get(`/api/customers/${location?.id}`);
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
    const query = {
      filters: [
        {
          key: "firstName",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
        {
          key: "isArchived",
          operator: "EQUAL",
          field_type: "BOOLEAN",
          value: false,
        },
      ],
      sorts: [
        {
          key: "firstName",
          direction: "ASC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };
    const location = await getCurrentLocation();
    const customerData = await apiClient.post(
      `/api/customers/${location?.id}`,
      query,
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
    await apiClient.post(`/api/customers/${location?.id}/create`, payload);
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
): Promise<ApiResponse<Customer>> => {
  const apiClient = new ApiClient();
  const query = {
    filters: [
      {
        key: "id",
        operator: "EQUAL",
        field_type: "UUID_STRING",
        value: id,
      },
    ],
    sorts: [],
    page: 0,
    size: 1,
  };
  const location = await getCurrentLocation();
  const customerResponse = await apiClient.post(
    `/api/customers/${location?.id}`,
    query,
  );
  return parseStringify(customerResponse);
};

export const getCustomerById = async (id: UUID): Promise<Customer> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const data = await apiClient.get(
    `/api/customers/${location?.id}/${id}`,
  );
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
    await apiClient.put(`/api/customers/${location?.id}/${id}`, payload);
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
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/customers/${location?.id}/${id}`);
    revalidatePath("/customers");
  } catch (error) {
    throw error;
  }
};

export const archiveCustomer = async (ids: string | string[]): Promise<void> => {
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();

  const customerIds = Array.isArray(ids) ? ids : [ids];

  await apiClient.put(`/api/customers/${location?.id}/archive`, customerIds);
  revalidatePath("/customers");
};

export const unarchiveCustomer = async (ids: string | string[]): Promise<void> => {
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();

  const customerIds = Array.isArray(ids) ? ids : [ids];

  await apiClient.put(`/api/customers/${location?.id}/unarchive`, customerIds);
  revalidatePath("/customers");
};

// ─── Customer Groups ─────────────────────────────────────────────────

export const fetchCustomerGroups = async (): Promise<CustomerGroup[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get(`/api/customer-groups/${location?.id}`);
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
    const location = await getCurrentLocation();
    const query = {
      filters: [
        {
          key: "name",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
      ],
      sorts: [{ key: "name", direction: "ASC" }],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };
    const data = await apiClient.post(
      `/api/customer-groups/${location?.id}`,
      query,
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

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/customer-groups/${location?.id}/create`,
      validated.data,
    );
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

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/customer-groups/${location?.id}/${id}`,
      validated.data,
    );
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
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/customer-groups/${location?.id}/${id}`);
    revalidatePath("/customers");
  } catch (error) {
    throw error;
  }
};

export const addCustomersToGroup = async (
  data: z.infer<typeof CustomersGroupChangeSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/customers/${location?.id}/add-to-group`, data);
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

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/customers/${location?.id}/remove-from-group`,
      data,
    );
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
    const location = await getCurrentLocation();
    const data = await apiClient.get(
      `/api/customer-addresses/${location?.id}/customers/${customerId}`,
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

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/customer-addresses/${location?.id}/customers/${customerId}`,
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

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/customer-addresses/${location?.id}/customers/${customerId}/${addressId}`,
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
    const location = await getCurrentLocation();
    await apiClient.delete(
      `/api/customer-addresses/${location?.id}/customers/${customerId}/${addressId}`,
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
    const location = await getCurrentLocation();
    const data = await apiClient.get(
      `/api/customer-preferences/${location?.id}/customers/${customerId}`,
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

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/customer-preferences/${location?.id}/customers/${customerId}`,
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

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/customer-preferences/${location?.id}/customers/${customerId}/${preferenceId}`,
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
    const location = await getCurrentLocation();
    await apiClient.delete(
      `/api/customer-preferences/${location?.id}/customers/${customerId}/${preferenceId}`,
    );
    revalidatePath("/customers");
  } catch (error) {
    throw error;
  }
};
