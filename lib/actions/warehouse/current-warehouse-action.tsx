"use server"
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ActiveSubscription } from "@/types/subscription/type";
import {revalidatePath} from "next/cache";
import {cookies} from "next/headers";

export const getCurrentWarehouse = async (): Promise<any | undefined> => {
    const cookieStore =await cookies();
    const warehouseCookie = cookieStore.get("currentWarehouse");

    if (!warehouseCookie) return undefined;

    try {
        return JSON.parse(warehouseCookie.value) as any;
        // console.log("The cookie is: ", warehouseCookie?.value)
    } catch (error) {
        console.error("Failed to parse Warehouse cookie:", error);
        return undefined;
    }
};
export const refreshWarehouse = async (data: any): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");
    const cookieStore =await cookies();
    cookieStore.set({
        name: "currentWarehouse",
        value: JSON.stringify(data),
        sameSite: "strict"
    });

    console.log("The cookie is: ", cookieStore.get("currentWarehouse"))
    revalidatePath("/warehouse");
};

export const getActiveSubscriptionForWarehouse = async (locationId?: string | null): Promise<ActiveSubscription> => {
    
    let warehouse;
    if (locationId) {
        warehouse = { id: locationId };
    } else {
        warehouse = await getCurrentWarehouse();
    }
    
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get(`/api/warehouse-subscriptions/${warehouse?.id}/last-active`);
        return parseStringify(response);
    } catch (error) {

        throw error;
    }
}