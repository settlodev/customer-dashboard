"use server";

import { revalidatePath } from "next/cache";
import { Business, MinimalBusiness } from "@/types/business/type";
import { cookies } from "next/headers";
import { activeBusiness } from "@/types/types";
import { clearDestination } from "@/lib/actions/destination";

// Business-level cookie helpers. Destination (location/store/warehouse)
// switching lives in `@/lib/actions/destination`.

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
  await clearDestination();
  revalidatePath("/", "layout");
};

export const refreshBusiness = async (data: Business): Promise<void> => {
  if (!data)
    throw new Error("Business data is required to perform this request");

  const minimalBusiness = createMinimalBusiness(data);
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.delete("currentBusiness");
  cookieStore.set({
    name: "currentBusiness",
    value: JSON.stringify(minimalBusiness),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
  });

  cookieStore.delete("activeBusiness");
  const businessActive: activeBusiness = {
    businessId: data.id as `${string}-${string}-${string}-${string}-${string}`,
  };
  cookieStore.set({
    name: "activeBusiness",
    value: JSON.stringify(businessActive),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
  });

  // A new business means any previously-active destination no longer applies.
  await clearDestination();

  revalidatePath("/", "layout");
};
