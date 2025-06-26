"use server"
import {revalidatePath} from "next/cache";
import {cookies} from "next/headers";

export const getCurrentWarehouse = async (): Promise<any | undefined> => {
    const warehoseCookie = cookies().get("currentWarehouse");
    if (!warehoseCookie) return undefined;

    try {
        return JSON.parse(warehoseCookie.value) as any;
    } catch (error) {
        console.error("Failed to parse Warehouse cookie:", error);
        return undefined;
    }
};
export const refreshWarehouse = async (data: any): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");
    cookies().set({
        name: "currentWarehouse",
        value: JSON.stringify(data),
        sameSite: "strict"
    });

    revalidatePath("/warehouse");
};