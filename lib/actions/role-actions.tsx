"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import { Role } from "@/types/roles/type";
import { ApiResponse, FormResponse } from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { RoleSchema } from "@/types/roles/schema";
import {getCurrentLocation} from "@/lib/actions/business/get-current-business";

export const fetchAllRoles = async (): Promise<Role[]> => {
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const rolesData = await apiClient.get(
            `/api/roles/${location?.id}`,
        );

        return parseStringify(rolesData);
    } catch (error) {
        throw error;
    }
};

export const searchRoles = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Role>> => {
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

        const rolesData = await apiClient.post(
            `/api/roles/${location?.id}`,
            query,
        );

        return parseStringify(rolesData);
    } catch (error) {
        throw error;
    }
};

export const createRole = async (
    role: z.infer<typeof RoleSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedData = RoleSchema.safeParse(role);

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
        console.log("validatedData.data: ", validatedData.data);
        const payload= {
            ...validatedData.data,
            location: location?.id
        }

        await apiClient.post(
            `/api/roles/${location?.id}/create`,
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

    if (formResponse) {
        return parseStringify(formResponse);
    }

    revalidatePath("/roles");
    redirect("/roles");
};

export const updateRole = async (
    id: UUID,
    role: z.infer<typeof RoleSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedData = RoleSchema.safeParse(role);

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

        const payload= {
            ...validatedData.data,
            location: location?.id
        }

        await apiClient.put(
            `/api/roles/${location?.id}/${id}`,
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

    if (formResponse) {
        return parseStringify(formResponse);
    }

    revalidatePath("/roles");
    redirect("/roles");
};

export const getRole = async (id: UUID): Promise<ApiResponse<Role>> => {
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

    const roleData = await apiClient.post(
        `/api/roles/${location?.id}`,
        query,
    );

    return parseStringify(roleData);
};

export const deleteRole = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Role ID is required to perform this request");
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();

        await apiClient.delete(`/api/roles/${location?.id}/${id}`);
        revalidatePath("/roles");
    } catch (error) {
        throw error;
    }
};
