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
import { Stock } from "@/types/stock/type";
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
export const  createStock= async (
    stock: z.infer<typeof StockSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validData= StockSchema.safeParse(stock)

    if (!validData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
        ...validData.data,
        location: location?.id,
        business: business?.id
    }

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
    catch (error){
        console.error("Error creating product",error)
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    revalidatePath("/stocks")
    return parseStringify(formResponse);
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
    stock: z.infer<typeof StockSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
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
        business: business?.id
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/stock/${location?.id}/${id}`,
            payload
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
    revalidatePath("/stocks")
    return parseStringify(formResponse);
};

export const deleteStock = async (id: UUID): Promise<void> => {
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
   catch (error){
       console.error("Error deleting stock", error);
       throw error
       
   }
}

export const uploadStockCSV = async ({ fileData, fileName }: { fileData: string; fileName: string }): Promise<void> => {
    console.log("Starting CSV upload");

    if (!fileName.endsWith(".csv")) {
        throw new Error("Invalid file type. Please upload a CSV file with a .csv extension.");
    }

    const lines = fileData.split("\n");
    const isCSVContent = lines.every(line => line.split(",").length > 1);

    if (!isCSVContent) {
        throw new Error("Invalid file content. The file does not appear to have a CSV structure.");
    }

    console.log("CSV content to be sent:", fileData); 

    const formattedCSVData = fileData.replace(/\r\n/g, '\n'); 

    console.log("Formatted CSV data:", formattedCSVData); 

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        const response = await apiClient.post(
            `/api/stock/${location?.id}/upload-csv`,
            formattedCSVData, 
            {
                headers: {
                    "Content-Type": "text/csv",
                },
                transformRequest: [(data) => data],
            }
        );
        
        console.log("CSV upload response", response);

        // Revalidate or redirect after successful upload
        revalidatePath("/products");
        redirect("/products");
    } catch (error) {
        console.error("Error uploading CSV file:", error);

        return ;
        // throw new Error(`Failed to upload CSV file: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const uploadProductWithStockCSV = async ({ fileData, fileName }: { fileData: string; fileName: string }): Promise<void> => {
    console.log("Starting CSV upload");

    if (!fileName.endsWith(".csv")) {
        throw new Error("Invalid file type. Please upload a CSV file with a .csv extension.");
    }

    const lines = fileData.split("\n");
    const isCSVContent = lines.every(line => line.split(",").length > 1);

    if (!isCSVContent) {
        throw new Error("Invalid file content. The file does not appear to have a CSV structure.");
    }

    console.log("CSV content to be sent:", fileData); 

    const formattedCSVData = fileData.replace(/\r\n/g, '\n'); 

    console.log("Formatted CSV data:", formattedCSVData); 

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        const response = await apiClient.post(
            `/api/stock/${location?.id}/upload-products-and-stock-csv`,
            formattedCSVData, 
            {
                headers: {
                    "Content-Type": "text/csv",
                },
                transformRequest: [(data) => data],
            }
        );
        
        console.log("CSV upload response", response);

        // Revalidate or redirect after successful upload
        revalidatePath("/products");
        redirect("/products");
    } catch (error) {
        console.error("Error uploading CSV file:", error);

        return ;
        // throw new Error(`Failed to upload CSV file: ${error instanceof Error ? error.message : String(error)}`);
    }
};