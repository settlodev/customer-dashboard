"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { Staff,StaffSummaryReport } from "@/types/staff";
import { ApiResponse, FormResponse } from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { StaffSchema } from "@/types/staff";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import {redirect} from "next/navigation";
import { inviteStaffToBusiness} from "./emails/send";

type invitedStaff = {
    passwordResetToken: string;
    staffEmail: string;
}

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
                    key: "firstName",
                    operator: "LIKE",
                    field_type: "STRING",
                    value: q,
                },
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

       const staff = await apiClient.post(
            `/api/staff/${location?.id}/create`,
            payload,
        ) as Staff;

        console.log("The staff created is", staff);

        if (staff && staff.dashboardAccess === true) {
            const staffId = staff.id;
            const businessId = business?.id;

            if (staffId && businessId) {
                console.log("Inviting staff");
                await inviteStaff(staffId, businessId);
            } else {
                throw new Error("Invalid staff or business id");
            }
        }

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
    console.log("The staff id to delete is: ", id)
    if (!id) throw new Error("Staff ID is required to perform this request");
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        await apiClient.delete(`/api/staff/${location?.id}/${id}`);
        revalidatePath("/staff");
    } catch (error) {
        console.error("Error deleting staff:", error);
        throw error;
    }
};

const inviteStaff = async (staffId: UUID,businessId:UUID): Promise<void> => {
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();  

        const location = await getCurrentLocation();

        const payload = {
            staff: staffId,
            business: businessId
        }

       const invitedStaff: invitedStaff = await apiClient.put(`/api/staff/${location?.id}/invite-to-business`, payload);
       console.log("The invited staff is", invitedStaff);
       const token = invitedStaff.passwordResetToken;
       const email = invitedStaff.staffEmail;
       if(token && email) {
        await inviteStaffToBusiness(token,email);
    }
        revalidatePath("/staff");
    } catch (error) {
        throw error;
    }
};

export const staffReport = async (startDate?: Date, endDate?: Date): Promise<StaffSummaryReport | null> => {

    await getAuthenticatedUser();
    try{
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        const params = {
            startDate,
            endDate,
        }
        const report = await apiClient.get(`/api/reports/${location?.id}/staff/summary`, {
            params
        });

        return parseStringify(report);
    }
    catch (error){
        console.error("Error fetching staff summary report:", error);
        throw error
    }
}

export const resetStaffPasscode = async (staffId: UUID): Promise<void> => {
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        await apiClient.put(`/api/staff/${location?.id}/reset-passcode/${staffId}`,{});
        revalidatePath("/staff");
    } catch (error) {
        throw error;
    }
};
