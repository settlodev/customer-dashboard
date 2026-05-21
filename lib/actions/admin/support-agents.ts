"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  CreateSupportAgentRequest,
  SupportAgentPage,
  SupportAgentResponse,
} from "@/types/admin/support-agent";
import { CreateSupportAgentSchema } from "@/types/admin/schemas";

const PATH = "/api/v1/admin/support-agents";

function staffClient() {
  return new ApiClient("accounts", "staff");
}

export async function listSupportAgents(
  page = 0,
  size = 20,
): Promise<SupportAgentPage> {
  const qs = new URLSearchParams();
  qs.set("page", String(Math.max(0, page)));
  qs.set("size", String(size));
  const data = await staffClient().get<SupportAgentPage>(
    `${PATH}?${qs.toString()}`,
  );
  return parseStringify(data);
}

export async function getSupportAgent(
  agentId: string,
): Promise<SupportAgentResponse> {
  const data = await staffClient().get<SupportAgentResponse>(
    `${PATH}/${agentId}`,
  );
  return parseStringify(data);
}

export async function createSupportAgent(
  payload: z.infer<typeof CreateSupportAgentSchema>,
): Promise<FormResponse<SupportAgentResponse>> {
  const validated = CreateSupportAgentSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message:
        validated.error.errors[0]?.message ??
        "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const body: CreateSupportAgentRequest = {
      firstName: validated.data.firstName,
      lastName: validated.data.lastName,
      email: validated.data.email,
      password: validated.data.password,
      notes: validated.data.notes || undefined,
    };
    const created = await staffClient().post<
      SupportAgentResponse,
      CreateSupportAgentRequest
    >(PATH, body);

    revalidatePath("/admin/support-agents");
    return parseStringify({
      responseType: "success",
      message: "Support agent created",
      data: created,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create support agent",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deactivateSupportAgent(
  agentId: string,
): Promise<FormResponse<{ message: string }>> {
  try {
    const result = await staffClient().post<
      { message: string },
      Record<string, never>
    >(`${PATH}/${agentId}/deactivate`, {});
    revalidatePath("/admin/support-agents");
    return parseStringify({
      responseType: "success",
      message: result?.message ?? "Support agent deactivated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate support agent",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function reactivateSupportAgent(
  agentId: string,
): Promise<FormResponse<{ message: string }>> {
  try {
    const result = await staffClient().post<
      { message: string },
      Record<string, never>
    >(`${PATH}/${agentId}/reactivate`, {});
    revalidatePath("/admin/support-agents");
    return parseStringify({
      responseType: "success",
      message: result?.message ?? "Support agent reactivated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to reactivate support agent",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
