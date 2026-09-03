"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  BadgeCheck,
  Bell,
  Building,
  CalendarDays,
  ClipboardCheck,
  Facebook,
  FileBadge,
  Hash,
  Instagram,
  Landmark,
  Linkedin,
  Loader2Icon,
  Mail,
  MessageCircle,
  Music2,
  Percent,
  Phone,
  ScrollText,
  Share2,
  Twitter,
  Youtube,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/ui/loading";
import {
  ControlInput,
  ControlTextarea,
  FieldHint,
  SegmentedRadio,
  StandaloneField as Field,
  ToggleRow,
  standaloneLabelClass,
} from "@/components/ui/field";
import { SectionCard } from "@/components/settings/shared/section-card";
import { PanelHeader } from "@/components/settings/shared/panel-header";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  updateBusinessSettings,
  type UpdateBusinessSettingsRequest,
} from "@/lib/actions/business-settings-actions";
import type {
  Business,
  BusinessSettings,
  VatRegistrationMode,
} from "@/types/business/type";
import CurrencySelector from "@/components/widgets/currency-selector";
import { invalidateVatRegistrationStatusCache } from "@/hooks/use-vat-registration-status";

// AUTO derives registration from `vatRegistrationNumber` presence; the other
// two are an explicit merchant override in either direction. Mirrors the
// Accounts Service's `VatRegistrationMode` enum (see types/business/type.ts).
const VAT_REGISTRATION_MODE_OPTIONS: { value: VatRegistrationMode; label: string }[] = [
  { value: "AUTO", label: "Automatic" },
  { value: "REGISTERED", label: "VAT registered" },
  { value: "NOT_REGISTERED", label: "Not registered" },
];

const CURRENT_YEAR = new Date().getFullYear();

// ──────────────────────────────────────────────────────────────────────
// Field primitives (no react-hook-form here — plain controlled inputs)
// ──────────────────────────────────────────────────────────────────────

function TextField({
  label,
  value,
  onChange,
  icon,
  placeholder,
  disabled,
  type = "text",
  inputMode,
  autoComplete,
  hint,
  mono,
  className,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  disabled: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  hint?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <ControlInput
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          prefix={icon}
          mono={mono}
        />
      )}
    </Field>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Main panel
// ──────────────────────────────────────────────────────────────────────

