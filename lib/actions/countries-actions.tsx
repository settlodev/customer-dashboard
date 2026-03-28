"use server";

import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";

export const fetchCountries = async () => {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;

    const response = await apiClient.get("/api/v1/public/countries");

    return parseStringify(response);
  } catch (error) {
    console.warn("[COUNTRIES] fetchCountries failed:", (error as any)?.message);
    return [];
  }
};
