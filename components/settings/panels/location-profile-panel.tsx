"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  Coins,
  Compass,
  Copy,
  Hash,
  Home,
  Languages,
  Mail,
  Map,
  MapPin,
  Navigation,
  Phone,
  Store,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import {
  ControlInput,
  ControlTextarea,
  StandaloneField as Field,
} from "@/components/ui/field";
import { SettingsSection } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import { DangerZonePanel } from "./danger-zone-panel";
import type { LocationSettings } from "@/types/location-settings/type";
import type { Location } from "@/types/location/type";
import {
  updateLocationBasics,
  type UpdateLocationBasicsRequest,
} from "@/lib/actions/location-actions";
import BusinessTypeSelector from "@/components/widgets/business-type-selector";
import CountrySelector from "@/components/widgets/country-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import TimezoneSelector from "@/components/widgets/timezone-selector";

const PROFILE_KEYS = [
  "currency",
  "minimumOrderAmount",
  "maxDiscountPercentage",
  "discountApprovalThreshold",
  "defaultLanguage",
  "defaultTimezone",
] as const;

interface Props {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
  location: Location | null;
  onLocationSaved: (next: Location) => void;
}

const ICON = "h-3.5 w-3.5";

/** "" → null, otherwise a finite number — for the optional numeric guard-rails. */
function numberOrNull(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function LocationProfilePanel({
  settings,
  onSaved,
  location,
  onLocationSaved,
}: Props) {
  const panel = useSettingsPanel(PROFILE_KEYS, settings, onSaved);
  const d = panel.isPending;
  const currencyCode = panel.values.currency ?? settings.currency ?? "";

  return (
    <div className="space-y-6">
      {location ? (
        <LocationDetailsCard
          location={location}
          onLocationSaved={onLocationSaved}
        />
      ) : (
        <PanelHeader
          title="Location"
          description="Name, contact info and address for this location."
        />
      )}

      <SettingsSection
        icon={<Coins className="h-4 w-4" />}
        title="Currency, locale & guard-rails"
        description="Base currency and limits that apply across POS, receipts, and reports."
        onSave={panel.save}
        isPending={panel.isPending}
        isDirty={panel.isDirty}
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Currency">
            {() => (
              <CurrencySelector
                value={panel.values.currency ?? undefined}
                onChange={(val) => panel.setField("currency", val)}
                isDisabled={d}
              />
            )}
          </Field>
          <Field label="Default language" hint="ISO code, e.g. en or sw.">
            {(id) => (
              <ControlInput
                id={id}
                mono
                maxLength={10}
                prefix={<Languages className={ICON} />}
                value={panel.values.defaultLanguage ?? ""}
                onChange={(e) => panel.setField("defaultLanguage", e.target.value)}
                placeholder="en"
                disabled={d}
              />
            )}
          </Field>
          <Field label="Default timezone" hint="Drives business-day rollover and report timestamps.">
            {() => (
              <TimezoneSelector
                value={panel.values.defaultTimezone ?? ""}
                onChange={(v) => panel.setField("defaultTimezone", v)}
                isDisabled={d}
              />
            )}
          </Field>
          <Field label="Minimum order amount" hint="Orders below this can't be placed.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                suffix={currencyCode || undefined}
                value={panel.values.minimumOrderAmount ?? ""}
                onChange={(e) =>
                  panel.setField("minimumOrderAmount", numberOrNull(e.target.value))
                }
                placeholder="0"
                disabled={d}
              />
            )}
          </Field>
          <Field
            label="Max discount"
            hint="Hard ceiling — any attempt above this is blocked."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                max={100}
                suffix="%"
                value={panel.values.maxDiscountPercentage ?? ""}
                onChange={(e) =>
                  panel.setField("maxDiscountPercentage", numberOrNull(e.target.value))
                }
                placeholder="100"
                disabled={d}
              />
            )}
          </Field>
          <Field
            label="Discount approval threshold"
            hint="Above this, the discount needs manager approval."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                max={100}
                suffix="%"
                value={panel.values.discountApprovalThreshold ?? ""}
                onChange={(e) =>
                  panel.setField("discountApprovalThreshold", numberOrNull(e.target.value))
                }
                placeholder="0"
                disabled={d}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <DangerZonePanel onReset={onSaved} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Location details (Location entity — PUT /api/v1/locations/{id})
