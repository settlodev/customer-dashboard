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

// ── Chunked cookie helpers ──────────────────────────────────────────
// Browser cookie size limit is ~4096 bytes per cookie. JWTs with many
// claims easily exceed this. We split large values across numbered
// chunks: authToken.0, authToken.1, etc.

const COOKIE_CHUNK_SIZE = 3800; // Leave room for name + attributes
const MAX_CHUNKS = 10;
const AUTH_TOKEN_COOKIE = "authToken";

// Import for internal use — callers should import from "@/lib/jwt-utils" directly
import { extractSubscriptionStatus } from "@/lib/jwt-utils";

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("strict" as const) : ("lax" as const),
  };
}

async function setChunkedCookie(
  name: string,
  value: string,
  extraOptions?: { maxAge?: number },
) {
  const cookieStore = await cookies();
  const options = { ...getCookieOptions(), ...extraOptions };

  // Delete old chunks and base cookie first
  try { cookieStore.delete(name); } catch { /* ok */ }
  for (let i = 0; i < MAX_CHUNKS; i++) {
    try { cookieStore.delete(`${name}.${i}`); } catch { break; }
  }

  if (value.length <= COOKIE_CHUNK_SIZE) {
    cookieStore.set({ name, value, ...options });
  } else {
    const numChunks = Math.ceil(value.length / COOKIE_CHUNK_SIZE);
    for (let i = 0; i < numChunks; i++) {
      const chunk = value.substring(
        i * COOKIE_CHUNK_SIZE,
        (i + 1) * COOKIE_CHUNK_SIZE,
      );
      cookieStore.set({ name: `${name}.${i}`, value: chunk, ...options });
    }
  }
}

async function getChunkedCookie(name: string): Promise<string | null> {
  const cookieStore = await cookies();

  // Try non-chunked first
  const direct = cookieStore.get(name)?.value;
  if (direct) return direct;

  // Try chunked
  let value = "";
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const chunk = cookieStore.get(`${name}.${i}`)?.value;
    if (!chunk) break;
    value += chunk;
  }
  return value || null;
}

async function deleteChunkedCookie(name: string) {
  const cookieStore = await cookies();
  try { cookieStore.delete(name); } catch { /* ok */ }
  for (let i = 0; i < MAX_CHUNKS; i++) {
    try { cookieStore.delete(`${name}.${i}`); } catch { /* ok */ }
  }
}

// ── Public API ──────────────────────────────────────────────────────

export const getUser = async () => {
  const session = await auth();

  if (!session) {
    await logout();
  }

  return session?.user;
};

export const getAuthToken = async (): Promise<AuthToken | null> => {
  const raw = await getChunkedCookie(AUTH_TOKEN_COOKIE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthToken;
    return parsed.accessToken ? parsed : null;
  } catch {
    return null;
  }
};

export const updateAuthToken = async (token: AuthToken) => {
  await setChunkedCookie(AUTH_TOKEN_COOKIE, JSON.stringify(token));
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
    subscriptionStatus: extractSubscriptionStatus(loginResponse.accessToken),
  };

  await setChunkedCookie(AUTH_TOKEN_COOKIE, JSON.stringify(authTokenData));
  return authTokenData;
};

export const createAuthToken = async (user: any) => {
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

  await setChunkedCookie(AUTH_TOKEN_COOKIE, JSON.stringify(authTokenData));
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
    await deleteChunkedCookie(AUTH_TOKEN_COOKIE);

    const cookieStore = await cookies();
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
  } catch {
    // Cookies can only be modified in Server Actions or Route Handlers.
    // This silently fails when called from Server Components (e.g., layout.tsx).
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
