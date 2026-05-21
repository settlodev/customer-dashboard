"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  AdminBusinessDetail,
  AdminBusinessPage,
  AdminLocationDetail,
  AdminLocationListItem,
  ListBusinessesParams,
} from "@/types/admin/business";

function staffClient() {
  return new ApiClient("accounts", "staff");
}

function buildQuery(params: ListBusinessesParams): string {
  const qs = new URLSearchParams();
  if (params.accountId) qs.set("accountId", params.accountId);
  if (params.search) qs.set("search", params.search);
  if (typeof params.active === "boolean") qs.set("active", String(params.active));
  qs.set("page", String(Math.max(0, params.page ?? 0)));
  qs.set("size", String(params.size ?? 20));
  return qs.toString();
}

export async function listAdminBusinesses(
  params: ListBusinessesParams = {},
): Promise<AdminBusinessPage> {
  const data = await staffClient().get<AdminBusinessPage>(
    `/api/v1/admin/businesses?${buildQuery(params)}`,
  );
  return parseStringify(data);
}

export async function listAccountBusinesses(
  accountId: string,
  page = 0,
  size = 20,
): Promise<AdminBusinessPage> {
  const qs = new URLSearchParams();
  qs.set("page", String(Math.max(0, page)));
  qs.set("size", String(size));
  const data = await staffClient().get<AdminBusinessPage>(
    `/api/v1/admin/accounts/${accountId}/businesses?${qs.toString()}`,
  );
  return parseStringify(data);
}

export async function getAdminBusinessDetail(
  businessId: string,
): Promise<AdminBusinessDetail> {
  const data = await staffClient().get<AdminBusinessDetail>(
    `/api/v1/admin/businesses/${businessId}`,
  );
  return parseStringify(data);
}

export async function listAdminBusinessLocations(
  businessId: string,
): Promise<AdminLocationListItem[]> {
  const data = await staffClient().get<AdminLocationListItem[]>(
    `/api/v1/admin/businesses/${businessId}/locations`,
  );
  return parseStringify(data);
}

export async function getAdminLocationDetail(
  locationId: string,
): Promise<AdminLocationDetail> {
  const data = await staffClient().get<AdminLocationDetail>(
    `/api/v1/admin/locations/${locationId}`,
  );
  return parseStringify(data);
}
