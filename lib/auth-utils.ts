"use server";

import { cookies } from "next/headers";
import { User } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  activeBusiness,
  AuthToken,
  ExtendedUser,
  FormResponse,
} from "@/types/types";
import { logout } from "@/lib/actions/auth-actions";
import { getCookieConfig } from "@/lib/cookie-config";
import { getDomainConfig } from "@/lib/domain-config";

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
  const config = getCookieConfig(); // ← use shared config, not hardcoded

  cookieStore.set({
    name: "authToken",
    value: JSON.stringify(token),
    ...config,
  });
};

export const createAuthToken = async (user: ExtendedUser) => {
  const cookieStore = await cookies();
  const config = getCookieConfig();

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
    consent: user.consent,
    theme: user.theme,
    subscriptionStatus: user.subscriptionStatus,
    businessId: user.businessId,
  };

  cookieStore.set({
    name: "authToken",
    value: JSON.stringify(authTokenData),
    ...config,
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
    const { rootDomain } = getDomainConfig();
    const isProduction = process.env.NODE_ENV === "production";

    // Must specify domain when deleting domain-scoped cookies —
    // otherwise delete() only removes the cookie for the current origin
    const domainScopedCookies = [
      "authToken",
      "authjs.session-token",
      "authjs.csrf-token",
      "authjs.callback-url",
      "next-auth.session-token",
      "next-auth.csrf-token",
      "activeBusiness",
      "activeLocation",
      "currentBusiness",
      "currentLocation",
    ];

    for (const name of domainScopedCookies) {
      // Delete with domain scope (removes the shared cookie)
      cookieStore.set({
        name,
        value: "",
        domain: rootDomain,
        path: "/",
        maxAge: 0,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      });

      // Also delete without domain scope (belt-and-suspenders)
      cookieStore.delete(name);
    }
  } catch (e) {
    console.log("Error deleting auth cookie", e);
  }
};

export const deleteActiveBusinessCookie = async () => {
  const cookieStore = await cookies();
  const { rootDomain } = getDomainConfig();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set({
    name: "activeBusiness",
    value: "",
    domain: rootDomain,
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  });
  cookieStore.delete("activeBusiness");
};

export const getActiveBusiness = async (): Promise<activeBusiness | null> => {
  const cookieStore = await cookies();

  const activeBusiness = cookieStore.get("activeBusiness")?.value;

  return activeBusiness ? JSON.parse(activeBusiness) : null;
};

export const deleteActiveLocationCookie = async () => {
  const cookieStore = await cookies();
  const { rootDomain } = getDomainConfig();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set({
    name: "activeLocation",
    value: "",
    domain: rootDomain,
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  });
  cookieStore.delete("activeLocation");
};
