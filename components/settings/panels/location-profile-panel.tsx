"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Copy, Loader2 } from "lucide-react";
import {
  SettingsSection,
  SettingsSwitchRow,
} from "../shared/settings-section";
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

export function LocationProfilePanel({
  settings,
  onSaved,
  location,
  onLocationSaved,
}: Props) {
  const panel = useSettingsPanel(PROFILE_KEYS, settings, onSaved);

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
        title="Currency, locale & guard-rails"
        description="Base currency and limits that apply across POS, receipts, and reports."
        onSave={panel.save}
        isPending={panel.isPending}
        isDirty={panel.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LabeledField label="Currency">
            <CurrencySelector
              value={panel.values.currency ?? undefined}
              onChange={(val) => panel.setField("currency", val)}
              isDisabled={panel.isPending}
            />
          </LabeledField>
          <LabeledField label="Default language" hint="ISO code (e.g. en, sw).">
            <Input
              maxLength={10}
              value={panel.values.defaultLanguage ?? ""}
              onChange={(e) => panel.setField("defaultLanguage", e.target.value)}
              disabled={panel.isPending}
            />
          </LabeledField>
          <LabeledField label="Default timezone" hint="IANA TZ (e.g. Africa/Dar_es_Salaam).">
            <Input
              maxLength={64}
              value={panel.values.defaultTimezone ?? ""}
              onChange={(e) => panel.setField("defaultTimezone", e.target.value)}
              disabled={panel.isPending}
            />
          </LabeledField>
          <LabeledField label="Minimum order amount">
            <Input
              type="number"
              min={0}
              value={panel.values.minimumOrderAmount ?? ""}
              onChange={(e) =>
                panel.setField(
                  "minimumOrderAmount",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </LabeledField>
          <LabeledField
            label="Max discount (%)"
            hint="Hard ceiling — any attempt above this is blocked."
          >
            <Input
              type="number"
              min={0}
              max={100}
              value={panel.values.maxDiscountPercentage ?? ""}
              onChange={(e) =>
                panel.setField(
                  "maxDiscountPercentage",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </LabeledField>
          <LabeledField
            label="Discount approval (%)"
            hint="Above this %, the discount needs manager approval."
          >
            <Input
              type="number"
              min={0}
              max={100}
              value={panel.values.discountApprovalThreshold ?? ""}
              onChange={(e) =>
                panel.setField(
                  "discountApprovalThreshold",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </LabeledField>
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

function diffToPatch(
  baseline: LocationFormState,
  current: LocationFormState,
): UpdateLocationBasicsRequest {
  const patch: UpdateLocationBasicsRequest = {};
  const stringKeys: (keyof Omit<LocationFormState, "latitude" | "longitude">)[] =
    [
      "name",
      "description",
      "phoneNumber",
      "email",
      "countryId",
      "businessTypeId",
      "region",
      "district",
      "ward",
      "address",
      "postalCode",
      "timezone",
    ];
  for (const k of stringKeys) {
    if (current[k] !== baseline[k]) {
      const trimmed = current[k].trim();
      (patch as Record<string, unknown>)[k] = trimmed === "" ? null : trimmed;
    }
  }
  if (current.latitude !== baseline.latitude) {
    const parsed = current.latitude.trim() === "" ? null : Number(current.latitude);
    patch.latitude = parsed === null || Number.isFinite(parsed) ? parsed : null;
  }
  if (current.longitude !== baseline.longitude) {
    const parsed = current.longitude.trim() === "" ? null : Number(current.longitude);
    patch.longitude = parsed === null || Number.isFinite(parsed) ? parsed : null;
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

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Location"
        description="Name, contact info and address for this location."
        meta={
          location.identifier && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Location code:</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">
                {location.identifier}
              </code>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Copy location code"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )
        }
      />

      <SettingsSection onSave={save} isDirty={isDirty} isPending={isPending}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <LabeledField label="Location name" hint="Max 255 characters.">
          <Input
            maxLength={255}
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            disabled={isPending}
            placeholder="e.g. Pizza Inn Masaki"
          />
        </LabeledField>
        <LabeledField label="Phone number" hint="Max 20 characters.">
          <Input
            maxLength={20}
            value={form.phoneNumber}
            onChange={(e) => setField("phoneNumber", e.target.value)}
            disabled={isPending}
            placeholder="+255712345678"
          />
        </LabeledField>
        <LabeledField label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            disabled={isPending}
            placeholder="branch@business.com"
          />
        </LabeledField>
        <LabeledField label="Timezone" hint="IANA TZ (e.g. Africa/Dar_es_Salaam).">
          <Input
            value={form.timezone}
            onChange={(e) => setField("timezone", e.target.value)}
            disabled={isPending}
            placeholder="Africa/Dar_es_Salaam"
          />
        </LabeledField>
      </div>

      <div className="space-y-2 pt-2">
        <label className="text-xs font-medium text-gray-700">Description</label>
        <Textarea
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          disabled={isPending}
          placeholder="A short description of this location"
          className="min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <LabeledField label="Country">
          <CountrySelector
            value={form.countryId}
            onChange={(v: string) => setField("countryId", v)}
            isDisabled={isPending}
            label="Select country"
            placeholder="Select country"
          />
        </LabeledField>
        <LabeledField label="Business type">
          <BusinessTypeSelector
            value={form.businessTypeId}
            onChange={(v: string) => setField("businessTypeId", v)}
            onBlur={() => {}}
            isDisabled={isPending}
            label="Select business type"
            placeholder="Select business type"
          />
        </LabeledField>
        <LabeledField label="Region">
          <Input
            value={form.region}
            onChange={(e) => setField("region", e.target.value)}
            disabled={isPending}
            placeholder="e.g. Dar es Salaam"
          />
        </LabeledField>
        <LabeledField label="District">
          <Input
            value={form.district}
            onChange={(e) => setField("district", e.target.value)}
            disabled={isPending}
            placeholder="District"
          />
        </LabeledField>
        <LabeledField label="Ward">
          <Input
            value={form.ward}
            onChange={(e) => setField("ward", e.target.value)}
            disabled={isPending}
            placeholder="Ward"
          />
        </LabeledField>
        <LabeledField label="Street address">
          <Input
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            disabled={isPending}
            placeholder="Street address"
          />
        </LabeledField>
        <LabeledField label="Postal code" hint="Max 10 characters.">
          <Input
            maxLength={10}
            value={form.postalCode}
            onChange={(e) => setField("postalCode", e.target.value)}
            disabled={isPending}
            placeholder="Postal code"
          />
        </LabeledField>
        <LabeledField label="Latitude">
          <Input
            type="number"
            inputMode="decimal"
            value={form.latitude}
            onChange={(e) => setField("latitude", e.target.value)}
            disabled={isPending}
            placeholder="-6.776"
          />
        </LabeledField>
        <LabeledField label="Longitude">
          <Input
            type="number"
            inputMode="decimal"
            value={form.longitude}
            onChange={(e) => setField("longitude", e.target.value)}
            disabled={isPending}
            placeholder="39.278"
          />
        </LabeledField>
      </div>
      </SettingsSection>
    </div>
  );
}

function LabeledField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Ensure tree-shaken helper stays imported for future panels
void SettingsSwitchRow;
void Button;
void Loader2;
