"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type {
  AccountingIntegration,
  IntegrationAccountMapping,
  IntegrationProvider,
} from "@/types/integration/type";

import { accountingUrl } from "./accounting-client";

export async function listIntegrations(): Promise<AccountingIntegration[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(accountingUrl(`/api/v1/integrations`));
    return (parseStringify(data) as AccountingIntegration[]) ?? [];
  } catch {
    return [];
  }
}

export async function listBusinessIntegrations(): Promise<
  AccountingIntegration[]
> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/integrations/business`),
    );
    return (parseStringify(data) as AccountingIntegration[]) ?? [];
  } catch {
    return [];
  }
}

interface ConnectInput {
  provider: IntegrationProvider;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}

export async function startIntegrationConnect(
  input: ConnectInput,
): Promise<FormResponse<{ authorizationUrl: string; state: string }>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/integrations/connect`),
      input,
    )) as { authorizationUrl: string; state: string };
    return {
      responseType: "success",
      message: "Redirect to provider",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("startIntegrationConnect failed", error);
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to connect",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function disconnectIntegration(
  id: string,
): Promise<FormResponse<AccountingIntegration>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/integrations/${id}/disconnect`),
      {},
    )) as AccountingIntegration;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Integration disconnected",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("disconnectIntegration failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to disconnect",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function listIntegrationAccountMappings(
  integrationId: string,
): Promise<IntegrationAccountMapping[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/integrations/${integrationId}/mappings`),
    );
    return (parseStringify(data) as IntegrationAccountMapping[]) ?? [];
  } catch {
    return [];
  }
}

export async function listExternalAccounts(
  integrationId: string,
): Promise<unknown[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/integrations/${integrationId}/external-accounts`,
      ),
    );
    return (parseStringify(data) as unknown[]) ?? [];
  } catch {
    return [];
  }
}

interface CreateMappingInput {
  settloAccountId: string;
  externalAccountId: string;
  externalAccountName?: string;
  mappingType?: string;
}

export async function createIntegrationAccountMapping(
  integrationId: string,
  input: CreateMappingInput,
): Promise<FormResponse<IntegrationAccountMapping>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/integrations/${integrationId}/mappings`),
      input,
    )) as IntegrationAccountMapping;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Mapping saved",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("createIntegrationAccountMapping failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to save mapping",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