// ──────────────────────────────────────────────────────────────────────

type LocationFormState = {
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  countryId: string;
  businessTypeId: string;
  region: string;
  district: string;
  ward: string;
  address: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  timezone: string;
};

function toForm(l: Location): LocationFormState {
  return {
    name: l.name ?? "",
    description: l.description ?? "",
    phoneNumber: l.phoneNumber ?? "",
    email: l.email ?? "",
    countryId: l.countryId ?? "",
    businessTypeId: l.businessTypeId ?? "",
    region: l.region ?? "",
    district: l.district ?? "",
    ward: l.ward ?? "",
    address: l.address ?? "",
    postalCode: l.postalCode ?? "",
    latitude: l.latitude != null ? String(l.latitude) : "",
    longitude: l.longitude != null ? String(l.longitude) : "",
    timezone: l.timezone ?? "",
  };
}

/**
 * Free-text fields the user may clear. The endpoint has PATCH semantics
 * (null = unchanged), so a cleared value has to travel as "" — which the
 * service stores as null. Identifiers and the name are required, so a
 * blank there is simply not sent.
 */
const CLEARABLE_KEYS = [
  "description",
  "phoneNumber",
  "email",
  "region",
  "district",
  "ward",
  "address",
  "postalCode",
] as const;

const REQUIRED_KEYS = ["name", "countryId", "businessTypeId", "timezone"] as const;

function diffToPatch(
  baseline: LocationFormState,
  current: LocationFormState,
): UpdateLocationBasicsRequest {
  const patch: UpdateLocationBasicsRequest = {};
  for (const k of CLEARABLE_KEYS) {
    if (current[k] !== baseline[k]) patch[k] = current[k].trim();
  }
  for (const k of REQUIRED_KEYS) {
    const trimmed = current[k].trim();
    if (current[k] !== baseline[k] && trimmed !== "") patch[k] = trimmed;
  }
  if (current.latitude !== baseline.latitude) {
    patch.latitude = numberOrNull(current.latitude);
  }
  if (current.longitude !== baseline.longitude) {
    patch.longitude = numberOrNull(current.longitude);
  }
  return patch;
}

