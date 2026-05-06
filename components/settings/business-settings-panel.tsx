"use client";

import React, { useMemo, useState, useTransition } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/ui/loading";
import { Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  updateBusinessSettings,
  type UpdateBusinessSettingsRequest,
} from "@/lib/actions/business-settings-actions";
import type { Business } from "@/types/business/type";
import type { BusinessSettings, EfdStatus } from "@/types/business/type";
import CurrencySelector from "@/components/widgets/currency-selector";

// ──────────────────────────────────────────────────────────────────────
// Layout primitives — match SettingsSection / SettingsSwitchRow density
// ──────────────────────────────────────────────────────────────────────

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <Card className="rounded-xl shadow-sm">
    <CardContent className="pt-5 pb-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </CardContent>
  </Card>
);

const SwitchRow = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled: boolean;
}) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium leading-tight">{label}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    />
  </div>
);

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  hint,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled: boolean;
  type?: string;
  hint?: string;
  min?: number;
  max?: number;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
    />
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled: boolean;
  hint?: string;
  rows?: number;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className="resize-y"
    />
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const EfdStatusPill = ({ status }: { status: EfdStatus | null }) => {
  if (!status) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not requested
      </Badge>
    );
  }
  const map: Record<EfdStatus, { label: string; className: string }> = {
    REQUESTED: {
      label: "Requested",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    AWAITING_CONFIRMATION: {
      label: "Awaiting confirmation",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    ACTIVE: {
      label: "Active",
      className: "bg-green-100 text-green-800 border-green-200",
    },
  };
  const { label, className } = map[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};

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

  const dirtyCount = useMemo(() => Object.keys(dirty).length, [dirty]);

  const handleSave = () => {
    if (!business?.id || dirtyCount === 0) return;
    startTransition(async () => {
      const result = await updateBusinessSettings(business.id, dirty);
      if (result.responseType === "success") {
        toast({ title: "Settings updated", description: result.message });
        onSaved(result.data);
        setDirty({});
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
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Business Settings
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Loading business settings…
          </p>
        </div>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6 flex items-center justify-center">
            <Loading />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!displayed) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Business Settings
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            No settings found for this business.
          </p>
        </div>
      </div>
    );
  }

  const s = displayed;
  const d = isPending;
  const enableVirtualEfd = Boolean(s.enableVirtualEfd);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Business Settings
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Parent-company defaults shared across every location for{" "}
          <span className="font-medium text-foreground">
            {business?.name ?? "this business"}
          </span>
          .
        </p>
      </div>

      {/* 1 — Legal, fiscal & EFD */}
      <SectionCard
        title="Legal, fiscal & EFD"
        description="Registration numbers, identifiers and Virtual Fiscal Device for the legal entity."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <TextField
            label="Business license number"
            value={s.businessLicenseNumber ?? ""}
            onChange={(v) => setField("businessLicenseNumber", v || null)}
            placeholder="License number"
            disabled={d}
          />
          <TextField
            label="Company registration number"
            value={s.companyRegistrationNumber ?? ""}
            onChange={(v) => setField("companyRegistrationNumber", v || null)}
            placeholder="Registration number"
            disabled={d}
          />
          <TextField
            label="Tax identification number (TIN)"
            value={s.taxIdentificationNumber ?? ""}
            onChange={(v) => setField("taxIdentificationNumber", v || null)}
            placeholder="e.g. 123-456-789"
            disabled={d}
          />
          <TextField
            label="Established year"
            value={s.establishedYear != null ? String(s.establishedYear) : ""}
            onChange={(v) => {
              const trimmed = v.trim();
              if (trimmed === "") {
                setField("establishedYear", null);
                return;
              }
              const parsed = Number.parseInt(trimmed, 10);
              if (Number.isFinite(parsed)) setField("establishedYear", parsed);
            }}
            placeholder="e.g. 2020"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            disabled={d}
          />
        </div>

        <div className="space-y-0.5 pt-2">
          <SwitchRow
            label="Enable Virtual EFD"
            description="Request virtual EFD registration for this business"
            checked={enableVirtualEfd}
            onCheckedChange={(v) => setField("enableVirtualEfd", v)}
            disabled={d}
          />
        </div>

        {enableVirtualEfd && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <TextField
                label="EFD serial number"
                value={s.efdSerialNumber ?? ""}
                onChange={(v) => setField("efdSerialNumber", v || null)}
                placeholder="EFD serial"
                disabled={d}
              />
              <TextField
                label="VAT registration number (VRN)"
                value={s.vatRegistrationNumber ?? ""}
                onChange={(v) => setField("vatRegistrationNumber", v || null)}
                placeholder="VRN"
                disabled={d}
              />
              <TextField
                label="Unique identification number (UIN)"
                value={s.uniqueIdentificationNumber ?? ""}
                onChange={(v) => setField("uniqueIdentificationNumber", v || null)}
                placeholder="UIN"
                disabled={d}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">EFD status:</span>
              <EfdStatusPill status={s.efdStatus} />
            </div>
          </>
        )}
      </SectionCard>

      {/* 2 — Social media */}
      <SectionCard
        title="Social media"
        description="Parent-company social profiles and contact channels."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <TextField
            label="Facebook"
            value={s.facebookUrl ?? ""}
            onChange={(v) => setField("facebookUrl", v || null)}
            placeholder="https://facebook.com/…"
            disabled={d}
          />
          <TextField
            label="Instagram"
            value={s.instagramUrl ?? ""}
            onChange={(v) => setField("instagramUrl", v || null)}
            placeholder="https://instagram.com/…"
            disabled={d}
          />
          <TextField
            label="X / Twitter"
            value={s.twitterUrl ?? ""}
            onChange={(v) => setField("twitterUrl", v || null)}
            placeholder="https://x.com/…"
            disabled={d}
          />
          <TextField
            label="TikTok"
            value={s.tiktokUrl ?? ""}
            onChange={(v) => setField("tiktokUrl", v || null)}
            placeholder="https://tiktok.com/@…"
            disabled={d}
          />
          <TextField
            label="LinkedIn"
            value={s.linkedinUrl ?? ""}
            onChange={(v) => setField("linkedinUrl", v || null)}
            placeholder="https://linkedin.com/company/…"
            disabled={d}
          />
          <TextField
            label="YouTube"
            value={s.youtubeUrl ?? ""}
            onChange={(v) => setField("youtubeUrl", v || null)}
            placeholder="https://youtube.com/@…"
            disabled={d}
          />
          <TextField
            label="WhatsApp number"
            value={s.whatsappNumber ?? ""}
            onChange={(v) => setField("whatsappNumber", v || null)}
            placeholder="+255712345678"
            disabled={d}
          />
        </div>
      </SectionCard>

      {/* 3 — Reporting & notifications */}
      <SectionCard
        title="Consolidated reporting"
        description="Parent-level notifications aggregated across all locations."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <TextField
            label="Notification email"
            value={s.notificationEmail ?? ""}
            onChange={(v) => setField("notificationEmail", v || null)}
            placeholder="reports@business.com"
            type="email"
            disabled={d}
          />
          <TextField
            label="Notification phone"
            value={s.notificationPhone ?? ""}
            onChange={(v) => setField("notificationPhone", v || null)}
            placeholder="+255712345678"
            disabled={d}
          />
        </div>
        <div className="space-y-0.5 pt-1">
          <SwitchRow
            label="Daily report"
            description="Send a consolidated daily sales report"
            checked={Boolean(s.sendConsolidatedDailyReport)}
            onCheckedChange={(v) => setField("sendConsolidatedDailyReport", v)}
            disabled={d}
          />
          <SwitchRow
            label="Weekly report"
            description="Send a consolidated weekly sales report"
            checked={Boolean(s.sendConsolidatedWeeklyReport)}
            onCheckedChange={(v) => setField("sendConsolidatedWeeklyReport", v)}
            disabled={d}
          />
          <SwitchRow
            label="Monthly report"
            description="Send a consolidated monthly sales report"
            checked={Boolean(s.sendConsolidatedMonthlyReport)}
            onCheckedChange={(v) => setField("sendConsolidatedMonthlyReport", v)}
            disabled={d}
          />
        </div>
      </SectionCard>

      {/* 4 — Procurement & defaults */}
      <SectionCard
        title="Procurement & defaults"
        description="Approval workflows, transfer rules and seed values for new locations."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Default currency
            </label>
            <CurrencySelector
              value={s.defaultCurrency ?? undefined}
              onChange={(val) => setField("defaultCurrency", val)}
              isDisabled={d}
            />
            <p className="text-[11px] text-muted-foreground">
              Seeded into every new location as its base currency.
            </p>
          </div>
        </div>
        <div className="space-y-0.5 pt-1">
          <SwitchRow
            label="Require purchase requisition approval"
            description="Manager must approve purchase requisitions before they proceed"
            checked={Boolean(s.requirePurchaseRequisitionApproval)}
            onCheckedChange={(v) => setField("requirePurchaseRequisitionApproval", v)}
            disabled={d}
          />
          <SwitchRow
            label="Supplier performance tracking"
            description="Track and rate supplier performance over time"
            checked={Boolean(s.supplierPerformanceTrackingEnabled)}
            onCheckedChange={(v) => setField("supplierPerformanceTrackingEnabled", v)}
            disabled={d}
          />
          <SwitchRow
            label="Landed cost tracking"
            description="Capture freight, duty, and other costs to compute landed cost"
            checked={Boolean(s.landedCostTrackingEnabled)}
            onCheckedChange={(v) => setField("landedCostTrackingEnabled", v)}
            disabled={d}
          />
          <SwitchRow
            label="Location-to-location transfers"
            description="Allow stock transfers between locations of this business"
            checked={Boolean(s.locationToLocationTransferEnabled)}
            onCheckedChange={(v) => setField("locationToLocationTransferEnabled", v)}
            disabled={d}
          />
        </div>
      </SectionCard>

      {/* 5 — Legal documents */}
      <SectionCard
        title="Legal documents"
        description="Customer-facing legal text shown on receipts, menus, and the website."
      >
        <div className="space-y-4">
          <TextAreaField
            label="Terms & conditions"
            value={s.termsAndConditions ?? ""}
            onChange={(v) => setField("termsAndConditions", v || null)}
            placeholder="Terms & conditions text…"
            disabled={d}
            rows={5}
          />
          <TextAreaField
            label="Privacy policy"
            value={s.privacyPolicy ?? ""}
            onChange={(v) => setField("privacyPolicy", v || null)}
            placeholder="Privacy policy text…"
            disabled={d}
            rows={5}
          />
          <TextAreaField
            label="Return policy"
            value={s.returnPolicy ?? ""}
            onChange={(v) => setField("returnPolicy", v || null)}
            placeholder="Return policy text…"
            disabled={d}
            rows={5}
          />
        </div>
      </SectionCard>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-background/0 pt-4 pb-2 -mx-4 px-4 md:-mx-0 md:px-0">
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-muted-foreground">
            {dirtyCount === 0
              ? "No unsaved changes"
              : `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}`}
          </span>
          {isPending ? (
            <Button disabled>
              <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
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

export default BusinessSettingsPanel;
