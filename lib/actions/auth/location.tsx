"use server";

import { FormResponse } from "@/types/types";
import { parseStringify } from "@/lib/utils";

/**
 * Location creation is now handled atomically together with business creation
 * via POST /api/v1/businesses/with-locations.
 * See createBusinessWithLocations in ./business.tsx.
 *
 * This function is kept for backward compatibility with any code that still
 * references it directly. It returns an error directing callers to use the
 * combined endpoint instead.
 */
export const createBusinessLocation = async (
  _businessLocation: any,
): Promise<FormResponse> => {
  return parseStringify({
    responseType: "error",
    message:
      "Location creation is now part of the business setup. Please use the combined business + location form.",
    error: new Error("Use createBusinessWithLocations instead"),
  });
};