function LocationDetailsCard({
  location,
  onLocationSaved,
}: {
  location: Location;
  onLocationSaved: (next: Location) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const initial = useMemo(() => toForm(location), [location]);
  const [form, setForm] = useState<LocationFormState>(initial);
  const [baseline, setBaseline] = useState<LocationFormState>(initial);

  // If the parent swaps in a fresh location (e.g. after a switch), reseed.
  useEffect(() => {
    setForm(initial);
    setBaseline(initial);
  }, [initial]);

  const patch = useMemo(() => diffToPatch(baseline, form), [baseline, form]);
  const isDirty = Object.keys(patch).length > 0;

  const setField = <K extends keyof LocationFormState>(
    key: K,
    value: LocationFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCopy = () => {
    if (!location.identifier) return;
    navigator.clipboard.writeText(location.identifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = () => {
    if (!isDirty) return;
    startTransition(async () => {
      const res = await updateLocationBasics(location.id, patch);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save location",
          description: res.message,
        });
        return;
      }
      toast({ title: "Saved", description: res.message });
      onLocationSaved(res.data);
      setBaseline(toForm(res.data));
      setForm(toForm(res.data));
    });
  };

  const d = isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Location"
        description="Name, contact info and address for this location."
        meta={
          location.identifier && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Location code:</span>
              <code className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-xs text-ink">
                {location.identifier}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Copy location code"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-pos" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )
        }
      />

      <SettingsSection
        icon={<Store className="h-4 w-4" />}
        title="Location profile"
        description="How this branch is named and reached."
        onSave={save}
        isDirty={isDirty}
        isPending={isPending}
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Location name" required className="sm:col-span-2">
            {(id) => (
              <ControlInput
                id={id}
                maxLength={255}
                prefix={<Store className={ICON} />}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                disabled={d}
                placeholder="e.g. Pizza Inn Masaki"
                autoComplete="organization"
              />
            )}
          </Field>
          <Field label="Phone number">
            {(id) => (
              <ControlInput
                id={id}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={20}
                prefix={<Phone className={ICON} />}
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                disabled={d}
                placeholder="+255 712 345 678"
              />
            )}
          </Field>
          <Field label="Email">
            {(id) => (
              <ControlInput
                id={id}
                type="email"
                inputMode="email"
                autoComplete="email"
                prefix={<Mail className={ICON} />}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                disabled={d}
                placeholder="branch@business.com"
              />
            )}
          </Field>

          <Field label="Business type" required>
            {() => (
              <BusinessTypeSelector
                value={form.businessTypeId}
                onChange={(v: string) => setField("businessTypeId", v)}
                onBlur={() => {}}
                isDisabled={d}
                label="Select business type"
                placeholder="Select business type"
              />
            )}
          </Field>
          <Field label="Country" required>
            {() => (
              <CountrySelector
                value={form.countryId}
                onChange={(v: string) => setField("countryId", v)}
                isDisabled={d}
                label="Select country"
                placeholder="Select country"
              />
            )}
          </Field>
          <Field label="Timezone" className="sm:col-span-2">
            {() => (
              <TimezoneSelector
                value={form.timezone}
                onChange={(v) => setField("timezone", v)}
                isDisabled={d}
              />
            )}
          </Field>
        </div>

        <div className="space-y-3.5 border-t border-dashed border-line pt-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              Address
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Region">
              {(id) => (
                <ControlInput
                  id={id}
                  prefix={<MapPin className={ICON} />}
                  value={form.region}
                  onChange={(e) => setField("region", e.target.value)}
                  disabled={d}
                  placeholder="e.g. Dar es Salaam"
                  autoComplete="address-level1"
                />
              )}
            </Field>
            <Field label="District">
              {(id) => (
                <ControlInput
                  id={id}
                  prefix={<Map className={ICON} />}
                  value={form.district}
                  onChange={(e) => setField("district", e.target.value)}
                  disabled={d}
                  placeholder="e.g. Kinondoni"
                  autoComplete="address-level2"
                />
              )}
            </Field>
            <Field label="Ward">
              {(id) => (
                <ControlInput
                  id={id}
                  prefix={<Compass className={ICON} />}
                  value={form.ward}
                  onChange={(e) => setField("ward", e.target.value)}
                  disabled={d}
                  placeholder="e.g. Masaki"
                  autoComplete="address-level3"
                />
              )}
            </Field>
            <Field label="Postal code">
              {(id) => (
                <ControlInput
                  id={id}
                  mono
                  maxLength={10}
                  prefix={<Hash className={ICON} />}
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  disabled={d}
                  placeholder="e.g. 14111"
                  autoComplete="postal-code"
                />
              )}
            </Field>
            <Field label="Street address" className="sm:col-span-2">
              {(id) => (
                <ControlInput
                  id={id}
                  prefix={<Home className={ICON} />}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  disabled={d}
                  placeholder="Street, building, floor"
                  autoComplete="street-address"
                />
              )}
            </Field>
            <Field label="Latitude" hint="Decimal degrees, e.g. -6.776">
              {(id) => (
                <ControlInput
                  id={id}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  mono
                  prefix={<Navigation className={ICON} />}
                  value={form.latitude}
                  onChange={(e) => setField("latitude", e.target.value)}
                  disabled={d}
                  placeholder="-6.776"
                />
              )}
            </Field>
            <Field label="Longitude" hint="Decimal degrees, e.g. 39.278">
              {(id) => (
                <ControlInput
                  id={id}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  mono
                  prefix={<Navigation className={ICON} />}
                  value={form.longitude}
                  onChange={(e) => setField("longitude", e.target.value)}
                  disabled={d}
                  placeholder="39.278"
                />
              )}
            </Field>
          </div>
        </div>

        <Field label="Description" optional>
          {(id) => (
            <ControlTextarea
              id={id}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              disabled={d}
              placeholder="A short description of this location"
              rows={3}
            />
          )}
        </Field>
      </SettingsSection>
    </div>
  );
}
