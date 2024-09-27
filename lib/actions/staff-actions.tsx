"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import { Staff } from "@/types/staff";
import { ApiResponse, FormResponse } from "@/types/types";
import { getAuthToken } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { StaffSchema } from "@/types/staff";
import {getAuthenticatedUser} from "@/lib/actions/auth/login";

export const fetchAllStaff = async (): Promise<Staff[]> => {
    await getAuthenticatedUser();

    const authToken = await getAuthToken();

    try {
        const apiClient = new ApiClient();

        const staffData = await apiClient.get(
            `/api/staff/${authToken?.locationId}`,
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

    const authToken = await getAuthToken();

    try {
        const apiClient = new ApiClient();

        const query = {
            // filters: [
            //     {
            //         key: "name",
            //         operator: "LIKE",
            //         field_type: "STRING",
            //         value: q,
            //     },
            // ],
            sorts: [
                {
                    key: "name",
                    direction: "ASC",
                },
            ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10,
        };

        const staffData = await apiClient.post(
            `/api/staff/2e5a964c-41d4-46b7-9377-c547acbf7739`,
            query,
        );

        console.log("Action response", staffData);

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
        const authToken = await getAuthToken();

        await apiClient.post(
            `/api/categories/${authToken?.locationId}/create`,
            validatedData.data,
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
        const authToken = await getAuthToken();

        await apiClient.put(
            `/api/staff/${authToken?.locationId}/${id}`,
            validatedData.data,
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

    revalidatePath("/staff");
    redirect("/staff");
};

export const getStaff = async (id: UUID): Promise<ApiResponse<Staff>> => {
    const apiClient = new ApiClient();
    const authToken = await getAuthToken();

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

    const staffData = await apiClient.post(
        `/api/staff/2e5a964c-41d4-46b7-9377-c547acbf7739`,
        query,
    );

    return parseStringify(staffData);
};

export const deleteStaff = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Staff ID is required to perform this request");
    await getAuthenticatedUser();
    const authToken = await getAuthToken();

    try {
        const apiClient = new ApiClient();

        await apiClient.delete(`/api/staff/${authToken?.locationId}/${id}`);
        revalidatePath("/staff");
    } catch (error) {
        throw error;
    }
};
