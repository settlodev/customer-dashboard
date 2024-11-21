"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {UUID} from "node:crypto";
import {getCurrentLocation } from "./business/get-current-business";
import { console } from "node:inspector";
import { StockModification } from "@/types/stock-modification/type";
import { StockModificationSchema } from "@/types/stock-modification/schema";

export const fetchStockModification = async () : Promise<StockModification[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const data = await  apiClient.get(
            `/api/stock-modifications/${location?.id}/all`,
        );
        console.log("The list of Stock modifications in this location: ", data)
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}
export const searchStockModifications = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<StockModification>> =>{
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
            // sorts:[
            //     {
            //         key:"stockVariant.stock.name",
            //         direction:"ASC"
            //     }
            // ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const data = await  apiClient.post(
            `/api/stock-modifications/${location?.id}`,
            query
        );
        
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}
export const createStockModification = async (
    modification: z.infer<typeof StockModificationSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validData = StockModificationSchema.safeParse(modification);

    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message)
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const payload = {
        ...validData.data,
        location: location?.id
    };
    console.log("The payload to record stock modification:", payload);

    try {
        const apiClient = new ApiClient();
       const response = await apiClient.post(
            `/api/stock-modifications/${location?.id}/create`,
            payload
        );
        console.log("Stock modification modified successfully", response);
    } catch (error) {
        console.error("Error creating product", error);
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse) {
        return parseStringify(formResponse);
    }

    revalidatePath("/stock-modifications");
    redirect("/stock-modifications");
};


export const getStockModified= async (id:UUID, stockVariant:UUID) : Promise<ApiResponse<StockModification>> => {

    console.log("The id  & stockVariant to get stock intake: ", id , stockVariant)

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
        `/api/stock-modifications/${location?.id}/${id}`,
        query,
    );

    return parseStringify(response)
}


