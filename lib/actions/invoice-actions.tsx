"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { ApiResponse, FormResponse } from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {getCurrentLocation} from "@/lib/actions/business/get-current-business";
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
            `/api/location-invoices/${location?.id}`,
            query,
        );

       console.log("The invoice response is:", invoiceResponse);

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
    
    const payload = {
        ...validatedInvoiceData.data,
    };

   



    try {
        const apiClient = new ApiClient();

       const response = await apiClient.post(
            `/api/location-invoices/${location?.id}/create`,
            payload
        );

    
        return parseStringify(response);
       
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/invoices");
    
};


export const payInvoice = async (id: UUID, email: string, phone: string)=> {
    if (!id) throw new Error("Invoice ID is required to perform this request");

    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        
        const payload = {
            email: email,
            phone: phone,
            provider: "SELCOM"
        }

        const response = await apiClient.post(`/api/location-invoice-payments/${id}/create`, payload);

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

    console.log("The invoice data is:", invoiceData);

    return parseStringify(invoiceData);
};

export const getInvoiceById = async (id: UUID) => {
    const apiClient = new ApiClient();
    
    try {
        const location = await getCurrentLocation();
        const invoice = await apiClient.get(
            `/api/location-invoices/${location?.id}/${id}`
        );
        
        return parseStringify(invoice)

    } catch (error) {
        throw error
    }
}




