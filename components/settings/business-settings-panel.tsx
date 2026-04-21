"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/ui/loading";
import { Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  getBusinessSettings,
  updateBusinessSettings,
  type UpdateBusinessSettingsRequest,
} from "@/lib/actions/business-settings-actions";
import type { Business } from "@/types/business/type";
import type { BusinessSettings, EfdStatus } from "@/types/business/type";

// ──────────────────────────────────────────────────────────────────────
// Small primitives
// ──────────────────────────────────────────────────────────────────────

const SettingsSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
    {children}
  </div>
);

const ToggleRow = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled: boolean;
}) => (
  <div className="flex items-center justify-between rounded-lg border p-4">
    <div className="space-y-0.5">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
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
  description,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled: boolean;
  type?: string;
  description?: string;
  min?: number;
  max?: number;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{label}</label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
    />
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
  </div>
);

const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  description,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled: boolean;
  description?: string;
  rows?: number;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{label}</label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className="resize-y"
    />
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
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
    APPROVED: {
      label: "Approved",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    REJECTED: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 border-red-200",
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
}: {
  business: Business | null;
}) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState<UpdateBusinessSettingsRequest>({});

  useEffect(() => {
    if (!business?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const data = await getBusinessSettings(business.id);
        if (!cancelled) setSettings(data);
      } catch (err) {
        console.error("Failed to load business settings:", err);
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Couldn't load business settings",
            description:
              err instanceof Error ? err.message : "Please try again later.",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [business?.id]);

  // Generic setter that updates both the in-memory copy + the dirty patch.
  function setField<K extends keyof UpdateBusinessSettingsRequest>(
    key: K,
    value: UpdateBusinessSettingsRequest[K],
  ) {
    setSettings((prev) => (prev ? ({ ...prev, [key]: value } as BusinessSettings) : prev));
    setDirty((prev) => ({ ...prev, [key]: value }));
  }

  const dirtyCount = useMemo(() => Object.keys(dirty).length, [dirty]);

  const handleSave = () => {
    if (!business?.id || dirtyCount === 0) return;
    startTransition(async () => {
      const result = await updateBusinessSettings(business.id, dirty);
      if (result.responseType === "success") {
        toast({ title: "Settings updated", description: result.message });
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

  if (!settings) {
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

  const s = settings;
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

      {/* 2 — Legal & fiscal */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection
            title="Legal & fiscal"
            description="Registration numbers and identifiers for the legal entity"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* 3 — EFD (Virtual Fiscal Device) */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection
            title="Virtual Fiscal Device (EFD)"
            description="Request and configure a virtual EFD for this business"
          >
            <div className="space-y-3">
              <ToggleRow
                label="Enable Virtual EFD"
                description="Request virtual EFD registration for this business"
                checked={enableVirtualEfd}
                onCheckedChange={(v) => setField("enableVirtualEfd", v)}
                disabled={d}
              />
            </div>

            {enableVirtualEfd && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
                    onChange={(v) =>
                      setField("uniqueIdentificationNumber", v || null)
                    }
                    placeholder="UIN"
                    disabled={d}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm font-medium">EFD status:</span>
                  <EfdStatusPill status={s.efdStatus} />
                </div>
              </>
            )}
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* 4 — Social media (company) */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection
            title="Social media"
            description="Parent-company social profiles & contact channels"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* 5 — Consolidated reporting */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection
            title="Consolidated reporting"
            description="Parent-level notifications aggregated across all locations"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-3 mt-2">
              <ToggleRow
                label="Daily report"
                description="Send a consolidated daily sales report"
                checked={Boolean(s.sendConsolidatedDailyReport)}
                onCheckedChange={(v) => setField("sendConsolidatedDailyReport", v)}
                disabled={d}
              />
              <ToggleRow
                label="Weekly report"
                description="Send a consolidated weekly sales report"
                checked={Boolean(s.sendConsolidatedWeeklyReport)}
                onCheckedChange={(v) =>
                  setField("sendConsolidatedWeeklyReport", v)
                }
                disabled={d}
              />
              <ToggleRow
                label="Monthly report"
                description="Send a consolidated monthly sales report"
                checked={Boolean(s.sendConsolidatedMonthlyReport)}
                onCheckedChange={(v) =>
                  setField("sendConsolidatedMonthlyReport", v)
                }
                disabled={d}
              />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* 6 — Procurement controls */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection
            title="Procurement controls"
            description="Approval workflows and tracking across locations"
          >
            <div className="space-y-3">
              <ToggleRow
                label="Require purchase requisition approval"
                description="Manager must approve purchase requisitions before they proceed"
                checked={Boolean(s.requirePurchaseRequisitionApproval)}
                onCheckedChange={(v) =>
                  setField("requirePurchaseRequisitionApproval", v)
                }
                disabled={d}
              />
              <ToggleRow
                label="Supplier performance tracking"
                description="Track and rate supplier performance over time"
                checked={Boolean(s.supplierPerformanceTrackingEnabled)}
                onCheckedChange={(v) =>
                  setField("supplierPerformanceTrackingEnabled", v)
                }
                disabled={d}
              />
              <ToggleRow
                label="Landed cost tracking"
                description="Capture freight, duty, and other costs to compute landed cost"
                checked={Boolean(s.landedCostTrackingEnabled)}
                onCheckedChange={(v) => setField("landedCostTrackingEnabled", v)}
                disabled={d}
              />
              <ToggleRow
                label="Location-to-location transfers"
                description="Allow stock transfers between locations of this business"
                checked={Boolean(s.locationToLocationTransferEnabled)}
                onCheckedChange={(v) =>
                  setField("locationToLocationTransferEnabled", v)
                }
                disabled={d}
              />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Default currency for new locations */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection
            title="Defaults for new locations"
            description="Seed values applied when creating a new location"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Default currency"
                value={s.defaultCurrency ?? ""}
                onChange={(v) =>
                  setField(
                    "defaultCurrency",
                    v ? v.trim().toUpperCase().slice(0, 3) : null,
                  )
                }
                placeholder="TZS"
                description="3-letter ISO 4217 currency code"
                disabled={d}
              />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* 7 — Legal documents */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection
            title="Legal documents"
            description="Customer-facing legal text shown on receipts, menus, and the website"
          >
            <div className="space-y-4">
              <TextAreaField
                label="Terms & conditions"
                value={s.termsAndConditions ?? ""}
                onChange={(v) => setField("termsAndConditions", v || null)}
                placeholder="Terms & conditions text…"
                disabled={d}
                rows={6}
              />
              <TextAreaField
                label="Privacy policy"
                value={s.privacyPolicy ?? ""}
                onChange={(v) => setField("privacyPolicy", v || null)}
                placeholder="Privacy policy text…"
                disabled={d}
                rows={6}
              />
              <TextAreaField
                label="Return policy"
                value={s.returnPolicy ?? ""}
                onChange={(v) => setField("returnPolicy", v || null)}
                placeholder="Return policy text…"
                disabled={d}
                rows={6}
              />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

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
