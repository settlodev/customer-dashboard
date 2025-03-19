"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {UUID} from "node:crypto";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import { Stock, StockHistory } from "@/types/stock/type";
import { StockSchema } from "@/types/stock/schema";
import { console } from "node:inspector";

export const fetchStock = async () : Promise<Stock[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const data = await  apiClient.get(
            `/api/stock/${location?.id}`,
        );

        return parseStringify(data);

    }
    catch (error){
        throw error;
    }
}

export const searchStock = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Stock>> =>{
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"name",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const data = await  apiClient.post(
            `/api/stock/${location?.id}`,
            query
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}

export const createStock = async (
    stock: z.infer<typeof StockSchema>
): Promise<FormResponse | void> => {
    // console.log('Starting createStock with data:', stock);

    let formResponse: FormResponse | null = null;

    const validData = StockSchema.safeParse(stock);
    // console.log('Validating stock:', validData);
    if (!validData.success) {
        // console.warn('Stock validation failed:', validData.error);
        return parseStringify({
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message)
        });
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    // console.log('Retrieved location and business:', {
    //     locationId: location?.id,
    //     businessId: business?.id
    // });

    if (!location || !business) {
        console.error('Missing required data:', { location, business });
        return parseStringify({
            responseType: "error",
            message: "Could not retrieve required business data",
            error: new Error("Missing location or business data")
        });
    }

    const payload = {
        ...validData.data,
        location: location?.id,
        business: business?.id
    }
    // console.log("The payload is ",payload)

    try {
        const apiClient = new ApiClient();
        await apiClient.post(
            `/api/stock/${location?.id}/create`,
            payload
        );

        formResponse = {
            responseType: "success",
            message: "Stock created successfully",
        };
    }
    catch (error: any){
        const formattedError = await error;
        formResponse = {
            responseType: "error",
            message: formattedError.message,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse?.responseType === "error") return parseStringify(formResponse);

    revalidatePath("/stocks")
    redirect("/stocks");
}

export const getStock= async (id:UUID) : Promise<ApiResponse<Stock>> => {
    const apiClient = new ApiClient();
    const query ={
        filters:[
            {
                key: "id",
                operator: "EQUAL",
                field_type: "UUID_STRING",
                value: id,
            }
        ],
        sorts: [],
        page: 0,
        size: 1,
    }
    const location = await getCurrentLocation();
    const response = await apiClient.post(
        `/api/stock/${location?.id}`,
        query,
    );


    return parseStringify(response)
}


export const updateStock = async (
    id: UUID,
    stock: z.infer<typeof StockSchema>,
    paginationState?: { pageIndex: number; pageSize: number } | null
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    // Store the IDs before validation
    const variantIds = stock.stockVariants.map(variant => (variant as any).id);

    const validData = StockSchema.safeParse(stock);

    
    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();
    const payload = {
        ...validData.data,
        location: location?.id,
        business: business?.id,
        stockVariants: validData.data.stockVariants.map((variant, index) => ({
            ...variant,
            id: variantIds[index]  
        }))
    };
    // console.log("The payload",payload)

    try {

        const apiClient = new ApiClient();

        // First, fetch the stock by ID
        const existingStock= await getStock(id);
        if (!existingStock || existingStock.totalElements == 0) {
            formResponse = {
                responseType: "error",
                message: "Stock not found",
                error: new Error("Stock not found"),
            };
            return parseStringify(formResponse);
        }
        const existingStockVariants = existingStock.content[0].stockVariants;
        
        //variant data
        const stockVariantPayload :any[] = [];

        const existingStockVariantMap = new Map();
        existingStockVariants.forEach(variant => {
            existingStockVariantMap.set(variant.id, variant);
        });
        // console.log('Existing stock variant map:', existingStockVariantMap);
        // console.log('Stock variants:', stock.stockVariants);

       
        payload.stockVariants.forEach((newVariant)=>{
            if(newVariant.id && existingStockVariantMap.has(newVariant.id)){
                stockVariantPayload.push({
                    ...newVariant,
                    id: newVariant.id,
                })
                existingStockVariantMap.delete(newVariant.id);
            }
            else{
                stockVariantPayload.push(newVariant);
            }
        })

        // payload.stockVariants = stockVariantPayload;

        const finalPayload = {
            ...payload,
            stockVariants:stockVariantPayload
        }
        // console.log("The final payload",finalPayload )

        await apiClient.put(
            `/api/stock/${location?.id}/${id}`,
            finalPayload
        );

        formResponse = {
            responseType: "success",
            message: "Stock updated successfully",
        };

    } catch (error) {
        console.error("Error updating stock", error);
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    if (formResponse?.responseType === "error") return parseStringify(formResponse);

    revalidatePath("/stock-variants")
    if (paginationState && typeof paginationState.pageIndex === 'number' && typeof paginationState.pageSize === 'number') {
        const page = paginationState.pageIndex + 1; 
        const limit = paginationState.pageSize;
        // console.log('↪️ Redirecting to:', `/stock-variants?page=${page}&limit=${limit}`);
        redirect(`/stock-variants?page=${page}&limit=${limit}`);
    } else {
        // console.log('↪️ Redirecting to default products page');
        redirect("/stock-variants");
    }
    
};

export const deleteStock = async (id: UUID): Promise<FormResponse | void> => {
    if (!id) throw new Error("Stock ID is required to perform this request");

    await getAuthenticatedUser();


   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.delete(
        `/api/stock/${location?.id}/${id}`,
    );
    revalidatePath("/stocks");

   }
   catch (error: any){
        const formattedError = await error;
        // console.error("Error deleting stock", formattedError );

        throw new Error(formattedError.message);
    }
}

export const uploadStockCSV = async ({ fileData, fileName }: { fileData: string; fileName: string }): Promise<void> => {
    // console.log("Starting CSV upload");

    if (!fileName.endsWith(".csv")) {
        throw new Error("Invalid file type. Please upload a CSV file with a .csv extension.");
    }

    const lines = fileData.split("\n");
    const isCSVContent = lines.every(line => line.split(",").length > 1);

    if (!isCSVContent) {
        throw new Error("Invalid file content. The file does not appear to have a CSV structure.");
    }

    // console.log("CSV content to be sent:", fileData);

    const formattedCSVData = fileData.replace(/\r\n/g, '\n');

    // console.log("Formatted CSV data:", formattedCSVData);

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        await apiClient.post(
            `/api/stock/${location?.id}/upload-csv`,
            formattedCSVData,
            {
                headers: {
                    "Content-Type": "text/csv",
                },
                transformRequest: [(data) => data],
            }
        );

        // console.log("CSV upload response", response);

        // Revalidate or redirect after successful upload
        revalidatePath("/stock-variants");
        redirect("/stock-variants");
    } catch (error: any) {
        console.error("Error uploading CSV file:", error);

        return ;
        // throw new Error(`Failed to upload CSV file: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const uploadProductWithStockCSV = async ({ fileData, fileName }: { fileData: string; fileName: string }): Promise<void> => {
    // console.log("Starting CSV upload");

    if (!fileName.endsWith(".csv")) {
        throw new Error("Invalid file type. Please upload a CSV file with a .csv extension.");
    }

    const lines = fileData.split("\n");
    const isCSVContent = lines.every(line => line.split(",").length > 1);

    if (!isCSVContent) {
        throw new Error("Invalid file content. The file does not appear to have a CSV structure.");
    }

    // console.log("CSV content to be sent:", fileData);

    const formattedCSVData = fileData.replace(/\r\n/g, '\n');

    // console.log("Formatted CSV data:", formattedCSVData);

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        await apiClient.post(
            `/api/stock/${location?.id}/upload-products-and-stock-csv`,
            formattedCSVData,
            {
                headers: {
                    "Content-Type": "text/csv",
                },
                transformRequest: [(data) => data],
            }
        );

        // console.log("CSV upload response", response);

        revalidatePath("/stocks");
        redirect("/stocks");
    } catch (error) {

        if (typeof error === "object" && error !== null && "digest" in error && (error as any).digest.startsWith("NEXT_REDIRECT")) {
            // console.log("Redirect triggered, ignoring error:", error);
            return;
        }

        // console.error("Error uploading CSV file:", error);
        throw error;
    }

};

export const stockHistory = async (): Promise<StockHistory | null> => {

    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        const history=await apiClient.get(`/api/reports/${location?.id}/stock/summary`);
        // console.log("The stock history is: ", history)
        return parseStringify(history);
    } catch (error) {
        // console.error("Error fetching stock history:", error);
        throw error;
    }
};
