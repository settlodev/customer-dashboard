"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { Staff} from "@/types/staff";
import { ApiResponse, FormResponse } from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentWarehouse } from "./current-warehouse-action";
import { getCurrentBusiness } from "../business/get-current-business";
import { StaffWarehouseSchema } from "@/types/warehouse/staff/schema";


export const searchStaffFromWarehouse = async (
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
                    key: "firstName",
                    operator: "LIKE",
                    field_type: "STRING",
                    value: q,
                },
                {
                    key:"isArchived",
                    operator:"EQUAL",
                    field_type:"BOOLEAN",
                    value:false
                }
            ],
            sorts: [
                {
                    key: "firstName",
                    direction: "ASC",
                },
            ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10,
        };

        const warehouse = await getCurrentWarehouse();

        const staffData = await apiClient.post(
            `/api/warehouse-staffs/${warehouse?.id}`,
            query,
        );

        return parseStringify(staffData);
    } catch (error) {
        throw error;
    }
};

export const createStaffFromWarehouse = async (
    staff: z.infer<typeof StaffWarehouseSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedData = StaffWarehouseSchema.safeParse(staff);

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
        const business = await getCurrentBusiness();

        const payload = {
            ...validatedData.data,
            warehouse: warehouse?.id,
            business: business?.id
        }

        const staff = await apiClient.post(
            `/api/warehouse-staffs/${warehouse?.id}/create`,
            payload,
        ) as Staff;

        console.log("Created staff:", staff);
        formResponse = {
            responseType: "success",
            message: "Staff created successfully",
        }

        
        revalidatePath("/warehouse-staff");
        

    } catch (error: any) {
        console.error("Error creating staff:", error);
        
        let errorMessage = "An unexpected error occurred. Please try again.";
        
        // Try to extract meaningful error messages
        if (error.message) {
            errorMessage = error.message;
        } else if (error.details?.message) {
            errorMessage = error.details.message;
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        }

       
        if (errorMessage.includes('beyond the limit') || errorMessage.includes('subscription')) {
            
            errorMessage = errorMessage; 
        }

        return parseStringify({
            responseType: "error",
            message: errorMessage,
            error: new Error(errorMessage),
        });
    }

    return parseStringify(formResponse);
};

export const updateStaffFomWarehouse = async (
    id: UUID,
    staff: z.infer<typeof StaffWarehouseSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedData = StaffWarehouseSchema.safeParse(staff);

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
        const business = await getCurrentBusiness();

        const payload = {
            ...validatedData.data,
            warehouse: warehouse?.id,
            business: business?.id
        }

        await apiClient.put(
            `/api/warehouse-staffs/${warehouse?.id}/${id}`,
            payload,
        );
       
        revalidatePath("/warehouse-staff");
        formResponse = {
            responseType: "success",
            message: "Staff updated successfully",
        }
        return parseStringify(formResponse);

    } catch (error: unknown) {
        // console.error("Error updating staff:", error);
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if( formResponse.responseType === "error" ) return parseStringify(formResponse);

};

export const getWarehouseStaff = async (id: UUID): Promise<ApiResponse<Staff>> => {
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

    const warehouse = await getCurrentWarehouse();

    const staffData = await apiClient.post(
        `/api/warehouse-staffs/${warehouse?.id}`,
        query,
    );

    return parseStringify(staffData);
};




