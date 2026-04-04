"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { DepositRule } from "@/types/deposit-rule/type";
import { DepositRuleSchema } from "@/types/deposit-rule/schema";

export const fetchDepositRules = async (): Promise<DepositRule[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get(`/api/deposit-rules/${location?.id}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createDepositRule = async (
  rule: z.infer<typeof DepositRuleSchema>,
): Promise<FormResponse | void> => {
  const validated = DepositRuleSchema.safeParse(rule);

  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/deposit-rules/${location?.id}/create`,
      validated.data,
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create deposit rule",
    );
  }

  revalidatePath("/settings");
  return SettloErrorHandler.createSuccessResponse(
    "Deposit rule created successfully",
  );
};

export const updateDepositRule = async (
  id: UUID,
  rule: z.infer<typeof DepositRuleSchema>,
): Promise<FormResponse | void> => {
  const validated = DepositRuleSchema.safeParse(rule);

  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/deposit-rules/${location?.id}/${id}`,
      validated.data,
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update deposit rule",
    );
  }

  revalidatePath("/settings");
  return SettloErrorHandler.createSuccessResponse(
    "Deposit rule updated successfully",
  );
};

export const deleteDepositRule = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Deposit rule ID is required");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/deposit-rules/${location?.id}/${id}`);
    revalidatePath("/settings");
  } catch (error) {
    throw error;
  }
};
