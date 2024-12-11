"use server"
import { getAuthenticatedUser} from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { BusinessSchema } from "@/types/business/schema";
import { AuthToken, FormResponse } from "@/types/types";
import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { User } from "next-auth";
import { Business } from "@/types/business/type";
import { refreshBusiness } from "../business/refresh";

export const createBusiness = async (
    business: z.infer<typeof BusinessSchema>
  ): Promise<Business | FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    let success: boolean = false;
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
      const user = userId;

      const payload = {
        ...businessValidData.data,
        user,
      };

      const response = await apiClient.post(
        `/api/businesses/${userId}/create`,
        payload
      );

      // console.log("Response from API after creating business ", response);

      if (response) {
        const token = cookies().get("authToken")?.value;
        if (token) {
          const authToken = JSON.parse(token) as AuthToken;
          authToken.businessComplete = true;
          cookies().set("authToken", JSON.stringify(authToken), {
            path: "/",
            httpOnly: true,
          });

          success = true;

          if (success) {
            cookies().delete("activeBusiness");
            cookies().set(
              "activeBusiness",
              JSON.stringify({ Business: response }),
              { path: "/", httpOnly: true }
            );

            console.log("Active business is:", cookies().get("activeBusiness"));
          }

          await refreshBusiness(response as Business);
          return response as Business;
        } else {
          console.log("No token found");
        }
      } else {
        console.log("Unexpected response:", response);
      }
    } catch (error) {
      if (isRedirectError(error)) throw error;

      console.error("Error creating business", error);
      formResponse = {
        responseType: "error",
        message:
          "Something went wrong while processing your request, please try again",
        error: error instanceof Error ? error : new Error(String(error)),
      };
      return parseStringify(formResponse);
    }

    if (success) {
      redirect("/business-location");
    }
  };




