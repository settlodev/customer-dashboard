
"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { ApiResponse, FormResponse } from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {getCurrentBusiness, getCurrentLocation} from "@/lib/actions/business/get-current-business";
import { Expense, ExpenseReport } from "@/types/expense/type";
import { ExpenseSchema } from "@/types/expense/schema";
import { Invoice } from "@/types/invoice/type";
import { InvoiceSchema } from "@/types/invoice/schema";



export const searchInvoices = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Invoice>> => {
    await getAuthenticatedUser();

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
                    key: "invoiceNumber",
                    direction: "ASC",
                },
            ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10,
        };

        const location = await getCurrentLocation();

        const invoiceResponse = await apiClient.post(
            `/api/invoices/${location?.id}`,
            query,
        );

        return parseStringify(invoiceResponse);
    } catch (error) {
        throw error;
    }
};

export const createInvoice = async (
    invoice: z.infer<typeof InvoiceSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedInvoiceData = InvoiceSchema.safeParse(invoice);

    if (!validatedInvoiceData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedInvoiceData.error.message),
        };

        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();
  
    const payload = {
        ...validatedInvoiceData.data,
        location: location?.id,
       
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.post(
            `/api/invoices/${location?.id}/create`,
            payload
        );

        formResponse = {
            responseType: "success",
            message: "Invoice successfully created!",
        };
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/invoices");
    return parseStringify(formResponse);
};

export const updateInvoice = async (
    id: UUID,
    invoice: z.infer<typeof InvoiceSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validatedInvoiceData = InvoiceSchema.safeParse(invoice);

    if (!validatedInvoiceData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validatedInvoiceData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();

    const payload = {
        ...validatedInvoiceData.data,
        location: location?.id,
      
    };

    try {
        const apiClient = new ApiClient();

      await apiClient.put(
            `/api/invoices/${location?.id}/${id}`, 
            payload
        );

        formResponse = {
            responseType: "success",
            message: "Expense successfully updated!",
        };

    } catch (error) {
        console.error("Error updating expense", error); 
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/expenses");
    return parseStringify(formResponse);
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
        `/api/invoices/${location?.id}`,
        query,
    );

    return parseStringify(invoiceData);
};

export const deleteExpense = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Expense ID is required to perform this request");
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();

        await apiClient.delete(`/api/expenses/${location?.id}/${id}`);
        revalidatePath("/expenses");
    } catch (error) {
        throw error;
    }
};


