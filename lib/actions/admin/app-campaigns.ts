"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOperatorPermission } from "@/lib/admin/operator-auth";
import { PERM } from "@/lib/admin/permissions";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  APP_ICON_OPTIONS,
  type AppCampaignRow,
  type UpsertAppCampaignRequest,
} from "@/types/admin/app-campaign";

const BASE_PATH = "/api/v1/admin/app-campaigns";
const ADMIN_PATH = "/admin/app-campaigns";

function staffClient() {
  return new ApiClient("auth", "staff");
}

const UpsertSchema = z
  .object({
    name: z.string().min(1).max(120),
    appType: z.string().min(1).max(50).default("POS"),
    platform: z.string().min(1).max(20).default("ANDROID"),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    priority: z.coerce.number().int().min(0).default(0),
    enabled: z.coerce.boolean().default(true),
    appIcon: z.enum(APP_ICON_OPTIONS).nullish(),
    message: z.string().max(280).nullish(),
    messageIcon: z.string().max(60).nullish(),
    cta: z.string().max(4000).nullish(),
    minAppVersionCode: z.coerce.number().int().positive().nullish(),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    path: ["endsAt"],
    message: "The end of the window must be after its start.",
  })
  .refine((v) => Boolean(v.appIcon) || Boolean(v.message), {
    path: ["message"],
    message:
      "A campaign that changes no icon and shows no message does nothing — set at least one.",
  })
  .refine(
    (v) => {
      if (v.cta == null || v.cta === "") return true;
      try {
        JSON.parse(v.cta);
        return true;
      } catch {
        return false;
      }
    },
    {
      path: ["cta"],
      message: "cta must be valid JSON (or left blank).",
    },
  );

export async function listAppCampaigns(): Promise<AppCampaignRow[]> {
  await requireOperatorPermission(PERM.APP_CAMPAIGN_MANAGE);
  const data = await staffClient().get<AppCampaignRow[]>(BASE_PATH);
  return parseStringify(data ?? []);
}

type UpsertResult =
  | { ok: true; row: AppCampaignRow }
  | { ok: false; message: string };

async function upsert(
  payload: unknown,
  send: (body: UpsertAppCampaignRequest) => Promise<AppCampaignRow>,
): Promise<UpsertResult> {
  const validated = UpsertSchema.safeParse(payload);
  if (!validated.success) {
    return {
      ok: false,
      message: validated.error.errors[0]?.message ?? "Check the values",
    };
  }

  const d = validated.data;
  const body: UpsertAppCampaignRequest = {
    name: d.name,
    appType: d.appType,
    platform: d.platform,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    priority: d.priority,
    enabled: d.enabled,
    appIcon: d.appIcon ?? null,
    message: d.message || null,
    messageIcon: d.messageIcon || null,
    cta: d.cta || null,
    minAppVersionCode: d.minAppVersionCode ?? null,
  };

  try {
    await requireOperatorPermission(PERM.APP_CAMPAIGN_MANAGE);
    const row = await send(body);
    revalidatePath(ADMIN_PATH);
    return { ok: true, row: parseStringify(row) };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export async function createAppCampaign(
  payload: unknown,
): Promise<UpsertResult> {
  return upsert(payload, (body) =>
    staffClient().post<AppCampaignRow, UpsertAppCampaignRequest>(
      BASE_PATH,
      body,
    ),
  );
}

export async function updateAppCampaign(
  id: string,
  payload: unknown,
): Promise<UpsertResult> {
  return upsert(payload, (body) =>
    staffClient().put<AppCampaignRow, UpsertAppCampaignRequest>(
      `${BASE_PATH}/${id}`,
      body,
    ),
  );
}

export async function deleteAppCampaign(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await requireOperatorPermission(PERM.APP_CAMPAIGN_MANAGE);
    await staffClient().delete<void>(`${BASE_PATH}/${id}`);
    revalidatePath(ADMIN_PATH);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Request failed",
    };
  }
}
