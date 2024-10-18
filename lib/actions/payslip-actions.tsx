"use server";

import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { Payslip } from "@/types/payslip/type";

export const fectchPayslip = async () : Promise<Payslip[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const payslipData = await  apiClient.get(
            `/api/payslips/${location?.id}`,
        );
       
        return parseStringify(payslipData);

    }
    catch (error){
        throw error;
    }
}
export const searchPayslip = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Payslip>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            // filters: [
            //     {
            //         key:"staffName",
            //         operator:"LIKE",
            //         field_type:"STRING",
            //         value:q
            //     }
            // ],
            sorts:[
                {
                    key:"staff",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const payslipData = await  apiClient.post(
            `/api/payslips/${location?.id}`,
            query
        );
        return parseStringify(payslipData);
    }
    catch (error){
        throw error;
    }

}


export const getPayslip= async (id:UUID) : Promise<ApiResponse<Payslip>> => {
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
    const payslip= await apiClient.post(
        `/api/payslips/${location?.id}`,
        query,
    );
    
    return parseStringify(payslip)
}


export const deletePayslip = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Payslip ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
   
    await apiClient.delete(
        `/api/payslips/${location?.id}/${id}`,
    );
    revalidatePath("/payslips");
    
   }
   catch (error){
       throw error
   }
}
