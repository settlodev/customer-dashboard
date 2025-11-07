"use server";

import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";

export const fetchMhbDataMap = async (): Promise<any> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const mhbData = await apiClient.get("/mhb/api/v1/accounts/data-map");
    // console.log("Fetched MhbDataMap are", mhbData);

    return parseStringify(mhbData);
  } catch (error) {
    console.log("Error fetchMhbDataMap", error);
    throw error;
  }
};

export const validateNida = async (nidaNumber: string): Promise<any> => {
  const user = await getAuthenticatedUser();

  if (!user || !("id" in user)) {
    throw new Error("User not authenticated or invalid user object");
  }

  const payload = {
    userId: user.id,
    identificationNumber: nidaNumber,
  };

  console.log("payload", JSON.stringify(payload, null, 2));

  try {
    const apiClient = new ApiClient();
    const verifyNida = await apiClient.post(
      "/mhb/api/v1/identity/verify",
      JSON.stringify(payload),
    );
    console.log("Verifying NIDA", verifyNida);
    return parseStringify(verifyNida);
  } catch (error) {
    console.log("Error validateNida", error);
    throw error;
  }
};

export const submitNidaAnswer = async (
  identificationNumber: string,
  questionCode: string,
  answer: string,
): Promise<any> => {
  const user = await getAuthenticatedUser();

  if (!user || !("id" in user)) {
    throw new Error("User not authenticated or invalid user object");
  }

  const payload = {
    userId: user.id,
    identificationNumber: identificationNumber,
    questionCode: questionCode,
    answer: answer,
  };

  console.log("Submitting answer payload", JSON.stringify(payload, null, 2));

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(
      "/mhb/api/v1/identity/answer",
      JSON.stringify(payload),
    );
    console.log("Answer submission response", response);
    return parseStringify(response);
  } catch (error) {
    console.log("Error submitNidaAnswer", error);
    throw error;
  }
};
