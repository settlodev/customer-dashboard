"use server";

import { cookies } from "next/headers";
import { User } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { activeBusiness, AuthToken, ExtendedUser, FormResponse } from "@/types/types";
import {logout} from "@/lib/actions/auth-actions";

export const getUser = async () => {
    const session = await auth();

    if (!session) {
        await logout();
    }

    return session?.user;
};

export const getAuthToken = async (): Promise<AuthToken | null> => {
    const cookieStore = cookies();

    const tokens = cookieStore.get("authToken")?.value;

    if (!tokens) return null;

    const parsedTokens = JSON.parse(tokens) as AuthToken;

    return parsedTokens.authToken ? parsedTokens : null;
};

// export const deleteAuthToken = async () => {
//     cookies().delete("authToken");
//     cookies().delete("next-auth.session-token");
//     cookies().delete("next-auth.csrf-token");
// };

export const updateAuthToken = async (token: AuthToken) => {
    const cookieStore = cookies();

    cookieStore.set({
        name: "authToken",
        value: JSON.stringify(token),
        httpOnly: true, // Only available in server
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });
};

export const createAuthToken = async (user: ExtendedUser) => {
    const cookieStore = cookies();
    const authTokenData: AuthToken = {
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        id: user.id,
        bio: user.bio,
        role: user.role,
        country: user.country,
        authToken: user.authToken,
        refreshToken: user.refreshToken,
        businessComplete: user.businessComplete,
        locationComplete: user.locationComplete,
        subscriptionComplete: user.subscriptionComplete,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        phoneNumberVerified: user.phoneNumberVerified,
        //emailVerificationToken: user.emailVerificationToken,
        consent: user.consent,
        theme: user.theme,
        subscriptionStatus: user.subscriptionStatus,
        businessId: user.businessId,
    };

    cookieStore.set({
        name: "authToken",
        value: JSON.stringify(authTokenData),
        httpOnly: true, // Only available in server
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });
};

export const createActiveBusiness = async (user: ExtendedUser) => {
    const cookieStore = cookies();

    const businessActive: activeBusiness = {
        businessId: user.businessId,
    };

    cookieStore.set({
        name: "activeBusiness",
        value: JSON.stringify(businessActive),
        httpOnly: true, // Only available in server
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });
};

export const getAuthenticatedUser = async (): Promise<FormResponse | User> => {
    const user = await getUser();

    if (!user) {
        // redirect to log in
        redirect("/login");
    }

    return user;
};

export const deleteAuthCookie = async () => {
    cookies().delete("authToken");
    cookies().delete("next-auth.session-token");
    cookies().delete("next-auth.csrf-token");
    cookies().delete("activeBusiness");
    cookies().delete("currentBusiness");
    cookies().delete("currentLocation");
    await logout();
};

export const deleteActiveBusinessCookie = async () => {
    cookies().delete("activeBusiness");
};

export const getActiveBusiness = async (): Promise<activeBusiness | null> => {
    const cookieStore = cookies();

    const activeBusiness = cookieStore.get("activeBusiness")?.value;

    return activeBusiness ? JSON.parse(activeBusiness) : null;
};

export const deleteActiveLocationCookie = async () => {
    cookies().delete("activeLocation");
};

// export const getActiveLocation = async (): Promise<activeLocation | null> => {
//     const cookieStore = cookies();

//     const activeLocation = cookieStore.get("activeLocation")?.value;
//     return activeLocation ? JSON.parse(activeLocation) : null;
// };

/*export const deleteActiveBusinessCookie = async () => {
    cookies().delete("activeBusiness");
};*/

/*
export const getActiveBusiness = async (): Promise<activeBusiness | null> => {
    const cookieStore = cookies();

    const activeBusiness = cookieStore.get("activeBusiness")?.value;

    return activeBusiness ? JSON.parse(activeBusiness) : null;
};
*/

/*
export const deleteActiveLocationCookie = async () => {
    cookies().delete("activeLocation");
};
*/

/*export const getActiveLocation = async (): Promise<activeLocation | null> => {
    const cookieStore = cookies();

    const activeLocation = cookieStore.get("activeLocation")?.value;
    return activeLocation ? JSON.parse(activeLocation) : null;
};*/
