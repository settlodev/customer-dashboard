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
import { SalarySchema } from "@/types/salary/schema";
import { Units } from "@/types/unit/type";

export const fetchUnits = async () : Promise<Units[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();


        const unitData= await  apiClient.get(
            '/api/units',
        );
       
        return parseStringify(unitData);

    }
    catch (error){
        throw error;
    }
}
export const searchUnit = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Units>> =>{
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
        // const location = await getCurrentLocation();
        const unitData = await  apiClient.post(
            '/api/units',
            query
        );
        return parseStringify(unitData);
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

    console.log("The payload to create salary", payload);

    try {
        const apiClient = new ApiClient();
      

        await apiClient.post(
            `/api/salaries/${location?.id}/create`,
            payload
        );
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
    if (formResponse){
        return parseStringify(formResponse)
    }
    revalidatePath("/salaries");
    redirect("/salaries")
}

export const getUnit= async (id:UUID) : Promise<ApiResponse<Units>> => {
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
    const unit= await apiClient.post(
        `/api/unit/${location?.id}`,
        query,
    );
    
    return parseStringify(unit)
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
    console.log("The payload to update salary", payload);

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/salaries/${location?.id}/${id}`, 
            payload
        );

    } catch (error) {
        console.error("Error while updating salary", error); 
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse) {
        return parseStringify(formResponse);
    }
    revalidatePath("/salaries");
    redirect("/salaries");
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
