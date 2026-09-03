"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

/**
 * Searchable IANA timezone picker. The zone list comes from the browser's
 * ICU data (`Intl.supportedValuesOf`), loaded after mount so the server and
 * client never disagree on the option set; until then the control still
 * renders the current value. African zones are listed first — most tenants
 * live there — then the remaining regions alphabetically.
 */

const FALLBACK_ZONES = [
  "Africa/Dar_es_Salaam",
  "Africa/Nairobi",
  "Africa/Kampala",
  "Africa/Kigali",
  "Africa/Lusaka",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Cairo",
  "Europe/London",
  "Asia/Dubai",
  "UTC",
];

const REGION_ORDER = ["Africa", "Europe", "Asia", "America", "Indian", "Australia", "Pacific", "Atlantic", "Antarctica"];

function listTimezones(): string[] {
  try {
    const intl = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    const zones = intl.supportedValuesOf?.("timeZone");
    if (zones && zones.length > 0) return zones;
  } catch {
    // Older engines — fall through to the curated list.
  }
  return FALLBACK_ZONES;
}

function utcOffset(zone: string, at: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "shortOffset",
    } as unknown as Intl.DateTimeFormatOptions).formatToParts(at);
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return name === "GMT" ? "UTC±0" : name.replace("GMT", "UTC");
  } catch {
    return "";
  }
}

function regionRank(zone: string): number {
  const region = zone.split("/")[0] ?? zone;
  const idx = REGION_ORDER.indexOf(region);
  return idx === -1 ? REGION_ORDER.length : idx;
}

export default function TimezoneSelector({
  value,
  onChange,
  isDisabled,
  placeholder = "Select timezone",
  className,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    setZones(listTimezones());
  }, []);

  const options = useMemo<ComboboxOption[]>(() => {
    const now = new Date();
    const all = new Set(zones);
    if (value) all.add(value);
    return Array.from(all)
      .sort((a, b) => regionRank(a) - regionRank(b) || a.localeCompare(b))
      .map((zone) => {
        const [region, ...rest] = zone.split("/");
        const city = rest.join("/").replace(/_/g, " ");
        return {
          value: zone,
          label: city ? `${city}` : zone,
          description: zones.length ? `${zone} · ${utcOffset(zone, now)}` : zone,
          keywords: [zone, region, zone.replace(/_/g, " ")],
          group: rest.length ? region : "Other",
        };
      });
  }, [zones, value]);

  return (
    <Combobox
      options={options}
      value={value || null}
      onChange={(v) => onChange(v ?? "")}
      placeholder={placeholder}
      searchPlaceholder="Search city or region…"
      emptyText="No timezone matches."
      disabled={isDisabled}
      icon={<Clock className="h-3.5 w-3.5" />}
      className={className}
      contentClassName="w-[320px]"
      ariaLabel="Timezone"
    />
  );
}
