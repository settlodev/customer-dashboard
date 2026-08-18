"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SettingsSection } from "../shared/settings-section";
import { PanelHeader } from "../shared/panel-header";
import {
  getLocationVfdRegistration,
  onboardLocationVfd,
  checkLocationVfdStatus,
  type VfdRegistration,
} from "@/lib/actions/location-vfd-actions";
import type { Business, BusinessSettings } from "@/types/business/type";

const NOT_ACTIVE_YET = /account not active/i;

export function VfdRegistrationPanel({
  locationId,
  business,
  businessSettings,
}: {
  locationId: string;
  business: Business | null;
  businessSettings: BusinessSettings | null;
}) {
  const { toast } = useToast();
  const [registration, setRegistration] = useState<VfdRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, startSubmit] = useTransition();
  const [isChecking, startCheck] = useTransition();

  const [form, setForm] = useState({
    tin: "",
    businessName: "",
    email: "",
    phone: "",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await getLocationVfdRegistration(locationId);
    if ("data" in res) {
      setRegistration(res.data);
    } else {
      toast({
        variant: "destructive",
        title: "Couldn't load VFD registration",
        description: res.error,
      });
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Prefill from the business record once it's available — only fills a
  // field that's still empty, so it never clobbers something the merchant
  // already typed while business/businessSettings were still loading.
  useEffect(() => {
    setForm((prev) => ({
      tin: prev.tin || (businessSettings?.taxIdentificationNumber ?? "").replace(/\D/g, ""),
      businessName: prev.businessName || business?.name || "",
      email: prev.email || business?.email || "",
      phone: prev.phone || business?.phoneNumber || "",
    }));
  }, [business, businessSettings]);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit =
    form.tin.trim() !== "" &&
    form.businessName.trim() !== "" &&
    form.email.trim() !== "" &&
    form.phone.trim() !== "";

  const submit = () => {
    if (!canSubmit) return;
    startSubmit(async () => {
      const res = await onboardLocationVfd({
        locationId,
        tinNumber: form.tin.trim(),
        businessName: form.businessName.trim(),
        emailAddress: form.email.trim(),
        phoneNumber: form.phone.trim(),
      });
      if ("error" in res) {
        toast({
          variant: "destructive",
          title: "Couldn't submit registration",
          description: res.error,
        });
        return;
      }
      toast({
        variant: "success",
        title: "Registration submitted — DIRM/TRA activation is pending.",
      });
      void refresh();
    });
  };

  const checkStatus = () => {
    startCheck(async () => {
      const res = await checkLocationVfdStatus(locationId);
      if ("data" in res) {
        if (res.data.isVerified) {
          toast({ variant: "success", title: "VFD account verified." });
        } else {
          toast({
            variant: "warning",
            title: "Still awaiting DIRM/TRA activation — try again later.",
          });
        }
      } else if (NOT_ACTIVE_YET.test(res.error)) {
        toast({
          variant: "warning",
          title: "Still awaiting DIRM/TRA activation — try again later.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't check status",
          description: res.error,
        });
      }
      void refresh();
    });
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        title="VFD / EFD registration"
        description="TRA fiscal device registration & status for this location."
      />

      {loading ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !registration ? (
        <SettingsSection
          title="Register with TRA"
          description="Register this location with TRA through the DIRM virtual fiscal device service."
          footer={
            <Button onClick={submit} disabled={isSubmitting || !canSubmit}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Register
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="TIN number">
              <Input
                value={form.tin}
                onChange={(e) => setField("tin", e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 123456789"
                inputMode="numeric"
                disabled={isSubmitting}
              />
            </Field>
            <Field label="Business name">
              <Input
                value={form.businessName}
                onChange={(e) => setField("businessName", e.target.value)}
                disabled={isSubmitting}
              />
            </Field>
            <Field label="Email address">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                disabled={isSubmitting}
              />
            </Field>
            <Field label="Phone number">
              <Input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+255712345678"
                disabled={isSubmitting}
              />
            </Field>
          </div>
        </SettingsSection>
      ) : (
        <SettingsSection
          title="TRA fiscal device status"
          footer={
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={checkStatus}
                disabled={isChecking}
              >
                {isChecking && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Check status
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Verification completes after DIRM/TRA activates the account — use
                Check status once you&apos;ve been notified.
              </p>
            </div>
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Status:</span>
            {registration.verified ? (
              <Badge variant="pos">Verified</Badge>
            ) : (
              <Badge variant="warn">Awaiting activation</Badge>
            )}
          </div>

          {!registration.verified && (
            <p className="text-xs text-muted-foreground">
              Receipts can be fiscalised only once this location&apos;s VFD account is
              verified.
            </p>
          )}

          <div className="rounded-md border divide-y">
            <Row label="TIN" value={registration.tin != null ? String(registration.tin) : "—"} />
            <Row label="VRN" value={registration.vrn || "Not registered"} />
            <Row label="UIN" value={registration.uin || "—"} />
            <Row label="Tax office" value={registration.taxOffice || "—"} />
            <Row label="Trading name" value={registration.tradingName || "—"} />
            <Row label="Business name" value={registration.businessName || "—"} />
            <Row
              label="VAT registered"
              value={
                registration.isVatRegistered == null
                  ? "—"
                  : registration.isVatRegistered
                    ? "Yes"
                    : "No"
              }
            />
            {registration.externalStatus && (
              <Row label="External status" value={registration.externalStatus} />
            )}
          </div>

          {registration.externalStatusMessage && (
            <p className="text-xs text-muted-foreground italic">
              {registration.externalStatusMessage}
            </p>
          )}
        </SettingsSection>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
