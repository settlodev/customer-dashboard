"use server";

import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { EmploymentDetailsSchema } from "@/types/tanqr/schema";
import { z } from "zod";
import { FormResponse } from "@/types/types";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { TanqrSchema } from "@/types/mhb/schema";

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
    // console.log("Verifying NIDA", verifyNida);
    return parseStringify(verifyNida);
  } catch (error: any) {
    const apiErrorMessage = error?.response?.data?.message || error?.message;

    console.log("Error submitNidaAnswer", apiErrorMessage);

    return parseStringify({
      responseType: "error",
      message:
        apiErrorMessage ||
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    });
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
  } catch (error: any) {
    const apiErrorMessage = error?.response?.data?.message || error?.message;

    console.log("Error submitNidaAnswer", apiErrorMessage);

    return parseStringify({
      responseType: "error",
      message:
        apiErrorMessage ||
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const createAccountMhb = async (
  details: z.infer<typeof EmploymentDetailsSchema>,
): Promise<FormResponse> => {
  const user = await getAuthenticatedUser();
  const location = await getCurrentLocation();
  let formResponse: FormResponse | null = null;

  const validData = EmploymentDetailsSchema.safeParse(details);
  if (!validData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the fields",
      error: new Error(validData.error.message),
    };
    return parseStringify(formResponse);
  }

  if (!user || !("id" in user)) {
    throw new Error("User not authenticated or invalid user object");
  }

  const payload = {
    ...validData.data,
    userId: user.id,
    locationId: location?.id,
  };
  console.log("payload", JSON.stringify(payload, null, 2));

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(
      "/mhb/api/v1/accounts/create",
      payload,
    );
    console.log("Response after creating account", response);
    return parseStringify(response);
  } catch (error: any) {
    const apiErrorMessage = error?.response?.data?.message || error?.message;
    console.log("Error creating account", apiErrorMessage);
    return parseStringify({
      responseType: "error",
      message:
        apiErrorMessage ||
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const initiateTanQr = async (
  details: z.infer<typeof TanqrSchema>,
): Promise<FormResponse> => {
  const user = await getAuthenticatedUser();
  const location = await getCurrentLocation();
  let formResponse: FormResponse | null = null;

  const validData = TanqrSchema.safeParse(details);
  if (!validData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the fields",
      error: new Error(validData.error.message),
    };
    return parseStringify(formResponse);
  }

  if (!user || !("id" in user)) {
    throw new Error("User not authenticated or invalid user object");
  }

  const payload = {
    ...validData.data,
    userId: user.id,
    locationId: location?.id,
  };
  // console.log("payload", JSON.stringify(payload, null, 2));

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(
      "/mhb/api/v1/accounts/tanqr/initiate",
      payload,
    );
    console.log("Response after initiating tanqr", response);
    return parseStringify(response);
  } catch (error: any) {
    console.log("Error initiating tanqr", error);

    const apiErrorMessage = error?.response?.data?.message || error?.message;

    return parseStringify({
      responseType: "error",
      message:
        apiErrorMessage ||
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};
