"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getLocationVfdRegistration } from "@/lib/actions/location-vfd-actions";
import type { VfdAvailability, VfdZReportDay } from "@/types/reports/z-report";

/** East African Time — the clock TRA fiscal days are struck on. */
const EAT_OFFSET = "+03:00";

export interface VfdZReportResult {
  availability: VfdAvailability;
  /** One row per fiscal day DIRM has a Z for, ascending by zrDate. */
  days: VfdZReportDay[];
  /** Populated only when `availability === "error"`. */
  error: string | null;
}

/**
 * The location's TRA fiscal Z-reports for a date range.
 *
 * <p>Two hops on purpose. The registration mirror is checked first
 * (Accounts, cheap, cached upstream) because the Accounting endpoint
 * authenticates against DIRM per call and 404s a location that was never
 * onboarded — the normal state for most locations. Distinguishing "no
 * fiscal device here" from "the lookup broke" is what lets the page say
 * which of the two happened instead of showing an empty table either way.
 *
 * <p>Never throws: every failure resolves to an `availability` the caller
 * renders as a banner, so a DIRM outage degrades the VFD column rather than
 * taking the whole Z-report page down with it.
 *
 * @param from inclusive start, yyyy-MM-dd
 * @param to   inclusive end, yyyy-MM-dd
 */
export async function getVfdZReports(
  locationId: string,
  from: string,
  to: string,
): Promise<VfdZReportResult> {
  const registration = await getLocationVfdRegistration(locationId);

  if ("error" in registration) {
    return { availability: "error", days: [], error: registration.error };
  }
  if (!registration.data) {
    return { availability: "not-registered", days: [], error: null };
  }
  if (registration.data.verified !== true) {
    return { availability: "not-verified", days: [], error: null };
  }

  try {
    const apiClient = new ApiClient("accounting");
    // The endpoint takes OffsetDateTime and converts to an EAT LocalDate
    // itself, so stamping the boundaries in EAT is what makes `from`/`to`
    // land on exactly the fiscal days the operator picked — a UTC midnight
    // would shift the start day back by three hours.
    const data = await apiClient.post<
      VfdZReportDay[] | null,
      { startDate: string; endDate: string }
    >(`/api/vfd/${locationId}/z-report`, {
      startDate: `${from}T00:00:00${EAT_OFFSET}`,
      endDate: `${to}T23:59:59${EAT_OFFSET}`,
    });

    const days = (parseStringify(data ?? []) as VfdZReportDay[])
      .filter((d) => !!d?.zrDate)
      .sort((a, b) => a.zrDate.localeCompare(b.zrDate));

    return { availability: "available", days, error: null };
  } catch (error: unknown) {
    console.error("[vfd] z-report lookup failed:", error);
    return {
      availability: "error",
      days: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load the VFD Z-report",
    };
  }
}