const BusinessSettingsPanel = ({
  business,
  settings,
  isLoading,
  onSaved,
}: {
  business: Business | null;
  settings: BusinessSettings | null;
  isLoading: boolean;
  onSaved: (next: BusinessSettings) => void;
}) => {
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState<UpdateBusinessSettingsRequest>({});

  // Displayed values = persisted settings merged with uncommitted edits.
  const displayed = useMemo<BusinessSettings | null>(
    () => (settings ? ({ ...settings, ...dirty } as BusinessSettings) : null),
    [settings, dirty],
  );

  function setField<K extends keyof UpdateBusinessSettingsRequest>(
    key: K,
    value: UpdateBusinessSettingsRequest[K],
  ) {
    setDirty((prev) => ({ ...prev, [key]: value }));
  }

  // Text fields send the raw string: the endpoint has PATCH semantics where
  // null means "unchanged", so an emptied input has to travel as "" (which
  // the service stores as null). Coercing "" → null here would silently
  // fail to clear an already-set value.
  const setText = (key: TextKey) => (v: string) => setField(key, v);

  const dirtyCount = useMemo(() => Object.keys(dirty).length, [dirty]);

  const handleSave = () => {
    if (!business?.id || dirtyCount === 0) return;
    startTransition(async () => {
      const result = await updateBusinessSettings(business.id, dirty);
      if (result.responseType === "success") {
        toast({ title: "Settings updated", description: result.message });
        onSaved(result.data);
        setDirty({});
        // This save may have changed vatRegistrationMode or
        // vatRegistrationNumber — invalidate so the next purchase form to
        // mount re-fetches instead of reusing a stale registration status.
        invalidateVatRegistrationStatusCache();
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't save settings",
          description: result.message,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PanelHeader
          title="Business Settings"
          description="Loading business settings…"
        />
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="flex items-center justify-center p-6">
            <Loading />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!displayed) {
    return (
      <div className="space-y-6">
        <PanelHeader
          title="Business Settings"
          description="No settings found for this business."
        />
      </div>
    );
  }

  const s = displayed;
  const d = isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Business Settings"
        description={
          <>
            Parent-company defaults shared across every location for{" "}
            <span className="font-medium text-foreground">
              {business?.name ?? "this business"}
            </span>
            .
          </>
        }
      />

      {/* 1 — Legal, fiscal & tax identifiers */}
      <SectionCard
        icon={<Landmark className="h-4 w-4" />}
        title="Legal & tax registration"
        description="Registration numbers and tax identifiers for the legal entity. Fiscal-device (VFD/EFD) registration lives under VFD / EFD registration."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            label="Business license number"
            value={s.businessLicenseNumber ?? ""}
            onChange={setText("businessLicenseNumber")}
            icon={<FileBadge className="h-3.5 w-3.5" />}
            placeholder="License number"
            mono
            disabled={d}
          />
          <TextField
            label="Company registration number"
            value={s.companyRegistrationNumber ?? ""}
            onChange={setText("companyRegistrationNumber")}
            icon={<Building className="h-3.5 w-3.5" />}
            placeholder="Registration number"
            mono
            disabled={d}
          />
          <TextField
            label="Tax identification number (TIN)"
            value={s.taxIdentificationNumber ?? ""}
            onChange={setText("taxIdentificationNumber")}
            icon={<Hash className="h-3.5 w-3.5" />}
            placeholder="e.g. 123-456-789"
            mono
            disabled={d}
          />
          <Field label="Established year">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1800}
                max={CURRENT_YEAR}
                prefix={<CalendarDays className="h-3.5 w-3.5" />}
                value={s.establishedYear != null ? String(s.establishedYear) : ""}
                onChange={(e) => {
                  const trimmed = e.target.value.trim();
                  if (trimmed === "") {
                    setField("establishedYear", null);
                    return;
                  }
                  const parsed = Number.parseInt(trimmed, 10);
                  if (Number.isFinite(parsed)) setField("establishedYear", parsed);
                }}
                placeholder={`e.g. ${CURRENT_YEAR - 5}`}
                disabled={d}
              />
            )}
          </Field>

          {/* Tax registration identifiers — always visible. VAT registration
              governs purchase-tax reclaim, which has nothing to do with
              fiscal-device registration; these were once gated behind the
              Virtual EFD toggle, which made purchase tax permanently
              unreachable for any merchant who never turned EFD on. */}
          <TextField
            label="VAT registration number (VRN)"
            value={s.vatRegistrationNumber ?? ""}
            onChange={setText("vatRegistrationNumber")}
            icon={<Percent className="h-3.5 w-3.5" />}
            placeholder="VRN"
            mono
            disabled={d}
            className="lg:col-span-2"
          />
          <TextField
            label="Unique identification number (UIN)"
            value={s.uniqueIdentificationNumber ?? ""}
            onChange={setText("uniqueIdentificationNumber")}
            icon={<BadgeCheck className="h-3.5 w-3.5" />}
            placeholder="UIN"
            mono
            disabled={d}
            className="lg:col-span-2"
          />
        </div>

        {/* VAT registration status — decides whether tax on purchases is
            reclaimable (recorded separately) or costed (folded into stock
            cost). AUTO derives from the VRN above; the other two options
            let a merchant override that inference explicitly. */}
        <div className="space-y-[7px]">
          <span className={standaloneLabelClass}>VAT registration status</span>
          <SegmentedRadio
            value={s.vatRegistrationMode ?? "AUTO"}
            onChange={(v) => setField("vatRegistrationMode", v as VatRegistrationMode)}
            options={VAT_REGISTRATION_MODE_OPTIONS}
            disabled={d}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <FieldHint>
              Automatic follows the VRN above — set a VRN and you count as
              registered.
            </FieldHint>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                s.effectivelyVatRegistered
                  ? "border-pos/30 bg-pos-tint text-pos"
                  : "border-line bg-canvas text-ink-2",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  s.effectivelyVatRegistered ? "bg-pos" : "bg-muted-2",
                )}
              />
              {s.effectivelyVatRegistered
                ? "Purchase tax is recorded separately and reclaimable"
                : "Purchase tax is included in stock cost"}
            </span>
          </div>
        </div>

        {/* Virtual EFD lives on Settings → VFD / EFD registration, next to
            the TRA registration it actually reflects. Keeping the toggle
            here let a business read "disabled" while one of its locations
            was registered and fiscalising. */}
      </SectionCard>

      {/* 2 — Social media */}
      <SectionCard
        icon={<Share2 className="h-4 w-4" />}
        title="Social media"
        description="Parent-company social profiles and contact channels."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            label="Facebook"
            value={s.facebookUrl ?? ""}
            onChange={setText("facebookUrl")}
            icon={<Facebook className="h-3.5 w-3.5" />}
            placeholder="https://facebook.com/…"
            type="url"
            inputMode="url"
            disabled={d}
          />
          <TextField
            label="Instagram"
            value={s.instagramUrl ?? ""}
            onChange={setText("instagramUrl")}
            icon={<Instagram className="h-3.5 w-3.5" />}
            placeholder="https://instagram.com/…"
            type="url"
            inputMode="url"
            disabled={d}
          />
          <TextField
            label="X / Twitter"
            value={s.twitterUrl ?? ""}
            onChange={setText("twitterUrl")}
            icon={<Twitter className="h-3.5 w-3.5" />}
            placeholder="https://x.com/…"
            type="url"
            inputMode="url"
            disabled={d}
          />
          <TextField
            label="TikTok"
            value={s.tiktokUrl ?? ""}
            onChange={setText("tiktokUrl")}
            icon={<Music2 className="h-3.5 w-3.5" />}
            placeholder="https://tiktok.com/@…"
            type="url"
            inputMode="url"
            disabled={d}
          />
          <TextField
            label="LinkedIn"
            value={s.linkedinUrl ?? ""}
            onChange={setText("linkedinUrl")}
            icon={<Linkedin className="h-3.5 w-3.5" />}
            placeholder="https://linkedin.com/company/…"
            type="url"
            inputMode="url"
            disabled={d}
          />
          <TextField
            label="YouTube"
            value={s.youtubeUrl ?? ""}
            onChange={setText("youtubeUrl")}
            icon={<Youtube className="h-3.5 w-3.5" />}
            placeholder="https://youtube.com/@…"
            type="url"
            inputMode="url"
            disabled={d}
          />
          <TextField
            label="WhatsApp number"
            value={s.whatsappNumber ?? ""}
            onChange={setText("whatsappNumber")}
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            placeholder="+255 712 345 678"
            type="tel"
            inputMode="tel"
            disabled={d}
            className="sm:col-span-2"
          />
        </div>
      </SectionCard>

      {/* 3 — Reporting & notifications */}
      <SectionCard
        icon={<Bell className="h-4 w-4" />}
        title="Consolidated reporting"
        description="Parent-level sales summaries aggregated across all locations."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
          <TextField
            label="Notification email"
            value={s.notificationEmail ?? ""}
            onChange={setText("notificationEmail")}
            icon={<Mail className="h-3.5 w-3.5" />}
            placeholder="reports@business.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            disabled={d}
          />
          <TextField
            label="Notification phone"
            value={s.notificationPhone ?? ""}
            onChange={setText("notificationPhone")}
            icon={<Phone className="h-3.5 w-3.5" />}
            placeholder="+255 712 345 678"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            disabled={d}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ToggleRow
            label="Daily report"
            hint="Consolidated sales summary every morning"
            checked={Boolean(s.sendConsolidatedDailyReport)}
            onChange={(v) => setField("sendConsolidatedDailyReport", v)}
            disabled={d}
          />
          <ToggleRow
            label="Weekly report"
            hint="Week in review, sent on Mondays"
            checked={Boolean(s.sendConsolidatedWeeklyReport)}
            onChange={(v) => setField("sendConsolidatedWeeklyReport", v)}
            disabled={d}
          />
          <ToggleRow
            label="Monthly report"
            hint="Month-end summary across locations"
            checked={Boolean(s.sendConsolidatedMonthlyReport)}
            onChange={(v) => setField("sendConsolidatedMonthlyReport", v)}
            disabled={d}
          />
        </div>
      </SectionCard>

      {/* 4 — Procurement & defaults */}
      <SectionCard
        icon={<ClipboardCheck className="h-4 w-4" />}
        title="Procurement & defaults"
        description="Approval workflows, transfer rules and seed values for new locations."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Default currency"
            hint="Seeded into every new location as its base currency."
          >
            {() => (
              <CurrencySelector
                value={s.defaultCurrency ?? undefined}
                onChange={(val) => setField("defaultCurrency", val)}
                isDisabled={d}
              />
            )}
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Require purchase requisition approval"
            hint="A manager must approve requisitions before they proceed"
            checked={Boolean(s.requirePurchaseRequisitionApproval)}
            onChange={(v) => setField("requirePurchaseRequisitionApproval", v)}
            disabled={d}
          />
          <ToggleRow
            label="Supplier performance tracking"
            hint="Track and rate supplier performance over time"
            checked={Boolean(s.supplierPerformanceTrackingEnabled)}
            onChange={(v) => setField("supplierPerformanceTrackingEnabled", v)}
            disabled={d}
          />
          <ToggleRow
            label="Landed cost tracking"
            hint="Capture freight, duty and other costs into landed cost"
            checked={Boolean(s.landedCostTrackingEnabled)}
            onChange={(v) => setField("landedCostTrackingEnabled", v)}
            disabled={d}
          />
          <ToggleRow
            label="Location-to-location transfers"
            hint="Allow stock transfers between locations of this business"
            checked={Boolean(s.locationToLocationTransferEnabled)}
            onChange={(v) => setField("locationToLocationTransferEnabled", v)}
            disabled={d}
          />
        </div>
      </SectionCard>

      {/* 5 — Legal documents */}
      <SectionCard
        icon={<ScrollText className="h-4 w-4" />}
        title="Legal documents"
        description="Customer-facing legal text shown on receipts, menus and the website."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Terms & conditions" optional>
            {(id) => (
              <ControlTextarea
                id={id}
                value={s.termsAndConditions ?? ""}
                onChange={(e) => setField("termsAndConditions", e.target.value)}
                placeholder="Terms & conditions text…"
                disabled={d}
                rows={6}
              />
            )}
          </Field>
          <Field label="Privacy policy" optional>
            {(id) => (
              <ControlTextarea
                id={id}
                value={s.privacyPolicy ?? ""}
                onChange={(e) => setField("privacyPolicy", e.target.value)}
                placeholder="Privacy policy text…"
                disabled={d}
                rows={6}
              />
            )}
          </Field>
          <Field label="Return policy" optional>
            {(id) => (
              <ControlTextarea
                id={id}
                value={s.returnPolicy ?? ""}
                onChange={(e) => setField("returnPolicy", e.target.value)}
                placeholder="Return policy text…"
                disabled={d}
                rows={6}
              />
            )}
          </Field>
        </div>
      </SectionCard>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 -mx-4 bg-gradient-to-t from-background via-background/95 to-background/0 px-4 pb-2 pt-4 md:mx-0 md:px-0">
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <span
            className={cn(
              "mr-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:mr-0",
              dirtyCount === 0
                ? "border-line bg-canvas text-muted-foreground"
                : "border-warn/40 bg-warn-tint text-warn",
            )}
          >
            {dirtyCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-warn" />}
            {dirtyCount === 0
              ? "No unsaved changes"
              : `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}`}
          </span>
          {dirtyCount > 0 && !isPending && (
            <Button variant="ghost" size="sm" onClick={() => setDirty({})}>
              Discard
            </Button>
          )}
          {isPending ? (
            <Button disabled>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={dirtyCount === 0}>
              Save changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/** Text-valued settings keys — the ones `setText` may write. */
type TextKey = {
  [K in keyof UpdateBusinessSettingsRequest]-?: NonNullable<
    UpdateBusinessSettingsRequest[K]
  > extends string
    ? K
    : never;
}[keyof UpdateBusinessSettingsRequest];

export default BusinessSettingsPanel;
