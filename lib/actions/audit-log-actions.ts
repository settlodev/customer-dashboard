"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type { AuditLogPage } from "@/types/audit-log/type";

const EMPTY: AuditLogPage = {
  content: [],
  number: 0,
  size: 50,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

export async function getAuditLogByEntity(
  entityType: string,
  entityId: string,
  page = 0,
  size = 50,
): Promise<AuditLogPage> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/audit-log/entities/${encodeURIComponent(entityType)}/${entityId}?page=${page}&size=${size}`,
      ),
    );
    return parseStringify(data) as AuditLogPage;
  } catch {
    return EMPTY;
  }
}

export async function getAuditLogByLocation(
  page = 0,
  size = 50,
  from?: string,
  to?: string,
): Promise<AuditLogPage> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/audit-log?${params.toString()}`),
    );
    return parseStringify(data) as AuditLogPage;
  } catch {
    return EMPTY;
  }
}
