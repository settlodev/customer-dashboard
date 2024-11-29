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
import { Department } from "@/types/department/type";
import { DepartmentSchema } from "@/types/department/schema";

export const fectchAllDepartments = async () : Promise<Department[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const departmentData = await  apiClient.get(
            `/api/departments/${location?.id}`,
        );

        return parseStringify(departmentData);

    }
    catch (error){
        throw error;
    }
}
export const searchDepartment = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Department>> =>{
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
        const departmentData = await  apiClient.post(
            `/api/departments/${location?.id}`,
            query
        );
        return parseStringify(departmentData);
    }
    catch (error){
        throw error;
    }

}
// export const  createDepartment= async (
//     department: z.infer<typeof DepartmentSchema>
// ): Promise<FormResponse> => {

//     let formResponse: FormResponse | null = null;

//     const departmentValidData= DepartmentSchema.safeParse(department)

//     if (!departmentValidData.success){
//         formResponse = {
//             responseType:"error",
//             message:"Please fill all the required fields",
//             error:new Error(departmentValidData.error.message)
//       }
//       return parseStringify(formResponse)
//     }

//     const location = await getCurrentLocation();
//     const business = await getCurrentBusiness();

//     const payload = {
//         ...departmentValidData.data,
//         location: location?.id,
//         business: business?.id
//     }
//     try {
//         const apiClient = new ApiClient();

//         formResponse = await apiClient.post(
//             `/api/departments/${location?.id}/create`,
//             payload
//         );
//     }
//     catch (error){
//         console.error("Error creating department",error)
//         formResponse = {
//             responseType: "error",
//             message:
//                 "Something went wrong while processing your request, please try again",
//             error: error instanceof Error ? error : new Error(String(error)),
//         };
//     }
//     if (formResponse){
//         return parseStringify(formResponse)
//     }

//     revalidatePath("/departments");
//     redirect("/departments")
// }

export const createDepartment = async (
    department: z.infer<typeof DepartmentSchema>,
    context: "product" | "department", 
): Promise<FormResponse> => {
    let formResponse: FormResponse | null = null;
    const authenticatedUser = await getAuthenticatedUser();

    if ("responseType" in authenticatedUser)
        return parseStringify(authenticatedUser);

    const validatedData = DepartmentSchema.safeParse(department);

    if (!validatedData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        };

        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();
    
         const payload = {
             ...validatedData.data,
             location: location?.id,
             business: business?.id
        }

    try {
        const apiClient = new ApiClient();

        await apiClient.post(
            `/api/departments/${location?.id}/create`,
            payload
        );
    } catch (error: unknown) {
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

    // Conditionally revalidate and redirect based on the context
    if (context === "department") {
        revalidatePath("/departments");
        redirect("/departments");
    }

    return parseStringify({
        responseType: "success",
        message: "Department created successfully",
    });
};


export const getDepartment= async (id:UUID) : Promise<ApiResponse<Department>> => {
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
    const departmentResponse = await apiClient.post(
        `/api/departments/${location?.id}`,
        query,
    );

    return parseStringify(departmentResponse)
}


export const updateDepartment = async (
    id: UUID,
    department: z.infer<typeof DepartmentSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const departmentValidData = DepartmentSchema.safeParse(department);

    console.log("departmentValidData", departmentValidData);

    if (!departmentValidData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(departmentValidData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
        ...departmentValidData.data,
        location: location?.id,
        business: business?.id
    }

    console.log("Updating department payload", payload);

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/departments/${location?.id}/${id}`,
            payload
        );

    } catch (error) {
        console.error("Error updating department", error);
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
    revalidatePath("/departments");
    redirect("/departments");
};

export const deleteDepartment = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Department ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.delete(
        `/api/departments/${location?.id}/${id}`,
    );
    revalidatePath("/departments");
   }
   catch (error){
       throw error
   }
}
