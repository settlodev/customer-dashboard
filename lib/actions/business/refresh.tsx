"use server";

import { revalidatePath } from "next/cache";
import { Business, MinimalBusiness } from "@/types/business/type";
import { cookies } from "next/headers";
import { Location } from "@/types/location/type";
import { redirect } from "next/navigation";
import { activeBusiness } from "@/types/types";
import { deleteActiveWarehouseCookie } from "../warehouse/current-warehouse-action";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { getDomainConfig } from "@/lib/domain-config";

const createMinimalBusiness = (business: Business): MinimalBusiness => {
  return {
    isArchived: business.isArchived,
    totalLocations: business.totalLocations,
    user: business.user,
    id: business.id,
    name: business.name,
    slug: business.slug,
    prefix: business.prefix,
    businessType: business.businessType,
    logo: business.logo || null,
    country: business.country,
    countryName: business.countryName,
    status: business.status,
  };
};

export const clearBusiness = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete("currentBusiness");
  cookieStore.delete("activeBusiness");
  cookieStore.delete("currentLocation");
  revalidatePath("/", "layout");
};

export const refreshBusiness = async (
  data: Business,
): Promise<{ redirectUrl: string }> => {
  if (!data) throw new Error("Business data is required");

  const { rootDomain, getSubOrigin } = getDomainConfig();

  const minimalBusiness = {
    ...createMinimalBusiness(data),
    slug: data.slug,
  };

  const isProduction = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();

  cookieStore.delete("currentBusiness");
  cookieStore.set({
    name: "currentBusiness",
    value: JSON.stringify(minimalBusiness),
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: rootDomain,
    path: "/",
  });

  cookieStore.delete("activeBusiness");
  cookieStore.set({
    name: "activeBusiness",
    value: JSON.stringify({ businessId: data.id }),
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: rootDomain,
    path: "/",
  });

  cookieStore.delete("currentLocation");
  cookieStore.delete("currentWarehouse");

  return { redirectUrl: `${getSubOrigin(data.slug)}/select-location` };
};
export const switchLocation = async (data: Location): Promise<void> => {
  if (!data)
    throw new Error("Location data is required to perform this request");
  const isProduction = process.env.NODE_ENV === "production";
  const { rootDomain } = getDomainConfig();
  const cookieStore = await cookies();

  // Delete existing cookie first
  cookieStore.delete("currentLocation");

  cookieStore.set({
    name: "currentLocation",
    value: JSON.stringify(data),
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: isProduction ? rootDomain : ".lvh.me",
    path: "/",
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
};

export const refreshLocation = async (
  data: Location | Warehouses,
): Promise<void> => {
  if (!data) throw new Error("Location data is required");

  const { rootDomain } = getDomainConfig();
  const isProduction = process.env.NODE_ENV === "production";

  await deleteActiveWarehouseCookie();

  const cookieStore = await cookies();
  cookieStore.set({
    name: "currentLocation",
    value: JSON.stringify(data),
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: rootDomain,
    path: "/",
  });

  revalidatePath("/dashboard");
};
