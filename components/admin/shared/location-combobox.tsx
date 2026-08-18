"use client";

import * as React from "react";
import { MapPin } from "lucide-react";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import type { PlatformLocationRow } from "@/types/admin/platform-metrics";

/**
 * Reusable, searchable location picker for the admin screens. Renders each
 * location as a two-line row — a human label on top and the raw UUID as
 * mono fine print beneath — and matches the typed query against the
 * business name, location name, *and* the UUID, so an operator can paste an
 * id straight from a log line or pick by name.
 *
 * Display label is "Business — Location" when the two names differ, and just
 * the single name when they're the same (a one-location business often names
 * the location after itself).
 *
 * Backed by the same {@link PlatformLocationRow} list the platform-metrics
 * picker uses, so it drops into any admin list that already loads it
 * (activity log, stuck writes, …).
 */

/** Sentinel value for the leading "All locations" row (maps to `null`). */
const ALL_VALUE = "__all_locations__";

/** "Business — Location" when the names differ, else the single name. */
export function locationDisplayLabel(
  loc: Pick<PlatformLocationRow, "locationName" | "businessName">,
): string {
  const name = (loc.locationName ?? "").trim() || "Unnamed location";
  const business = (loc.businessName ?? "").trim();
  if (business && business.toLowerCase() !== name.toLowerCase()) {
    return `${business} — ${name}`;
  }
  return name;
}

interface LocationComboboxProps {
  locations: PlatformLocationRow[];
  /** Selected locationId, or null for the "all"/cleared state. */
  value: string | null;
  onChange: (locationId: string | null) => void;
  /**
   * Label for the leading "no filter" row. Pass `null` to omit it when a
   * concrete pick is required (e.g. a form field rather than a list filter).
   */
  allLabel?: string | null;
  placeholder?: string;
  /** Width / extra classes for the trigger. */
  className?: string;
  disabled?: boolean;
}

export function LocationCombobox({
  locations,
  value,
  onChange,
  allLabel = "All locations",
  placeholder = "All locations",
  className,
  disabled,
}: LocationComboboxProps) {
  const options = React.useMemo<ComboboxOption[]>(() => {
    const out: ComboboxOption[] = [];
    if (allLabel) out.push({ value: ALL_VALUE, label: allLabel });

    const sorted = [...locations]
      .filter((l) => l.locationId)
      .sort((a, b) =>
        locationDisplayLabel(a).localeCompare(locationDisplayLabel(b)),
      );

    for (const loc of sorted) {
      out.push({
        value: loc.locationId,
        label: locationDisplayLabel(loc),
        description: loc.locationId,
        keywords: [
          loc.locationId,
          loc.locationName ?? "",
          loc.businessName ?? "",
          loc.region ?? "",
        ],
      });
    }

    // Value set but outside the loaded page → keep the trigger honest with a
    // stub row rather than silently falling back to the placeholder.
    if (value && !out.some((o) => o.value === value)) {
      out.push({ value, label: value, description: value });
    }
    return out;
  }, [locations, value, allLabel]);

  return (
    <Combobox
      options={options}
      value={value ?? (allLabel ? ALL_VALUE : null)}
      onChange={(next) => onChange(next && next !== ALL_VALUE ? next : null)}
      placeholder={placeholder}
      searchPlaceholder="Search name or ID…"
      emptyText="No locations match."
      icon={<MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />}
      className={className}
      contentClassName="w-[340px]"
      disabled={disabled}
      ariaLabel="Filter by location"
    />
  );
}
