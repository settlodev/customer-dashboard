"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/tables/data-table";
import { buildLocationColumns } from "@/components/admin/locations/columns";
import type { PlatformLocationsPage } from "@/types/admin/platform-metrics";

/**
 * Locations & subscriptions list. Server-paginated + URL-synced status filter
 * (`manualFilter`) and free-text search — the table pushes `?page`/`?limit`/
 * `?search`/`?status` and the page re-queries the Reports Service.
 */

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Trial", value: "TRIAL" },
  { label: "Past due", value: "PAST_DUE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function LocationsSubscriptionsView({
  page,
}: {
  page: PlatformLocationsPage;
}) {
  const columns = useMemo(() => buildLocationColumns(), []);
  return (
    <DataTable
      columns={columns}
      data={page.content}
      searchKey="locationName"
      pageNo={page.page}
      total={page.totalElements}
      pageCount={Math.max(1, page.totalPages)}
      filterKey="status"
      filterOptions={STATUS_OPTIONS}
      manualFilter
      searchPlaceholder="Search locations…"
      disableArchive
    />
  );
}
