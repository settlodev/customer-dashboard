"use server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { BusinessSchema } from "@/types/business/schema";
import { AuthToken, FormResponse } from "@/types/types";
import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { cookies } from "next/headers";
import { User } from "next-auth";
import { Business } from "@/types/business/type";
import { refreshBusiness } from "../business/refresh";

export const createBusiness = async (
  business: z.infer<typeof BusinessSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const businessValidData = BusinessSchema.safeParse(business);

  if (!businessValidData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(businessValidData.error.message),
    };
    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    const AuthenticatedUser = (await getAuthenticatedUser()) as User;
    const userId = AuthenticatedUser.id;
    const owner = userId;

    const payload = {
      ...businessValidData.data,
      owner,
    };

    const response = await apiClient.post(
      `/api/businesses/${userId}/create`,
      payload,
    );

    if (response) {
      const cookieStore = await cookies();
      const token = cookieStore.get("authToken")?.value;
      if (token) {
        // Set auth token business complete as true
        const authToken = JSON.parse(token) as AuthToken;
        authToken.businessComplete = true;
        cookieStore.set("authToken", JSON.stringify(authToken), {
          path: "/",
          httpOnly: true,
        });

        console.log(
          "Current business BEFORE creating",
          cookieStore.get("currentBusiness")?.value,
        );

        // Set active business to currently created business
        await refreshBusiness(response as Business);

        console.log(
          "Current business AFTER creating",
          cookieStore.get("currentBusiness")?.value,
        );

        return {
          responseType: "success",
          message: "Business created successfully",
          data: response,
        };
      } else {
        console.log("No token found");
      }
    } else {
      console.log("Unexpected response:", response);
    }
  } catch (error) {
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
    return parseStringify(formResponse);
  }
};
