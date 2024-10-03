"use server"
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {revalidatePath} from "next/cache";
import {Business} from "@/types/business/type";
import {cookies} from "next/headers";

export const refreshBusiness = async (data: Business): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");
    await getAuthenticatedUser();
    cookies().set("currentBusiness", JSON.stringify(data), { path: "/", httpOnly: true });
    try {
        revalidatePath("/business");
    } catch (error) {
        throw error;
    }
};
