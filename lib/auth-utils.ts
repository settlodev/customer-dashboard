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

export const deleteAuthToken = async () => {
    cookies().delete("authToken");
};

export const updateAuthToken = async (token: AuthToken) => {
    const cookieStore = cookies();

    cookieStore.set({
        name: "authToken",
        value: JSON.stringify(token),
        httpOnly: true, // Only available in server
        secure: false, // Only HTTPS
        //sameSite: "strict", // Do not send to third party servers
    });
};

export const createAuthToken = async (user: ExtendedUser) => {
    console.log("Creating token", user);
    const cookieStore = cookies();

    const authTokenData: AuthToken = {
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        id: user.id,
        authToken: user.authToken,
        refreshToken: user.refreshToken,
        businessComplete: user.businessComplete,
        locationComplete: user.locationComplete,
        subscriptionComplete: user.subscriptionComplete,
        picture: user.picture,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        phoneNumberVerified: user.phoneNumberVerified,
        consent: user.consent,
        theme: user.theme,
        subscriptionStatus: user.subscriptionStatus,
        businessId: user.businessId,
    };

    cookieStore.set({
        name: "authToken",
        value: JSON.stringify(authTokenData),
        httpOnly: true, // Only available in server
        secure: false, // Only HTTPS
        //sameSite: "strict", // Do not send to third party servers
    });
};

export const createActiveBusiness = async (user: ExtendedUser) => {
    console.log("Creating active business", user);
    const cookieStore = cookies();

    const businessActive: activeBusiness = {
        businessId: user.businessId,
    };

    cookieStore.set({
        name: "activeBusiness",
        value: JSON.stringify(businessActive),
        httpOnly: true, // Only available in server
        secure: false, // Only HTTPS
        //sameSite: "strict", // Do not send to third party servers
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
};
