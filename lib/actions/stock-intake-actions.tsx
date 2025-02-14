"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import { console } from "node:inspector";
import { StockIntake } from "@/types/stock-intake/type";
import { StockIntakeSchema } from "@/types/stock-intake/schema";

export const fetchStockIntakes = async () : Promise<StockIntake[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const data = await  apiClient.get(
            `/api/stock-intakes/${location?.id}/all`,
        );
        console.log("The list of Stock Intakes in this location: ", data)
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
                    key:"stockVariantName",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
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
        // console.log("The location passed is: ", location)
        const data = await  apiClient.post(
            `/api/stock-intakes/${location?.id}/all`,
            query
        );
        // console.log("The list of Stock Intakes in this location: ", data)
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
        console.error("Error creating product", error);
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    revalidatePath("/stock-intakes");
    return parseStringify(formResponse);
};


export const getStockIntake= async (id:UUID, stockVariant:UUID)  => {

    let formResponse: FormResponse | null = null;
    try {
    const apiClient = new ApiClient();
    const response = await apiClient.get(
        `/api/stock-intakes/${stockVariant}/${id}`,
       
    )
    console.log("The response to get stock intake: ", response)
    return parseStringify(response)

    } catch (error) {
        console.error("Error fetching stock intake:", error);
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
}

    


export const updateStockIntake = async (
    id: UUID,
    stockIntake: z.infer<typeof StockIntakeSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validData = StockIntakeSchema.safeParse(stockIntake);

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
            `/api/stock-intakes/${location?.id}/${id}`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Stock Intake updated successfully",
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
