"use server";

import { cookies } from "next/headers";
import { User } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  activeBusiness,
  AuthToken,
  FormResponse,
  LoginResponse,
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

  return parsedTokens.accessToken ? parsedTokens : null;
};

export const updateAuthToken = async (token: AuthToken) => {
  const cookieStore = await cookies();

  cookieStore.set({
    name: "authToken",
    value: JSON.stringify(token),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
};

export const createAuthTokenFromLogin = async (
  loginResponse: LoginResponse,
  profileData?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    pictureUrl?: string | null;
    isBusinessRegistrationComplete?: boolean;
    isLocationRegistrationComplete?: boolean;
    countryId?: string;
    countryCode?: string;
    theme?: string | null;
  },
) => {
  const cookieStore = await cookies();
  const authTokenData: AuthToken = {
    accessToken: loginResponse.accessToken,
    refreshToken: loginResponse.refreshToken,
    userId: loginResponse.userId,
    accountId: loginResponse.accountId,
    email: loginResponse.email,
    firstName: profileData?.firstName ?? "",
    lastName: profileData?.lastName ?? "",
    phoneNumber: profileData?.phoneNumber ?? "",
    pictureUrl: profileData?.pictureUrl ?? null,
    emailVerified: loginResponse.emailVerified,
    isBusinessRegistrationComplete:
      profileData?.isBusinessRegistrationComplete ?? false,
    isLocationRegistrationComplete:
      profileData?.isLocationRegistrationComplete ?? false,
    countryId: profileData?.countryId ?? "",
    countryCode: profileData?.countryCode ?? "",
    theme: profileData?.theme ?? null,
    verificationResendToken: loginResponse.verificationResendToken,
  };

  cookieStore.set({
    name: "authToken",
    value: JSON.stringify(authTokenData),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });

  return authTokenData;
};

export const createAuthToken = async (user: any) => {
  const cookieStore = await cookies();
  const authTokenData: AuthToken = {
    accessToken: user.accessToken ?? "",
    refreshToken: user.refreshToken ?? "",
    userId: user.id ?? user.userId ?? "",
    accountId: user.accountId ?? "",
    email: user.email ?? "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phoneNumber: user.phoneNumber ?? "",
    pictureUrl: user.pictureUrl ?? user.avatar ?? null,
    emailVerified: user.emailVerified != null,
    isBusinessRegistrationComplete:
      user.isBusinessRegistrationComplete ?? false,
    isLocationRegistrationComplete:
      user.isLocationRegistrationComplete ?? false,
    countryId: user.countryId ?? user.country ?? "",
    countryCode: user.countryCode ?? "",
    theme: user.theme ?? null,
  };

  cookieStore.set({
    name: "authToken",
    value: JSON.stringify(authTokenData),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
};

export const getAuthenticatedUser = async (): Promise<FormResponse | User> => {
  const user = await getUser();

  if (!user) {
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
    cookieStore.delete("pendingVerification");
  } catch (e) {
    console.log("Error deleting auth cookie", e);
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

export const storePendingVerification = async (data: {
  userId: string;
  email: string;
  verificationResendToken?: string;
  accessToken?: string;
  refreshToken?: string;
}) => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "pendingVerification",
    value: JSON.stringify(data),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 900, // 15 minutes
  });
};

export const getPendingVerification = async () => {
  const cookieStore = await cookies();
  const data = cookieStore.get("pendingVerification")?.value;
  if (!data) return null;
  try {
    return JSON.parse(data) as {
      userId: string;
      email: string;
      verificationResendToken?: string;
      accessToken?: string;
      refreshToken?: string;
    };
  } catch {
    return null;
  }
};

export const clearPendingVerification = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("pendingVerification");
};
