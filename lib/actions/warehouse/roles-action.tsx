"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { WarehouseRole } from "@/types/roles/type";
import { ApiResponse, FormResponse } from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { RoleSchema, WarehouseRoleSchema } from "@/types/roles/schema";
import { getCurrentWarehouse } from "./current-warehouse-action";


export const searchWarehouseRoles = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<WarehouseRole>> => {
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

        const warehouse = await getCurrentWarehouse();

        const rolesData = await apiClient.post(
            `/api/warehouse-roles/${warehouse?.id}`,
            query,
        );

        return parseStringify(rolesData);
    } catch (error) {
        throw error;
    }
};

export const createWarehouseRole = async (
    role: z.infer<typeof WarehouseRoleSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedData = WarehouseRoleSchema.safeParse(role);

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
        const warehouse = await getCurrentWarehouse();
        
        const payload= {
            ...validatedData.data,
            warehouse: warehouse?.id
        }

        await apiClient.post(
            `/api/warehouse-roles/${warehouse?.id}/create`,
            payload,
        );
        formResponse = {
            responseType: "success",
            message: "Role created successfully",
        }
    } catch (error: unknown) {
        console.error("Error creating role",error);
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/warehouse-role");
    return parseStringify(formResponse);
};

export const updateWarehouseRole = async (
    id: UUID,
    role: z.infer<typeof WarehouseRoleSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedData = WarehouseRoleSchema.safeParse(role);

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
        const warehouse = await getCurrentWarehouse();

        const payload= {
            ...validatedData.data,
            warehouse: warehouse?.id
        }

    

        await apiClient.put(
            `/api/warehouse-roles/${warehouse?.id}/${id}`,
            payload,
        );

        formResponse = {
            responseType: "success",
            message: "Role updated successfully",
        }
        
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/warehouse-role");
    return parseStringify(formResponse);
};

export const getWarehouseRole = async (id: UUID) => {

    const apiClient = new ApiClient();

    const warehouse = await getCurrentWarehouse();
    
    try {
        
        const roleData = await apiClient.get(
            `/api/warehouse-roles/${warehouse?.id}/${id}`,
        );
        
        return parseStringify(roleData);

    } catch (error) {

        throw error;
    }
};




   

    
