"use server";

import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { Business } from "@/types/business/type";
import { getAuthToken } from "@/lib/auth-utils";
import { endpoints } from "@/types/endpoints";
import ApiClient from "@/lib/settlo-api-client";
import { Location } from "@/types/location/type";
import { getBusiness } from "@/lib/actions/business/get";
import { signOut } from "@/auth";
import { fetchAllBusinesses } from "@/lib/actions/business-actions";
import { refreshBusiness } from "@/lib/actions/business/refresh";
import { redirect } from "next/navigation";

export const getCurrentBusiness = async (): Promise<Business | undefined> => {
  try {
    // Check for existing business cookie
    const cookieStore = await cookies();
    const businessCookie = cookieStore.get("currentBusiness");

    // If cookie exists, try to parse it
    if (businessCookie) {
      console.warn("Business cookie found, parsing...");
      try {
        return JSON.parse(businessCookie.value) as Business;
      } catch (error) {
        console.error("Failed to parse business cookie:", error);
        cookieStore.delete("currentBusiness");
      }
    }

    console.warn(
      "No business cookie found, fetching fresh data from current location...",
    );
    // No cookie or invalid cookie, fetch fresh data
    const currentLocation = await getCurrentLocation();

    if (!currentLocation) {
      console.warn(
        "No current location found, fetching all business data for user...",
      );
      // Logged in but no business data, if user has only one business registered, select it and set as current business
      const userBusinesses = await fetchAllBusinesses();

      if (userBusinesses && userBusinesses.length === 1) {
        console.warn("User has only one business, selecting it...");
        await refreshBusiness(userBusinesses[0]);
        return userBusinesses[0];
      } else if (userBusinesses && userBusinesses.length > 1) {
        console.warn(
          "User has more than one business, redirecting to business selection page...",
        );
        redirect("/select-business");
      } else {
        console.warn(
          "User has no business, redirecting to business creation page...",
        );
        redirect("/business-location");
      }
    }

    const currentBusiness = await getBusiness(currentLocation.business);

    if (!currentBusiness) {
      console.warn(
        "No current location found, fetching all business data for user...",
      );
      // Logged in but no business data, if user has only one business registered, select it and set as current business
      const userBusinesses = await fetchAllBusinesses();

      if (userBusinesses && userBusinesses.length === 1) {
        console.warn("User has only one business, selecting it...");
        await refreshBusiness(userBusinesses[0]);
        return userBusinesses[0];
      } else if (userBusinesses && userBusinesses.length > 1) {
        console.warn(
          "User has more than one business, redirecting to business selection page...",
        );
        redirect("/select-business");
      } else {
        console.warn(
          "User has no business, redirecting to business creation page...",
        );
        redirect("/business-registration");
      }
    }

    return parseStringify(currentBusiness);
  } catch (error) {
    console.error("Error in getting current business - logging out :", error);

    await signOut();
  }
};

export const getCurrentLocation = async (): Promise<Location | undefined> => {
  const cookieStore = await cookies();
  const locationCookie = cookieStore.get("currentLocation");

  if (!locationCookie) return undefined;

  try {
    return JSON.parse(locationCookie.value) as Location;
  } catch (error) {
    console.error("Failed to parse location cookie:", error);
    return undefined;
  }
};

export const getBusinessDropDown = async (): Promise<Business[] | null> => {
  try {
    const authToken = await getAuthToken();
    const userId = authToken?.id;

    const myEndpoints = endpoints({ userId: userId });
    const apiClient = new ApiClient();

    try {
      const data = await apiClient.get(myEndpoints.business.list.endpoint);
      return parseStringify(data);
    } catch (apiError: any) {
      console.error("API request failed:", apiError);
      throw apiError;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Failed to get business list:", error);

    return null;
  }
};
