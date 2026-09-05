"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  AdminVfdRegistrationPage,
  ListVfdRegistrationsParams,
  VfdRegistrationStatusCounts,
} from "@/types/admin/vfd-registration";

function staffClient() {
  return new ApiClient("accounts", "staff");
}

function buildQuery(params: ListVfdRegistrationsParams): string {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  qs.set("page", String(Math.max(0, params.page ?? 0)));
  qs.set("size", String(params.size ?? 20));
  return qs.toString();
}

export async function listVfdRegistrations(
  params: ListVfdRegistrationsParams = {},
): Promise<AdminVfdRegistrationPage> {
  const data = await staffClient().get<AdminVfdRegistrationPage>(
    `/api/v1/admin/vfd-registrations?${buildQuery(params)}`,
  );
  return parseStringify(data);
}

/**
 * All/Pending/Active counts for the list's status tabs. There's no
 * dedicated counts endpoint, so we read `totalElements` off two size=1
 * queries (all + pending) and derive active — the only other status DIRM
 * returns.
 */
export async function getVfdRegistrationStatusCounts(): Promise<VfdRegistrationStatusCounts> {
  const [all, pendingOnly] = await Promise.all([
    listVfdRegistrations({ page: 0, size: 1 }),
    listVfdRegistrations({ status: "Pending", page: 0, size: 1 }),
  ]);
  const total = all.totalElements ?? 0;
  const pending = pendingOnly.totalElements ?? 0;
  return { total, pending, active: Math.max(0, total - pending) };
}
