"use server";

import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";

export const fetchCountries = async () => {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;

    const response = await apiClient.get("/api/countries");

    return parseStringify(response);
  } catch (error) {
    throw error;
  }
};
