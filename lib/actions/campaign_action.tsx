"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {UUID} from "node:crypto";
import {getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import { Campaign} from "@/types/campaign/type";
import { CampaignSchema } from "@/types/campaign/schema";

export const fectchCampaign = async () : Promise<Campaign[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const campaignData = await  apiClient.get(
            `/api/campaigns/${location?.id}`,
        );

        return parseStringify(campaignData);

    }
    catch (error){
        throw error;
    }
}
export const searchCampaign = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Campaign>> =>{
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

        const campaignData = await  apiClient.post(
            `/api/campaigns/${location?.id}`,
            query
        );
        return parseStringify(campaignData);
    }
    catch (error){
        throw error;
    }

}
export const  sendCampaign= async (
    campaign: z.infer<typeof CampaignSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const ValidCampaignData= CampaignSchema.safeParse(campaign)

    console.log("The valid campaign data", ValidCampaignData)

    if (!ValidCampaignData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(ValidCampaignData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();
     

    const payload = {
        ...ValidCampaignData.data,
        location: location?.id,
        business: business?.id
    }

    console.log("The payload sending campaign", payload);
    try {
        const apiClient = new ApiClient();


        await apiClient.post(
            `/api/campaigns/${location?.id}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error sending campaign",error)
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
    revalidatePath("/campaigns");
    redirect("/campaigns");
}

export const getCampaign = async (id:UUID) : Promise<ApiResponse<Campaign>> => {
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
    const campaignResponse = await apiClient.post(
        `/api/campaigns/${location?.id}`,
        query,
    );

    return parseStringify(campaignResponse);
}

