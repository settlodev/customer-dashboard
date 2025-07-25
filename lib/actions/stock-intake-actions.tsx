"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import {getCurrentLocation } from "./business/get-current-business";
import { console } from "node:inspector";
import { StockIntake } from "@/types/stock-intake/type";
import { StockIntakeSchema, UpdatedStockIntakeSchema } from "@/types/stock-intake/schema";


function isNextRedirect(error: any): boolean {
    return (
        error &&
        typeof error === 'object' &&
        (error.digest?.startsWith('NEXT_REDIRECT') || 
         error.__NEXT_REDIRECT_ERROR__ === true ||
         error.message?.includes('NEXT_REDIRECT'))
    );
}
export const fetchStockIntakes = async () : Promise<StockIntake[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const data = await  apiClient.get(
            `/api/stock-intakes/${location?.id}/all`,
        );
        // console.log("The list of Stock Intakes in this location: ", data)
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}

export const searchStockIntakes = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<StockIntake>> =>{
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"stockVariant.stock.name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                },
                {
                    key:"isArchived",
                    operator:"EQUAL",
                    field_type:"BOOLEAN",
                    value:false
                }
            ],
            sorts:[
                {
                    key:"orderDate",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        
        const data = await  apiClient.post(
            `/api/stock-intakes/${location?.id}/all`,
            query
        );
        console.log("The list of Stock Intakes in this location: ", data)
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}
export const createStockIntake = async (
    stockIntake: z.infer<typeof StockIntakeSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validData = StockIntakeSchema.safeParse(stockIntake);

    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message)
        };
        return parseStringify(formResponse);
    }

    const stockVariantId = validData.data.stockVariant;
    const payload = {
        ...validData.data,
    };
    try {
        const apiClient = new ApiClient();
       await apiClient.post(
            `/api/stock-intakes/${stockVariantId}/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Stock Intake recorded successfully",
        }
    } catch (error) {
        // console.error("Error creating product", error);
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    revalidatePath("/stock-intakes");
    return parseStringify(formResponse);
};


export const getStockIntake= async (id:UUID, effectiveStockVariant:UUID) => {
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


export const updateStockIntake = async (
    id: UUID,
    stockIntake: z.infer<typeof UpdatedStockIntakeSchema>
): Promise<FormResponse | void> => {
    console.log("The values are",id,stockIntake)
    let formResponse: FormResponse | null = null;
    const validData = UpdatedStockIntakeSchema.safeParse(stockIntake);

    // console.log("The validated data",validData)

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

export const downloadStockIntakeCSV = async (locationId?:string) => {

    const location = await getCurrentLocation() || {id:locationId};
    console.log("location",location)
    
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get(`/rust/csv-downloading/download-stock-intake-upload-sample-csv?location_id=${location?.id}`);
        console.log("CSV download response", response);
        return response;
    } catch (error) {
        console.error("Error downloading CSV file:", error);
        throw new Error(`Failed to download CSV file: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const uploadStockIntakeCSV = async ({ fileData, fileName }: { fileData: string; fileName: string }): Promise<void> => {
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
            `/rust/csv-uploading/upload-stock-intake-csv?location_id=${location?.id}`,
            formattedCSVData,
            {
                headers: {
                    "Content-Type": "text/csv",
                },
                transformRequest: [(data) => data],
                timeout: 30000,
            }
        );

        revalidatePath("/stock-intakes");
        
    } catch (error: any) {

        if (isNextRedirect(error)) {
            throw error;
        }

        console.error("Error uploading CSV file:", error);
        throw new Error(`Failed to upload CSV file: ${error instanceof Error ? error.message : String(error)}`);
    }
     
      
};