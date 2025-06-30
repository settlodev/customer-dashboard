"use server"
import {revalidatePath} from "next/cache";
import {Business, MinimalBusiness} from "@/types/business/type";
import {cookies} from "next/headers";
import {Location} from "@/types/location/type";
import {redirect} from "next/navigation";

const createMinimalBusiness = (business: Business): MinimalBusiness => {
    return {
        isArchived: business.isArchived,
        totalLocations: business.totalLocations,
        user: business.user,
        id: business.id,
        name: business.name,
        prefix: business.prefix,
        businessType: business.businessType,
        country: business.country,
        countryName: business.countryName,
        status: business.status
    };
};

export const switchBusiness = async (data: Business): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");
    const cookieStore = await cookies();
    cookieStore.set({
        name: "currentBusiness",
        value: JSON.stringify(data)
    });

    revalidatePath("/dashboard");
    redirect("/dashboard");
}

export const refreshBusiness = async (data: Business): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");

    const minimalBusiness = createMinimalBusiness(data);
    const cookieStore = await cookies();

    // Delete existing cookie first
    cookieStore.delete('currentBusiness');

    cookieStore.set({
        name: 'currentBusiness',
        value: JSON.stringify(minimalBusiness),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24
    });

    
    revalidatePath("/", "layout");
};


export const switchLocation = async (data: Location): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");

    const cookieStore =await cookies();

    // Delete existing cookie first
    cookieStore.delete('currentLocation');

    cookieStore.set({
        name: 'currentLocation',
        value: JSON.stringify(data),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24
    });

    revalidatePath("/dashboard");
    redirect("/dashboard");
};

export const refreshLocation = async (data: Location): Promise<void> => {
    if (!data) throw new Error("Business ID is required to perform this request");
    const cookieStore =await cookies();
    cookieStore.set({
        name: "currentLocation",
        value: JSON.stringify(data),
        sameSite: "strict"
    });

    revalidatePath("/dashboard");
};
