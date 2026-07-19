"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOperatorPermission } from "@/lib/admin/operator-auth";
import { PERM } from "@/lib/admin/permissions";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  AppVersionGateRow,
  UpsertAppVersionGateRequest,
} from "@/types/admin/app-version";

const BASE_PATH = "/api/v1/admin/app-versions";

function staffClient() {
  return new ApiClient("auth", "staff");
}

const UpsertSchema = z
  .object({
    appType: z.string().min(1).max(50),
    platform: z.enum(["ANDROID", "IOS"]),
    minVersionCode: z.coerce.number().int().positive(),
    latestVersionCode: z.coerce.number().int().positive(),
    latestVersionName: z.string().max(50).nullish(),
    updateUrl: z.string().url().max(500).nullish().or(z.literal("")),
    message: z.string().max(500).nullish(),
  })
  .refine((v) => v.minVersionCode <= v.latestVersionCode, {
    path: ["minVersionCode"],
    message:
      "The floor cannot be above the latest published build — no device could satisfy it.",
  });

export async function listAppVersionGates(): Promise<AppVersionGateRow[]> {
  await requireOperatorPermission(PERM.APP_VERSION_MANAGE);
  const data = await staffClient().get<AppVersionGateRow[]>(BASE_PATH);
  return parseStringify(data ?? []);
}

/**
 * Set the gate. Raising `minVersionCode` blocks every device below it on its
 * next check — treat as a production lever.
 */
export async function upsertAppVersionGate(
  payload: z.infer<typeof UpsertSchema>,
): Promise<{ ok: true; row: AppVersionGateRow } | { ok: false; message: string }> {
  await requireOperatorPermission(PERM.APP_VERSION_MANAGE);

  const validated = UpsertSchema.safeParse(payload);
  if (!validated.success) {
    return {
      ok: false,
      message: validated.error.errors[0]?.message ?? "Check the values",
    };
  }

  const body: UpsertAppVersionGateRequest = {
    ...validated.data,
    latestVersionName: validated.data.latestVersionName || null,
    updateUrl: validated.data.updateUrl || null,
    message: validated.data.message || null,
  };

  try {
    const row = await staffClient().put<
      AppVersionGateRow,
      UpsertAppVersionGateRequest
    >(`${BASE_PATH}/gate`, body);
    revalidatePath("/admin/app-version");
    return { ok: true, row: parseStringify(row) };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not save the version gate",
    };
  }
}

/**
 * Remove the gate entirely — the rollback lever. Every device 204s on its next
 * check and unblocks.
 */
export async function deleteAppVersionGate(
  appType: string,
  platform: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireOperatorPermission(PERM.APP_VERSION_MANAGE);
  try {
    await staffClient().delete<void>(
      `${BASE_PATH}/gate?appType=${encodeURIComponent(appType)}&platform=${encodeURIComponent(platform)}`,
    );
    revalidatePath("/admin/app-version");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not delete the version gate",
    };
  }
}
