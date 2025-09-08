"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import { console } from "node:inspector";
import { StockIntake } from "@/types/stock-intake/type";
import { StockIntakeSchema, UpdatedStockIntakeSchema } from "@/types/stock-intake/schema";
import { getCurrentWarehouse } from "./current-warehouse-action";


export const createStockIntakeForWarehouse = async (
    stockIntakes: any[] 
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const formatDateForAPI = (dateString: string): string => {
        if (!dateString) return dateString;
        
        if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
            return dateString;
        }
        
        const date = new Date(dateString);
        return date.toISOString();
    };

    // Transform dates before validation
    const transformedStockIntakes = stockIntakes.map(intake => ({
        ...intake,
        orderDate: formatDateForAPI(intake.orderDate),
        deliveryDate: formatDateForAPI(intake.deliveryDate),
        batchExpiryDate: intake.batchExpiryDate ? formatDateForAPI(intake.batchExpiryDate) : undefined,
    }));

    // Validate each stock intake item
    const validationResults = transformedStockIntakes.map(intake => StockIntakeSchema.safeParse(intake));
    const hasErrors = validationResults.some(result => !result.success);

    if (hasErrors) {
        const firstError = validationResults.find(result => !result.success);
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(firstError?.error.message || "Validation failed")
        };
        return parseStringify(formResponse);
    }

    const warehouse = await getCurrentWarehouse();
    
    const payload = transformedStockIntakes.map(intake => ({
        quantity: intake.quantity,
        value: intake.value,
        batchExpiryDate: intake.batchExpiryDate,
        deliveryDate: intake.deliveryDate,
        orderDate: intake.orderDate,
        stockVariant: intake.stockVariant,
        staff: intake.staff,
        supplier: intake.supplier,
        ...(typeof intake.purchasePaidAmount === 'number' && { 
            purchasePaidAmount: intake.purchasePaidAmount 
        })
    }));

    console.log("The payload passed is ", payload);

    try {
        const apiClient = new ApiClient();
        await apiClient.post(
            `/api/stock-intakes/${warehouse?.id}/all-with-warehouse/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: `${payload.length} Stock Intake${payload.length > 1 ? 's' : ''} recorded successfully`,
        };
    
} catch (error: any) {
    
    
    let errorMessage = "Something went wrong while processing your request, please try again";
    
    // Handle Axios error response
    if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
    } 
    // Handle custom error format
    else if (error?.message) {
        errorMessage = error.message;
    }

    formResponse = {
        responseType: "error",
        message: errorMessage,
        error: error instanceof Error ? error : new Error(errorMessage),
    };
    
    return formResponse; 
}
    
    revalidatePath("/warehouse-stock-intakes");
    return parseStringify(formResponse);
};

export const searchStockIntakesFromWarehouse = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<StockIntake>> => {
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        
      

        const query = {
            filters: [
                {
                    key: "stockVariant.stock.name",
                    operator: "LIKE",
                    field_type: "STRING",
                    value: q
                }
            ],
            sorts: [
                {
                    key: "dateCreated",
                    direction: "DESC"
                }
            ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10
        };

        console.log("The query payload is",query)

        const warehouse = await getCurrentWarehouse();
       
        const data = await apiClient.post(
            `/api/stock-intakes/${warehouse?.id}/all-with-warehouse`,
            query
        );
        
        return parseStringify(data);
    }
    catch (error) {
        throw error;
    }
};


export const updateStockIntakeFromWarehouse = async (
    id: UUID,
    stockIntake: z.infer<typeof UpdatedStockIntakeSchema>
): Promise<FormResponse | void> => {
    console.log("The values are",id,stockIntake)
    let formResponse: FormResponse | null = null;
    const validData = UpdatedStockIntakeSchema.safeParse(stockIntake);

    console.log("The validated data",validData)

    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message),
        };
        return parseStringify(formResponse);
    }


    const payload = {
        ...validData.data,
       
    };
    // console.log("The payload is",payload)

    try {
        const apiClient = new ApiClient();

        await apiClient.post(
            `/api/stock-intake-value-modifications/${id}`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Stock Intake Value updated successfully",
        };

    } catch (error) {
        console.error("Error updating stock", error);
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/stock-intakes");
   return parseStringify(formResponse);
};

export const getStockIntakeFromWarehouse = async (id:UUID, effectiveStockVariant:UUID) => {
    const apiClient = new ApiClient();
    
    try {

    const response = await apiClient.get(
        `/api/stock-intakes/${effectiveStockVariant}/${id}`)
   
    return parseStringify(response)

    } catch (error) {
        console.error("Error fetching stock intake:", error);
        throw error
    }
}


