"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import type { ConsumptionRule, ConsumptionType } from "@/types/consumption-rule/type";
import { ConsumptionRuleSchema } from "@/types/consumption-rule/schema";
import { inventoryUrl } from "./inventory-client";

export async function getConsumptionRules(
  type?: ConsumptionType,
): Promise<ConsumptionRule[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    params.set("active", "true");
    if (type) params.set("type", type);

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/consumption-rules?${params.toString()}`),
    );
    return parseStringify(data) as ConsumptionRule[];
  } catch {
    return [];
  }
}

export async function getConsumptionRule(id: string): Promise<ConsumptionRule | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/consumption-rules/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createConsumptionRule(
  rule: z.infer<typeof ConsumptionRuleSchema>,
): Promise<FormResponse | void> {
  const validated = ConsumptionRuleSchema.safeParse(rule);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/consumption-rules"), validated.data);

    revalidatePath("/consumption-rules");
    return parseStringify({
      responseType: "success",
      message: "Consumption rule created successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create consumption rule",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteConsumptionRule(id: string): Promise<void> {
  if (!id) throw new Error("Rule ID is required");
  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/consumption-rules/${id}`));
  revalidatePath("/consumption-rules");
}

export async function createNewVersion(
  id: string,
  rule: z.infer<typeof ConsumptionRuleSchema>,
): Promise<FormResponse | void> {
  const validated = ConsumptionRuleSchema.safeParse(rule);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      inventoryUrl(`/api/v1/consumption-rules/${id}/versions`),
      validated.data,
    );

    revalidatePath("/consumption-rules");
    return parseStringify({
      responseType: "success",
      message: "Consumption rule updated (new version created)",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update consumption rule",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
