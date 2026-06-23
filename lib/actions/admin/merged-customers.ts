"use server";

import { reportsInternalGet } from "@/lib/reports-internal-client";
import type {
  ListMergedCustomersParams,
  MergedCustomerPage,
  MergedCustomerRow,
} from "@/types/admin/account";

// The Reports endpoint returns ClickHouse column aliases (snake_case) inside
// the paginated envelope; we map to the camelCase FE shape here.
interface RawMergedRow {
  merge_key: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  business_count: number | string | null;
  business_ids: string[] | null;
  record_count: number | string | null;
  last_seen: string | null;
}

interface RawMergedPage {
  content: RawMergedRow[] | null;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Global, de-duplicated customers list (merged by phone/email) for the admin
 * dashboard. Proxies the Reports Service internal endpoint via the
 * X-Internal-Secret helper.
 */
export async function listMergedCustomers(
  params: ListMergedCustomersParams = {},
): Promise<MergedCustomerPage> {
  const raw = await reportsInternalGet<RawMergedPage>(
    "/api/v2/internal/customers/merged",
    {
      search: params.search,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  );

  return {
    content: (raw.content ?? []).map(
      (r): MergedCustomerRow => ({
        mergeKey: r.merge_key,
        name: r.name,
        phone: r.phone,
        email: r.email,
        businessCount: Number(r.business_count ?? 0),
        recordCount: Number(r.record_count ?? 0),
        lastSeen: r.last_seen,
      }),
    ),
    page: raw.page ?? 0,
    size: raw.size ?? 20,
    totalElements: raw.totalElements ?? 0,
    totalPages: raw.totalPages ?? 0,
  };
}
