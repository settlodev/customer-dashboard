"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { Staff } from "@/types/staff";
import { ApiResponse, FormResponse } from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { StaffSchema } from "@/types/staff";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import {redirect} from "next/navigation";

export const fetchAllStaff = async (): Promise<Staff[]> => {
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const staffData = await apiClient.get(
            `/api/staff/${location?.id}`,
        );

        return parseStringify(staffData);
    } catch (error) {
        throw error;
    }
};

export const searchStaff = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Staff>> => {
    await getAuthenticatedUser();


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

        const location = await getCurrentLocation();

        const staffData = await apiClient.post(
            `/api/staff/${location?.id}`,
            query,
        );

        return parseStringify(staffData);
    } catch (error) {
        throw error;
    }
};

export const createStaff = async (
    staff: z.infer<typeof StaffSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedData = StaffSchema.safeParse(staff);

    if (!validatedData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        };

        return parseStringify(formResponse);
    }

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();
        const business = await getCurrentBusiness();

        const payload = {
            ...validatedData.data,
            location: location?.id,
            business: business?.id
        }

        await apiClient.post(
            `/api/staff/${location?.id}/create`,
            payload,
        );
        formResponse = {
            responseType: "success",
            message: "Staff created successfully",
        }
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if( formResponse.responseType === "error" ) return parseStringify(formResponse);

    revalidatePath("/staff");
    redirect("/staff");
};

export const updateStaff = async (
    id: UUID,
    staff: z.infer<typeof StaffSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedData = StaffSchema.safeParse(staff);

    if (!validatedData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        };

        return parseStringify(formResponse);
    }

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        const business = await getCurrentBusiness();

        const payload = {
            ...validatedData.data,
            location: location?.id,
            business: business?.id
        }

        await apiClient.put(
            `/api/staff/${location?.id}/${id}`,
            payload,
        );
        formResponse = {
            responseType: "success",
            message: "Staff updated successfully",
        }
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if( formResponse.responseType === "error" ) return parseStringify(formResponse);

    revalidatePath("/staff");
    redirect("/staff");

};

export const getStaff = async (id: UUID): Promise<ApiResponse<Staff>> => {
    const apiClient = new ApiClient();
    const query = {
        filters: [
            {
                key: "id",
                operator: "EQUAL",
                field_type: "UUID_STRING",
                value: id,
            },
        ],
        sorts: [],
        page: 0,
        size: 1,
    };

    const location = await getCurrentLocation();

    const staffData = await apiClient.post(
        `/api/staff/${location?.id}`,
        query,
    );

    return parseStringify(staffData);
};

export const deleteStaff = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Staff ID is required to perform this request");
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        await apiClient.delete(`/api/staff/${location?.id}/${id}`);
        revalidatePath("/staff");
    } catch (error) {
        throw error;
    }
};
