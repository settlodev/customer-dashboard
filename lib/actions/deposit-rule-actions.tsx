"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { DepositRule } from "@/types/deposit-rule/type";
import { DepositRuleSchema } from "@/types/deposit-rule/schema";

/**
 * CRUD against the OMS deposit-rules endpoint. Rules are priority-resolved
 * at reservation-create time: TABLE_SLOT > TABLE > SLOT > GLOBAL.
 *
 * <p>The dashboard typically lets staff configure these on the
 * "Reservation settings" page alongside slots and exceptions.
 */
const oms = () => new ApiClient("orders");

const base = (locationId: string) =>
  `/api/v1/locations/${locationId}/deposit-rules`;

export const fetchDepositRules = async (): Promise<DepositRule[]> => {
  const location = await getCurrentLocation();
  if (!location?.id) return [];
  const data = await oms().get<DepositRule[]>(base(location.id));
  return parseStringify(data);
};

export const getDepositRule = async (id: UUID): Promise<DepositRule> => {
  const location = await getCurrentLocation();
  const data = await oms().get<DepositRule>(
    `${base(location?.id as string)}/${id}`,
  );
  return parseStringify(data);
};

export const createDepositRule = async (
  rule: z.infer<typeof DepositRuleSchema>,
): Promise<FormResponse | void> => {
  const validated = DepositRuleSchema.safeParse(rule);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please correct the highlighted fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    await oms().post(base(location?.id as string), validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create deposit rule",
    );
  }

  revalidatePath("/reservations/settings");
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
      "Please correct the highlighted fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    await oms().put(`${base(location?.id as string)}/${id}`, validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update deposit rule",
    );
  }

  revalidatePath("/reservations/settings");
  return SettloErrorHandler.createSuccessResponse(
    "Deposit rule updated successfully",
  );
};

export const deleteDepositRule = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Deposit rule ID is required");
  const location = await getCurrentLocation();
  await oms().delete(`${base(location?.id as string)}/${id}`);
  revalidatePath("/reservations/settings");
};
