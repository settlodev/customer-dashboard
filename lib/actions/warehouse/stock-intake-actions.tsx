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

export const searchStockIntakesFromWarehouse = async (
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
                }
            ],
            sorts:[
                {
                    key:"orderDate",
                    direction:"DESC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const warehouse = await getCurrentWarehouse();
       
        const data = await  apiClient.post(
            `/api/stock-intakes/${warehouse?.id}/all-with-warehouse`,
            query
        );
        
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}
export const createStockIntakeForWarehouse = async (
    stockIntake: z.infer<typeof StockIntakeSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validData = StockIntakeSchema.safeParse(stockIntake);

    console.log("The validated data",validData)

    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message)
        };
        return parseStringify(formResponse);
    }

    const stockVariantId = validData.data.stockVariant;

    const warehouse = await getCurrentWarehouse();
    

    const payload = {
        ...validData.data,
        stockVariant: stockVariantId
    };

    console.log("The payload is",payload)

    try {
        const apiClient = new ApiClient();
       await apiClient.post(
            `/api/stock-intakes/${warehouse?.id}/all-with-warehouse/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Stock Intake recorded successfully",
        }
    } catch (error) {
        console.error("Error creating stock intake:", error);
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    revalidatePath("/warehouse-stock-intakes");
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
    console.log("The payload is",payload)

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

// export const deleteStockIntake = async (id: UUID, stockVariant:UUID): Promise<void> => {
//     if (!id && !stockVariant) throw new Error("Stock Intake ID & stockVariant is required to perform this request");

//     await getAuthenticatedUser();

//     console.log("Deleting stock intake with ID:", id, stockVariant);

//    try{
//     const apiClient = new ApiClient();

//     await apiClient.delete(
//         `/api/stock-intakes/${stockVariant}/${id}`,
//     );
//     revalidatePath("/stock-intakes");

//    }
//    catch (error){
//        throw error
//    }
// }

// export const uploadCSV = async ({ fileData, fileName }: { fileData: string; fileName: string }): Promise<void> => {
//     console.log("Starting CSV upload");

//     if (!fileName.endsWith(".csv")) {
//         throw new Error("Invalid file type. Please upload a CSV file with a .csv extension.");
//     }

//     const lines = fileData.split("\n");
//     const isCSVContent = lines.every(line => line.split(",").length > 1);

//     if (!isCSVContent) {
//         throw new Error("Invalid file content. The file does not appear to have a CSV structure.");
//     }

//     console.log("CSV content to be sent:", fileData);

//     const formattedCSVData = fileData.replace(/\r\n/g, '\n');

//     console.log("Formatted CSV data:", formattedCSVData);

//     try {
//         const apiClient = new ApiClient();
//         const location = await getCurrentLocation();
//         const response = await apiClient.post(
//             `/api/products/${location?.id}/upload-csvx`,
//             formattedCSVData, // Send as plain text
//             {
//                 headers: {
//                     "Content-Type": "text/csv",
//                 },
//                 transformRequest: [(data) => data],
//             }
//         );

//         console.log("CSV upload response", response);

//         // Revalidate or redirect after successful upload
//         revalidatePath("/products");
//         redirect("/products");
//     } catch (error) {
//         console.error("Error uploading CSV file:", error);

//         return ;
//         // throw new Error(`Failed to upload CSV file: ${error instanceof Error ? error.message : String(error)}`);
//     }
// };
