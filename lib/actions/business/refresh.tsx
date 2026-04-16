"use server";

import { revalidatePath } from "next/cache";
import { Business, MinimalBusiness } from "@/types/business/type";
import { cookies } from "next/headers";
import { Location } from "@/types/location/type";
import { redirect } from "next/navigation";
import { activeBusiness } from "@/types/types";
import { deleteActiveWarehouseCookie } from "../warehouse/current-warehouse-action";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";
import { extractSubscriptionStatus } from "@/lib/jwt-utils";

const createMinimalBusiness = (business: Business): MinimalBusiness => {
  return {
    id: business.id,
    identifier: business.identifier,
    name: business.name,
    businessTypeId: business.businessTypeId,
    businessTypeName: business.businessTypeName,
    logoUrl: business.logoUrl || null,
    active: business.active,
    accountId: business.accountId,
    countryId: business.countryId,
  };
};

export const clearBusiness = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete("currentBusiness");
  cookieStore.delete("activeBusiness");
  cookieStore.delete("currentLocation");
  revalidatePath("/", "layout");
};

export const refreshBusiness = async (data: Business): Promise<void> => {
  if (!data)
    throw new Error("Business data is required to perform this request");

  const minimalBusiness = createMinimalBusiness(data);
  const cookieStore = await cookies();

  // Delete the existing cookie first
  cookieStore.delete("currentBusiness");

  cookieStore.set({
    name: "currentBusiness",
    value: JSON.stringify(minimalBusiness),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });

  cookieStore.delete("activeBusiness");
  const businessActive: activeBusiness = {
    businessId: data.id as `${string}-${string}-${string}-${string}-${string}`,
  };

  cookieStore.set({
    name: "activeBusiness",
    value: JSON.stringify(businessActive),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });

  revalidatePath("/", "layout");
};

export const switchLocation = async (data: Location): Promise<void> => {
  if (!data)
    throw new Error("Location data is required to perform this request");

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  // Delete existing cookie first
  cookieStore.delete("currentLocation");

  cookieStore.set({
    name: "currentLocation",
    value: JSON.stringify(data),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
  });

  // Refresh the access token so the JWT picks up the new location's
  // subscription status. The middleware reads subscriptionStatus from the
  // auth token to enforce per-location subscription gates.
  try {
    const authToken = await getAuthToken();
    if (authToken?.refreshToken) {
      const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || process.env.SERVICE_URL || "";
      const clientId = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (clientId) headers["X-Client-Id"] = clientId;

      const res = await fetch(`${AUTH_SERVICE_URL}/auth/token-refresh`, {
        method: "POST",
        headers,
        body: JSON.stringify({ refreshToken: authToken.refreshToken }),
      });

      if (res.ok) {
        const refreshData = await res.json();
        await updateAuthToken({
          ...authToken,
          accessToken: refreshData.accessToken,
          refreshToken: refreshData.refreshToken || authToken.refreshToken,
          subscriptionStatus: extractSubscriptionStatus(refreshData.accessToken),
        });
      }
    }
  } catch {
    // Non-critical — the next API call will refresh the token
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
};

export const refreshLocation = async (
  data: Location | Warehouses,
): Promise<void> => {
  if (!data)
    throw new Error("Location data is required to perform this request");

  await deleteActiveWarehouseCookie();

  const cookieStore = await cookies();
  cookieStore.set({
    name: "currentLocation",
    value: JSON.stringify(data),
    sameSite: "strict",
  });

  revalidatePath("/dashboard");
};

export const switchStore = async (data: { id: string; name: string }): Promise<void> => {
  if (!data) throw new Error("Store data is required");

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set({
    name: "currentStore",
    value: JSON.stringify(data),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
  });

  revalidatePath("/dashboard");
};

export const clearStore = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete("currentStore");
  revalidatePath("/dashboard");
};
