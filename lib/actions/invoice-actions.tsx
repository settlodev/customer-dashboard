"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { ApiResponse, FormResponse } from "@/types/types";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { Invoice } from "@/types/invoice/type";
import { InvoiceSchema } from "@/types/invoice/schema";

export const searchInvoices = async (
  q: string,
  page: number,
  pageLimit: number,
  locationId?: string,
): Promise<ApiResponse<Invoice>> => {
  await getAuthenticatedUser();

  let location;

  if (locationId) {
    location = { id: locationId };
  } else {
    location = await getCurrentBusiness();
  }
  try {
    const apiClient = new ApiClient();

    const query = {
      filters: [
        {
          key: "invoiceNumber",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
      ],
      sorts: [
        {
          key: "dateCreated",
          direction: "DESC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };

    const invoiceResponse = await apiClient.post(
      `/api/invoices/${location?.id}`,
      query,
    );

    // console.log("The invoice obtained are",invoiceResponse.content[0].locationSubscriptions)

    return parseStringify(invoiceResponse);
  } catch (error) {
    throw error;
  }
};

export const createInvoice = async (
  invoice: z.infer<typeof InvoiceSchema>,
  locationQueryParam?: string,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  let location;

  const hasLocationSubscriptions =
    invoice.locationSubscriptions && invoice.locationSubscriptions.length > 0;
  const hasLocationAddons =
    invoice.locationAddons && invoice.locationAddons.length > 0;
  const hasFreeStandingAddons =
    invoice.locationFreeStandingAddonSubscriptions &&
    invoice.locationFreeStandingAddonSubscriptions.length > 0;
  const hasWarehouseSubscriptions =
    invoice.warehouseSubscriptions && invoice.warehouseSubscriptions.length > 0;

  if (hasLocationSubscriptions || hasLocationAddons || hasFreeStandingAddons) {
    if (locationQueryParam) {
      location = { id: locationQueryParam };
    } else {
      location = await getCurrentLocation();
    }

    if (!location?.id) {
      formResponse = {
        responseType: "error",
        message: "Location ID is required for location-based subscriptions",
        error: new Error("Missing location ID"),
      };
      return parseStringify(formResponse);
    }
  }

  const invoiceWithLocationIds = { ...invoice };

  if (
    invoice.locationSubscriptions &&
    invoice.locationSubscriptions.length > 0
  ) {
    invoiceWithLocationIds.locationSubscriptions =
      invoice.locationSubscriptions.map((sub) => ({
        ...sub,
        locationId: location!.id,
      }));
  }

  if (invoice.locationFreeStandingAddonSubscriptions) {
    invoiceWithLocationIds.locationFreeStandingAddonSubscriptions =
      invoice.locationFreeStandingAddonSubscriptions;
  }

  if (invoice.warehouseSubscriptions) {
    invoiceWithLocationIds.warehouseSubscriptions =
      invoice.warehouseSubscriptions;
  }

  const validatedInvoiceData = InvoiceSchema.safeParse(invoiceWithLocationIds);

  if (!validatedInvoiceData.success) {
    console.error("Schema validation error:", validatedInvoiceData.error);
    formResponse = {
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedInvoiceData.error.message),
    };
    return parseStringify(formResponse);
  }

  if (
    !hasLocationSubscriptions &&
    !hasLocationAddons &&
    !hasFreeStandingAddons &&
    !hasWarehouseSubscriptions
  ) {
    formResponse = {
      responseType: "error",
      message: "Invoice must contain at least one subscription or addon item",
      error: new Error("No valid items in invoice"),
    };
    return parseStringify(formResponse);
  }

  const business = await getCurrentBusiness();

  const payload: any = {};

  if (hasLocationSubscriptions) {
    payload.locationSubscriptions =
      validatedInvoiceData.data.locationSubscriptions;
  }

  if (hasLocationAddons) {
    payload.locationAddons = validatedInvoiceData.data.locationAddons;
  }

  if (hasFreeStandingAddons) {
    payload.locationFreeStandingAddonSubscriptions =
      validatedInvoiceData.data.locationFreeStandingAddonSubscriptions;
  }

  if (hasWarehouseSubscriptions) {
    payload.warehouseSubscriptions =
      validatedInvoiceData.data.warehouseSubscriptions;
  }

  if (validatedInvoiceData.data.email) {
    payload.email = validatedInvoiceData.data.email;
  }

  if (validatedInvoiceData.data.phone) {
    payload.phone = validatedInvoiceData.data.phone;
  }

  if (validatedInvoiceData.data.discountCode) {
    payload.discountCode = validatedInvoiceData.data.discountCode;
  }

  if (validatedInvoiceData.data.discountAmount) {
    payload.discountAmount = validatedInvoiceData.data.discountAmount;
  }

  try {
    const apiClient = new ApiClient();

    const response = await apiClient.post(
      `/api/invoices/${business?.id}/create`,
      payload,
    );

    return parseStringify(response);
  } catch (error: unknown) {
    console.error("The error while creating invoice", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
    return parseStringify(formResponse);
  }

  revalidatePath("/invoices");
};

export const payInvoice = async (id: UUID, email: string, phone: string) => {
  if (!id) throw new Error("Invoice ID is required to perform this request");

  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const payload = {
      email: email,
      phoneNumber: phone,
      provider: "SELCOM",
    };

    const response = await apiClient.post(
      `/api/invoice-payments/${id}/create`,
      payload,
    );

    return parseStringify(response);
  } catch (error) {
    throw error;
  }
};

export const getInvoice = async (id: UUID): Promise<ApiResponse<Invoice>> => {
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

  const invoiceData = await apiClient.post(
    `/api/location-invoices/${location?.id}/${id}`,
    query,
  );

  return parseStringify(invoiceData);
};

export const getInvoiceById = async (id: UUID) => {
  const apiClient = new ApiClient();

  try {
    const location = await getCurrentLocation();
    const invoice = await apiClient.get(
      `/api/location-invoices/${location?.id}/${id}`,
    );

    return parseStringify(invoice);
  } catch (error) {
    throw error;
  }
};
