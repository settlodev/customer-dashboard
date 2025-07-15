'use server'
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { warehouseInvoiceSchema } from "@/types/warehouse/invoice/schema";
import { z } from "zod";
import { getCurrentWarehouse } from "./register-action";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { UUID } from "crypto";

export const searchWarehousesSubscriptionPackages = async (
): Promise<ApiResponse<any>> => {

    
        const q = "";
        const page = 0;
        const pageLimit = 10;
    try {
        
        const query = {
            q,
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10,
        };


        const apiClient = new ApiClient();
        const data = await apiClient.post(
            `/api/warehouse-subscription-packages`,
            query
        );

        return parseStringify(data);

    } catch (error) {
        console.error('Error in search warehouses packages:', error);
        throw error;
    }
};

export const createWarehouseInvoice = async (
    invoice: z.infer<typeof warehouseInvoiceSchema>
    
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    
    
    const validatedInvoiceData = warehouseInvoiceSchema.safeParse(invoice);

    if (!validatedInvoiceData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedInvoiceData.error.message),
        };

        return parseStringify(formResponse);
    }

   
        
        const warehouse = await getCurrentWarehouse();

        console.log('Retrieved warehouse:', warehouse);
    
    
    const payload = {
        ...validatedInvoiceData.data,
    };

    

    try {
        const apiClient = new ApiClient();

       const response = await apiClient.post(
            `/api/warehouse-invoices/${warehouse?.id}/create`,
            payload
        );
    
        console.log('Invoice created successfully:', response);
        return parseStringify(response);
       
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

   
};


export const payWarehouseInvoice = async (id: UUID, email: string, phone: string)=> {
    if (!id) throw new Error("Invoice ID is required to perform this request");

    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        
        const payload = {
            email: email,
            phone: phone,
            provider: "SELCOM"
        }

        const response = await apiClient.post(`/api/warehouse-invoice-payments/${id}/create`, payload);

        return parseStringify(response);
    } catch (error) {
        throw error;
    }
};

export const verifyWarehousePayment = async (transactionId: string,invoice?:string) => {
 
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get(`/api/warehouse-invoice-payments/${invoice}/${transactionId}`);
        return parseStringify(response);
    } catch (error) {
        throw error;
    }
}

export const warehouseInvoices = async (
    page: number = 1,
    pageSize: number = 10,
    searchQuery: string = ""
  ): Promise<ApiResponse<any>> => {
    const apiClient = new ApiClient();
    const warehouse = await getCurrentWarehouse();
    
    try {
      const query = {
        filters: [
          {
            key: "invoiceNumber",
            operator: "LIKE",
            field_type: "STRING",
            value: searchQuery,
          },
        ],
        sorts: [
          {
            key: "dateCreated",
            direction: "DESC",
          },
        ],
        page: page - 1, // Convert to 0-based indexing
        size: pageSize,
      };
      
      const data = await apiClient.post(
        `/api/warehouse-invoices/${warehouse?.id}`,
        query
      );
  
      return parseStringify(data);
    } catch (error) {
      console.error('Error in search warehouses invoices:', error);
      throw error;
    }
  };