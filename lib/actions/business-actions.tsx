"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import {getAuthenticatedUser, getAuthToken} from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import {ApiResponse, FormResponse} from "@/types/types";
import {getCurrentLocation} from "@/lib/actions/business/get-current-business";
import {Business} from "@/types/business/type";
import { BusinessSchema } from "@/types/business/schema";

export const fetchAllBusinesses = async (): Promise<Business[] | null> => {
    await getAuthenticatedUser();

    try {
        const location = await getCurrentLocation();

        const apiClient = new ApiClient();

        const data = await apiClient.get(
            `/api/businesses/${location?.id}`,
        );

        return parseStringify(data);
    } catch (error) {
        throw error;
    }
};

export const searchBusiness = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Business>> => {
    
    const authToken = await getAuthToken();
    
    const userId = authToken?.id;

    try {
        const apiClient = new ApiClient();

        const query = {
            filters: [
                {
                    key: "name",
                    operator: "LIKE",
                    field_type: "STRING",
                    value: q,
                },
            ],
            sorts: [
                {
                    key: "name",
                    direction: "ASC",
                },
            ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10,
        };


        const data = await apiClient.post(
            `/api/businesses/${userId}`,
            query,
        );

        return parseStringify(data);

    } catch (error) {
        throw error;
    }
};

export const createBusiness = async (
    business: z.infer<typeof BusinessSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    // const authenticatedUser = await getAuthenticatedUser();

    const authToken = await getAuthToken();
    const userId = authToken?.id;


    const validatedData = BusinessSchema.safeParse(business);

    if (!validatedData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        };

        return parseStringify(formResponse);
    }

        const payload = {
            ...validatedData.data,
            owner: userId
        }

    try {
        const apiClient = new ApiClient();

        await apiClient.post(
            `/api/businesses/${userId}/create`,
            payload,
        );
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

   
    if ( formResponse && formResponse.responseType === "error" ) return parseStringify(formResponse)

    revalidatePath("/business");
    redirect("/business");
};

export const updateBusiness = async (
    id: UUID,
    business: z.infer<typeof BusinessSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const authToken = await getAuthToken();
    const userId = authToken?.id;

    
    const validatedData = BusinessSchema.safeParse(business);

    console.log("validatedData", validatedData)

    if (!validatedData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        };

        return parseStringify(formResponse);
    }

    const payload = {
        ...validatedData.data,
        owner: userId
    }

    try {
        const apiClient = new ApiClient();

       const dataSent = await apiClient.put(
            `/api/businesses/${userId}/${id}`,
            payload,
        );
      console.log("dataSent", dataSent)  
    } catch (error: unknown) {
        console.log("error", error)
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

    revalidatePath("/business");
    redirect("/business");
};

export const getSingleBusiness = async (id: UUID): Promise<Business> => {

    const apiClient = new ApiClient();

    const authToken = await getAuthToken();

    const userId = authToken?.id;

   
    const data = await apiClient.get(
        `/api/businesses/${userId}/${id}`,
    );
    return parseStringify(data);
};

export const deleteBusiness = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Business ID is required to perform this request");
    await getAuthenticatedUser();
    const authToken = await getAuthToken();
    const userId = authToken?.id;
    try {
        const apiClient = new ApiClient();

        await apiClient.delete(`/api/businesses/${userId}/${id}`);
        
        revalidatePath("/business");
    } catch (error) {
        throw error;
    }
};
