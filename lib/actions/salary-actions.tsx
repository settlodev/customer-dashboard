"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import {getCurrentLocation } from "./business/get-current-business";
import { Salary } from "@/types/salary/type";
import { SalarySchema } from "@/types/salary/schema";

export const fectchSalaries = async () : Promise<Salary[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const salaryData= await  apiClient.get(
            `/api/salaries/${location?.id}`,
        );
       
        return parseStringify(salaryData);

    }
    catch (error){
        throw error;
    }
}
export const searchSalary = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Salary>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            // filters: [
            //     {
            //         key:"amount",
            //         operator:"LIKE",
            //         // field_type:"STRING",
            //         value:q
            //     }
            // ],
            sorts:[
                {
                    key:"amount",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const salaryData = await  apiClient.post(
            `/api/salaries/${location?.id}`,
            query
        );
        return parseStringify(salaryData);
    }
    catch (error){
        throw error;
    }

}
export const  createSalary= async (
    salary: z.infer<typeof SalarySchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validSalaryData= SalarySchema.safeParse(salary);



    if (!validSalaryData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validSalaryData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();

    const payload = {
        ...validSalaryData.data,
        location: location?.id,
    }


    try {
        const apiClient = new ApiClient();
        await apiClient.post(
            `/api/salaries/${location?.id}/create`,
            payload
        );

        formResponse = {
            responseType: "success",
            message: "Salary created successfully",
        };
    }
    catch (error){
        console.error("Error while creating salary",error)
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
  
    revalidatePath("/salaries");
    return parseStringify(formResponse)
}

export const getSalary= async (id:UUID) : Promise<ApiResponse<Salary>> => {
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
    const salary= await apiClient.post(
        `/api/salaries/${location?.id}`,
        query,
    );
    
    return parseStringify(salary)
}



export const updateSalary = async (
    id: UUID,
    salary: z.infer<typeof SalarySchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validSalaryData = SalarySchema.safeParse(salary);

    if (!validSalaryData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validSalaryData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();

    const payload = {
        ...validSalaryData.data,
        location: location?.id,
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/salaries/${location?.id}/${id}`, 
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Salary updated successfully",
        };

    } catch (error) {
        console.error("Error while updating salary", error); 
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    
    revalidatePath("/salaries");
    return parseStringify(formResponse);
};

export const deleteSalary = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Salary ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
   
    await apiClient.delete(
        `/api/salaries/${location?.id}/${id}`,
    );
    revalidatePath("/salaries");
    
   }
   catch (error){
       throw error
   }
}
