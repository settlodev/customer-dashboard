"use server";

import { cookies } from "next/headers";
import { User } from "next-auth";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import {
  activeBusiness,
  AuthToken,
  ExtendedUser,
  FormResponse,
} from "@/types/types";
import { logout } from "@/lib/actions/auth-actions";

export const getUser = async () => {
  const session = await auth();

  if (!session) {
    await logout();
  }

  return session?.user;
};

export const getAuthToken = async (): Promise<AuthToken | null> => {
  const cookieStore = await cookies();

  const tokens = cookieStore.get("authToken")?.value;

  if (!tokens) return null;

  const parsedTokens = JSON.parse(tokens) as AuthToken;

  return parsedTokens.authToken ? parsedTokens : null;
};

export const updateAuthToken = async (token: AuthToken) => {
  const cookieStore = await cookies();

  cookieStore.set({
    name: "authToken",
    value: JSON.stringify(token),
    httpOnly: true, // Only available in server
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
};

export const createAuthToken = async (user: ExtendedUser) => {
  const cookieStore = await cookies();
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
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
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
  try {
    const cookieStore = await cookies();

    cookieStore.delete("authToken");
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("activeBusiness");
    cookieStore.delete("activeLocation");
    cookieStore.delete("currentBusiness");
    cookieStore.delete("currentLocation");
    cookieStore.delete("authjs.csrf-token");
    cookieStore.delete("authjs.callback-url");
    cookieStore.delete("authjs.session-token");
  } catch (e) {
    // Do not throw error
    console.log("Error deleting auth cookie", e);
    await signOut({ redirect: false });
  }
};

export const deleteActiveBusinessCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("activeBusiness");
};

export const getActiveBusiness = async (): Promise<activeBusiness | null> => {
  const cookieStore = await cookies();

  const activeBusiness = cookieStore.get("activeBusiness")?.value;

  return activeBusiness ? JSON.parse(activeBusiness) : null;
};

export const deleteActiveLocationCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("activeLocation");
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
