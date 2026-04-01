"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Loading from "@/components/ui/loading";
import { Loader2Icon, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  BusinessSettings,
  getBusinessSettings,
  updateBusinessSettings,
  resetBusinessSettings,
} from "@/lib/actions/business-settings-actions";
import { Business } from "@/types/business/type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- Section component for consistent styling ---
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
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
);

const FieldInput = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  description,
  min,
  max,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (val: string | number) => void;
  placeholder?: string;
  disabled: boolean;
  type?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{label}</label>
    <Input
      type={type}
      value={value ?? ""}
      onChange={(e) =>
        type === "number"
          ? onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)
          : onChange(e.target.value)
      }
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
    />
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
  </div>
);

// --- Main component ---
const BusinessSettingsPanel = ({
  business,
}: {
  business: Business | null;
}) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Partial<BusinessSettings>>({});

  useEffect(() => {
    if (!business?.id) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await getBusinessSettings(business.id);
        setSettings(data);
      } catch (error) {
        console.error("Failed to load business settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [business?.id]);

  const handleToggle = (key: string, value: boolean) => {
    setDirtyFields((prev) => ({ ...prev, [key]: value }));
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleChange = (key: string, value: string | number) => {
    setDirtyFields((prev) => ({ ...prev, [key]: value }));
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = () => {
    if (!business?.id || Object.keys(dirtyFields).length === 0) return;
    startTransition(async () => {
      const result = await updateBusinessSettings(business.id, dirtyFields);
      if (result.responseType === "success") {
        toast({ title: "Settings Updated", description: result.message });
        setDirtyFields({});
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handleReset = () => {
    if (!business?.id) return;
    startTransition(async () => {
      const result = await resetBusinessSettings(business.id);
      if (result.responseType === "success") {
        toast({ title: "Settings Reset", description: result.message });
        const data = await getBusinessSettings(business.id);
        setSettings(data);
        setDirtyFields({});
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setShowResetDialog(false);
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Business Settings</h2>
          <p className="text-muted-foreground mt-1 text-sm">Loading business settings...</p>
        </div>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6 flex items-center justify-center"><Loading /></CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Business Settings</h2>
          <p className="text-muted-foreground mt-1 text-sm">No settings found for this business.</p>
        </div>
      </div>
    );
  }

  const s = settings;
  const d = isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Business Settings</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure branding, operational defaults, and business-wide settings
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)} disabled={d}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      {/* Branding */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Branding & SEO" description="Colors, logos, visual identity, and search engine optimization">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(s.primaryColor as string) || "#6C63FF"}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                    disabled={d}
                  />
                  <Input
                    value={(s.primaryColor as string) || ""}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    placeholder="#6C63FF"
                    disabled={d}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(s.secondaryColor as string) || "#333333"}
                    onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                    disabled={d}
                  />
                  <Input
                    value={(s.secondaryColor as string) || ""}
                    onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    placeholder="#333333"
                    disabled={d}
                  />
                </div>
              </div>
              <FieldInput label="Font Family" value={s.fontFamily ?? ""} onChange={(v) => handleChange("fontFamily", v)} placeholder="e.g. Inter" disabled={d} />
              <FieldInput label="Square Logo URL" value={s.logoSquareUrl ?? ""} onChange={(v) => handleChange("logoSquareUrl", v)} placeholder="https://..." disabled={d} />
              <FieldInput label="Wide Logo URL" value={s.logoWideUrl ?? ""} onChange={(v) => handleChange("logoWideUrl", v)} placeholder="https://..." disabled={d} />
              <FieldInput label="Favicon URL" value={s.faviconUrl ?? ""} onChange={(v) => handleChange("faviconUrl", v)} placeholder="https://..." disabled={d} />
              <FieldInput label="Banner Image URL" value={s.bannerImageUrl ?? ""} onChange={(v) => handleChange("bannerImageUrl", v)} placeholder="https://..." disabled={d} />
              <FieldInput label="Share Image URL" value={s.shareImageUrl ?? ""} onChange={(v) => handleChange("shareImageUrl", v)} placeholder="https://..." disabled={d} />
              <FieldInput label="SEO Title" value={s.seoTitle ?? ""} onChange={(v) => handleChange("seoTitle", v)} placeholder="Your business title for search engines" description="Max 200 characters" disabled={d} />
              <div className="space-y-2">
                <label className="text-sm font-medium">SEO Description</label>
                <Textarea
                  value={(s.seoDescription as string) ?? ""}
                  onChange={(e) => handleChange("seoDescription", e.target.value)}
                  placeholder="Brief description of your business for search results..."
                  disabled={d}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">Max 500 characters</p>
              </div>
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Business Information */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Business Information" description="Registration numbers, tax IDs, and business identifiers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput label="Registration Number" value={s.registrationNumber ?? ""} onChange={(v) => handleChange("registrationNumber", v)} placeholder="Business registration number" disabled={d} />
              <FieldInput label="Tax Identification Number (TIN)" value={s.taxIdentificationNumber ?? ""} onChange={(v) => handleChange("taxIdentificationNumber", v)} placeholder="e.g. 123-456-789" disabled={d} />
              <FieldInput label="VAT Registration Number" value={s.vatRegistrationNumber ?? ""} onChange={(v) => handleChange("vatRegistrationNumber", v)} placeholder="VAT number" disabled={d} />
              <FieldInput label="EFD Serial Number" value={s.efdSerialNumber ?? ""} onChange={(v) => handleChange("efdSerialNumber", v)} placeholder="EFD serial" disabled={d} />
              <FieldInput label="Unique Identification Number" value={s.uniqueIdentificationNumber ?? ""} onChange={(v) => handleChange("uniqueIdentificationNumber", v)} placeholder="UIN" disabled={d} />
              <FieldInput label="Business License Number" value={s.businessLicenseNumber ?? ""} onChange={(v) => handleChange("businessLicenseNumber", v)} placeholder="License number" disabled={d} />
              <FieldInput label="Industry" value={s.industry ?? ""} onChange={(v) => handleChange("industry", v)} placeholder="e.g. Food & Beverage" disabled={d} />
              <FieldInput label="Established Year" value={s.establishedYear ?? ""} onChange={(v) => handleChange("establishedYear", v)} placeholder="e.g. 2020" type="number" min={1800} max={2100} disabled={d} />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Social Media */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Social Media" description="Social media profiles and contact channels">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput label="Facebook" value={s.facebookUrl ?? ""} onChange={(v) => handleChange("facebookUrl", v)} placeholder="https://facebook.com/..." disabled={d} />
              <FieldInput label="Instagram" value={s.instagramUrl ?? ""} onChange={(v) => handleChange("instagramUrl", v)} placeholder="https://instagram.com/..." disabled={d} />
              <FieldInput label="Twitter / X" value={s.twitterUrl ?? ""} onChange={(v) => handleChange("twitterUrl", v)} placeholder="https://x.com/..." disabled={d} />
              <FieldInput label="TikTok" value={s.tiktokUrl ?? ""} onChange={(v) => handleChange("tiktokUrl", v)} placeholder="https://tiktok.com/..." disabled={d} />
              <FieldInput label="LinkedIn" value={s.linkedinUrl ?? ""} onChange={(v) => handleChange("linkedinUrl", v)} placeholder="https://linkedin.com/..." disabled={d} />
              <FieldInput label="YouTube" value={s.youtubeUrl ?? ""} onChange={(v) => handleChange("youtubeUrl", v)} placeholder="https://youtube.com/..." disabled={d} />
              <FieldInput label="WhatsApp Number" value={s.whatsappNumber ?? ""} onChange={(v) => handleChange("whatsappNumber", v)} placeholder="+255712345678" disabled={d} />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Operational Defaults */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Operational Defaults" description="Default currency, language, timezone, and tax settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput label="Default Currency" value={s.defaultCurrency ?? "TZS"} onChange={(v) => handleChange("defaultCurrency", v)} placeholder="TZS" description="3-letter ISO 4217 currency code" disabled={d} />
              <FieldInput label="Default Language" value={s.defaultLanguage ?? "en"} onChange={(v) => handleChange("defaultLanguage", v)} placeholder="en" description="ISO 639-1 language code" disabled={d} />
              <FieldInput label="Default Timezone" value={s.defaultTimezone ?? "Africa/Dar_es_Salaam"} onChange={(v) => handleChange("defaultTimezone", v)} placeholder="Africa/Dar_es_Salaam" disabled={d} />
              <FieldInput label="Default Tax Rate (%)" value={s.defaultTaxRate ?? 18.0} onChange={(v) => handleChange("defaultTaxRate", v)} placeholder="18.0" type="number" min={0} max={100} step={0.01} disabled={d} />
              <FieldInput label="Default Tax Label" value={s.defaultTaxLabel ?? "VAT"} onChange={(v) => handleChange("defaultTaxLabel", v)} placeholder="VAT" disabled={d} />
            </div>
            <div className="space-y-3 mt-2">
              <ToggleRow label="Prices Include Tax" description="Whether displayed prices include tax by default" checked={Boolean(s.defaultPricesIncludeTax)} onCheckedChange={(v) => handleToggle("defaultPricesIncludeTax", v)} disabled={d} />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Inventory Defaults */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Inventory Defaults" description="Business-wide inventory settings">
            <div className="space-y-3">
              <ToggleRow label="Low Stock Alerts" description="Get alerts when stock is running low" checked={Boolean(s.enableLowStockAlerts)} onCheckedChange={(v) => handleToggle("enableLowStockAlerts", v)} disabled={d} />
              <ToggleRow label="Allow Negative Stock" description="Allow stock quantities to go below zero" checked={Boolean(s.allowNegativeStock)} onCheckedChange={(v) => handleToggle("allowNegativeStock", v)} disabled={d} />
            </div>
            {s.enableLowStockAlerts && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <FieldInput label="Default Low Stock Threshold" value={s.defaultLowStockThreshold ?? 10} onChange={(v) => handleChange("defaultLowStockThreshold", v)} placeholder="10" type="number" min={0} disabled={d} />
              </div>
            )}
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Customer Settings */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Customer Settings" description="Customer accounts and reviews">
            <div className="space-y-3">
              <ToggleRow label="Customer Accounts" description="Enable customer accounts and profiles" checked={Boolean(s.enableCustomerAccounts)} onCheckedChange={(v) => handleToggle("enableCustomerAccounts", v)} disabled={d} />
              <ToggleRow label="Customer Reviews" description="Allow customers to leave reviews" checked={Boolean(s.enableCustomerReviews)} onCheckedChange={(v) => handleToggle("enableCustomerReviews", v)} disabled={d} />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Payments */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Payment Defaults" description="Business-wide payment settings">
            <div className="space-y-3">
              <ToggleRow label="Split Payments" description="Allow splitting payments across methods" checked={Boolean(s.enableSplitPayments)} onCheckedChange={(v) => handleToggle("enableSplitPayments", v)} disabled={d} />
              <ToggleRow label="Partial Payments" description="Allow partial payment on orders" checked={Boolean(s.enablePartialPayments)} onCheckedChange={(v) => handleToggle("enablePartialPayments", v)} disabled={d} />
            </div>
            <div className="grid grid-cols-1 gap-4 mt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Payment Instructions</label>
                <Textarea
                  value={(s.defaultPaymentInstructions as string) ?? ""}
                  onChange={(e) => handleChange("defaultPaymentInstructions", e.target.value)}
                  placeholder="Payment instructions shown to customers..."
                  disabled={d}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Notifications */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Notifications" description="Business-level notification preferences">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput label="Notification Email" value={s.notificationEmail ?? ""} onChange={(v) => handleChange("notificationEmail", v)} placeholder="admin@business.com" disabled={d} />
              <FieldInput label="Notification Phone" value={s.notificationPhone ?? ""} onChange={(v) => handleChange("notificationPhone", v)} placeholder="+255712345678" disabled={d} />
            </div>
            <div className="space-y-3 mt-2">
              <ToggleRow label="Daily Report" description="Send consolidated daily sales report" checked={Boolean(s.sendConsolidatedDailyReport)} onCheckedChange={(v) => handleToggle("sendConsolidatedDailyReport", v)} disabled={d} />
              <ToggleRow label="Weekly Report" description="Send consolidated weekly sales report" checked={Boolean(s.sendConsolidatedWeeklyReport)} onCheckedChange={(v) => handleToggle("sendConsolidatedWeeklyReport", v)} disabled={d} />
              <ToggleRow label="Monthly Report" description="Send consolidated monthly sales report" checked={Boolean(s.sendConsolidatedMonthlyReport)} onCheckedChange={(v) => handleToggle("sendConsolidatedMonthlyReport", v)} disabled={d} />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Staff Management */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Staff Management" description="Shift management, time tracking, and approval workflows">
            <div className="space-y-3">
              <ToggleRow label="Shift Management" description="Enable shift scheduling and management" checked={Boolean(s.enableShiftManagement)} onCheckedChange={(v) => handleToggle("enableShiftManagement", v)} disabled={d} />
              <ToggleRow label="Time Tracking" description="Track staff working hours" checked={Boolean(s.enableTimeTracking)} onCheckedChange={(v) => handleToggle("enableTimeTracking", v)} disabled={d} />
              <ToggleRow label="Performance Tracking" description="Track staff performance metrics" checked={Boolean(s.enablePerformanceTracking)} onCheckedChange={(v) => handleToggle("enablePerformanceTracking", v)} disabled={d} />
              <ToggleRow label="Require Approval for Voids" description="Manager approval needed to void items" checked={Boolean(s.requireApprovalForVoids)} onCheckedChange={(v) => handleToggle("requireApprovalForVoids", v)} disabled={d} />
              <ToggleRow label="Require Approval for Discounts" description="Manager approval needed for discounts" checked={Boolean(s.requireApprovalForDiscounts)} onCheckedChange={(v) => handleToggle("requireApprovalForDiscounts", v)} disabled={d} />
            </div>
            {s.requireApprovalForDiscounts && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <FieldInput label="Discount Approval Threshold (%)" value={s.discountApprovalThreshold ?? 20} onChange={(v) => handleChange("discountApprovalThreshold", v)} type="number" min={0} max={100} description="Discounts above this % require approval" disabled={d} />
              </div>
            )}
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Procurement */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Procurement" description="Purchasing, supplier tracking, and transfers">
            <div className="space-y-3">
              <ToggleRow label="Purchase Requisition Approval" description="Require approval for purchase requisitions" checked={Boolean(s.requirePurchaseRequisitionApproval)} onCheckedChange={(v) => handleToggle("requirePurchaseRequisitionApproval", v)} disabled={d} />
              <ToggleRow label="Supplier Performance Tracking" description="Track and rate supplier performance" checked={Boolean(s.supplierPerformanceTrackingEnabled)} onCheckedChange={(v) => handleToggle("supplierPerformanceTrackingEnabled", v)} disabled={d} />
              <ToggleRow label="Landed Cost Tracking" description="Track total landed cost of goods" checked={Boolean(s.landedCostTrackingEnabled)} onCheckedChange={(v) => handleToggle("landedCostTrackingEnabled", v)} disabled={d} />
              <ToggleRow label="Location-to-Location Transfer" description="Enable stock transfers between locations" checked={Boolean(s.locationToLocationTransferEnabled)} onCheckedChange={(v) => handleToggle("locationToLocationTransferEnabled", v)} disabled={d} />
            </div>
          </SettingsSection>
        </CardContent>
      </Card>

      <Separator />

      {/* Virtual EFD */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SettingsSection title="Virtual EFD" description="Electronic Fiscal Device settings at business level">
            <div className="space-y-3">
              <ToggleRow label="Enable Virtual EFD" description="Request virtual EFD registration for this business" checked={Boolean(s.enableVirtualEfd)} onCheckedChange={(v) => handleToggle("enableVirtualEfd", v)} disabled={d} />
            </div>
            {s.efdStatus && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Status: </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  s.efdStatus === "ACTIVE" ? "bg-green-100 text-green-800" :
                  s.efdStatus === "AWAITING_CONFIRMATION" ? "bg-blue-100 text-blue-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {s.efdStatus === "ACTIVE" ? "Active" :
                   s.efdStatus === "AWAITING_CONFIRMATION" ? "Awaiting Confirmation" :
                   s.efdStatus === "REQUESTED" ? "Requested" : s.efdStatus}
                </span>
              </div>
            )}
          </SettingsSection>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        {isPending ? (
          <Button disabled>
            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={Object.keys(dirtyFields).length === 0}>
            Save Changes
          </Button>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Business Settings</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all business settings to their default values?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset} disabled={isPending}>
              {isPending ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : null}
              Reset Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessSettingsPanel;
