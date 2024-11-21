"use server"
import {revalidatePath} from "next/cache";
import {Business} from "@/types/business/type";
import {cookies} from "next/headers";
import {Location} from "@/types/location/type";
import {redirect} from "next/navigation";

export const switchBusiness = async (data: Business): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");
    cookies().set({
        name: "currentBusiness",
        value: JSON.stringify(data)
    });

    revalidatePath("/dashboard");
    redirect("/dashboard");
}

export const refreshBusiness = async (data: Business): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");
    cookies().set({
        name: "currentBusiness",
        value: JSON.stringify(data)
    });
    try {
        revalidatePath("/dashboard");
    } catch (error) {
        throw error;
    }
};

export const refreshLocation = async (data: Location): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");
    cookies().set({
        name: "currentLocation",
        value: JSON.stringify(data)
    });
    try {
        revalidatePath("/dashboard");
    } catch (error) {
        throw error;
    }
};
