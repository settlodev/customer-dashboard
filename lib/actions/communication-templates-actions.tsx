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
import { Template } from "@/types/communication-templates/types";
import { TemplateSchema } from "@/types/communication-templates/schema";

export const fetchTemplates = async () : Promise<Template[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const templateData = await  apiClient.get(
            `/api/communication-templates/${location?.id}`,
        );

        return parseStringify(templateData);

    }
    catch (error){
        throw error;
    }
}
export const searchTemplates = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Template>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"subject",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"subject",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();

        const templateData = await  apiClient.post(
            `/api/communication-templates/${location?.id}`,
            query
        );
        return parseStringify(templateData);
    }
    catch (error){
        throw error;
    }

}
export const  createTemplate= async (
    template: z.infer<typeof TemplateSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const ValidTemplateData= TemplateSchema.safeParse(template)

    if (!ValidTemplateData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(ValidTemplateData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    console.log("The location id passed is", location?.id);
     

    const payload = {
        ...ValidTemplateData.data,
        location: location?.id,
    }

    console.log("The payload to create template", payload);
    try {
        const apiClient = new ApiClient();


        await apiClient.post(
            `/api/communication-templates/${location?.id}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error creating template",error)
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
    revalidatePath("/communication-templates");
    redirect("/communication-templates");
}

export const getTemplate= async (id:UUID) : Promise<ApiResponse<Template>> => {
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
    const templateResponse = await apiClient.post(
        `/api/communication-templates/${location?.id}`,
        query,
    );

    return parseStringify(templateResponse);
}



export const updateTemplate = async (
    id: UUID,
    template: z.infer<typeof TemplateSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const ValidTemplateData = TemplateSchema.safeParse(template);

    if (!ValidTemplateData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(ValidTemplateData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();

    const payload = {
        ...ValidTemplateData.data,
        location: location?.id,
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/communication-templates/${location?.id}/${id}`,
            payload
        );

    } catch (error) {
        console.error("Error updating template", error);
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
    revalidatePath("/communication-templates");
    redirect("/communication-templates");
};

export const deleteTemplate = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Template ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.delete(
        `/api/communication-templates/${location?.id}/${id}`,
    );
    revalidatePath("/communication-templates");

   }
   catch (error){
       throw error
   }
}
