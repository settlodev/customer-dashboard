"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  SettingsSection,
  SettingsField,
  SettingsSwitchRow,
} from "../shared/settings-section";
import { PanelHeader } from "../shared/panel-header";
import {
  getLocationVfdRegistration,
  onboardLocationVfd,
  checkLocationVfdStatus,
  type VfdRegistration,
} from "@/lib/actions/location-vfd-actions";
import { updateBusinessSettings } from "@/lib/actions/business-settings-actions";
import type {
  Business,
  BusinessSettings,
  EfdStatus,
} from "@/types/business/type";

// Mirrors the server-side rule (settlo-common TinNumberValidator): exactly
// 9 digits, and not all the same digit repeated.
const isValidTin = (tin: string) => /^\d{9}$/.test(tin) && !/^(\d)\1{8}$/.test(tin);

type EfdDraft = { enableVirtualEfd?: boolean; efdSerialNumber?: string };

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

export function VfdRegistrationPanel({
  locationId,
  business,
  businessSettings,
  onBusinessSettingsSaved,
}: {
  locationId: string;
  business: Business | null;
  businessSettings: BusinessSettings | null;
  onBusinessSettingsSaved: (next: BusinessSettings) => void;
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

  // Business-wide EFD flags, edited here (draft + one Save) rather than on
  // Business settings — same idiom as the other settings panels.
  const [isSavingEfd, startSaveEfd] = useTransition();
  const [efdDraft, setEfdDraft] = useState<EfdDraft>({});
  // One heal attempt per mount — a failing PATCH must not become a loop.
  const healedRef = useRef(false);

  const enableVirtualEfd =
    efdDraft.enableVirtualEfd ?? Boolean(businessSettings?.enableVirtualEfd);
  const efdSerial =
    efdDraft.efdSerialNumber ?? businessSettings?.efdSerialNumber ?? "";
  const efdDirty = Object.keys(efdDraft).length > 0;

  const saveBusinessSettings = useCallback(
    async (patch: EfdDraft) => {
      if (!business?.id) return false;
      const res = await updateBusinessSettings(business.id, {
        ...patch,
        efdSerialNumber:
          patch.efdSerialNumber === undefined
            ? undefined
            : patch.efdSerialNumber.trim() || null,
      });
      if (res.responseType === "success") {
        onBusinessSettingsSaved(res.data);
        return true;
      }
      toast({
        variant: "destructive",
        title: "Couldn't save EFD settings",
        description: res.message,
      });
      return false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [business?.id],
  );

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

  // A location registered with TRA IS the business-level "virtual EFD"
  // request — the flag predates per-location registration and nothing reads
  // it, so it drifted off while a location was live and fiscalising. Heal
  // it here rather than asking the merchant to notice and flip a switch
  // whose "on" path would offer to register them a second time. The
  // Accounts service does the same reconcile off the registration event
  // (covering the POS app and any other reader); this is the copy that
  // makes it visible immediately, without waiting on Kafka.
  useEffect(() => {
    if (healedRef.current) return;
    if (!registration || !businessSettings || !business?.id) return;
    if (businessSettings.enableVirtualEfd) return;
    healedRef.current = true;
    void saveBusinessSettings({ enableVirtualEfd: true });
  }, [registration, businessSettings, business?.id, saveBusinessSettings]);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const tinTrimmed = form.tin.trim();
  const tinHasError = tinTrimmed !== "" && !isValidTin(tinTrimmed);

  const canSubmit =
    tinTrimmed !== "" &&
    isValidTin(tinTrimmed) &&
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
          // isOnboarded === false shouldn't normally happen here (the
          // panel only renders this action once a registration exists),
          // but it's the same "not verified yet" outcome either way.
          toast({
            variant: "default",
            title: "Still awaiting DIRM/TRA activation — try again later.",
          });
        }
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
            <SettingsField label="TIN number">
              <Input
                value={form.tin}
                onChange={(e) => setField("tin", e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 123456789"
                inputMode="numeric"
                disabled={isSubmitting}
                aria-invalid={tinHasError}
              />
              {tinHasError && (
                <p className="text-xs text-red-600">
                  TIN must be exactly 9 digits and not all the same digit.
                </p>
              )}
            </SettingsField>
            <SettingsField label="Business name">
              <Input
                value={form.businessName}
                onChange={(e) => setField("businessName", e.target.value)}
                disabled={isSubmitting}
              />
            </SettingsField>
            <SettingsField label="Email address">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                disabled={isSubmitting}
              />
            </SettingsField>
            <SettingsField label="Phone number">
              <Input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+255712345678"
                disabled={isSubmitting}
              />
            </SettingsField>
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

      {/* Business-wide EFD flags — moved here from Business settings so the
          toggle sits beside the registration that determines it, instead of
          reading "disabled" two screens away from a location that is
          already fiscalising. */}
      {!loading && (
        <SettingsSection
          title="Virtual EFD"
          description="Business-wide fiscal-device flags shared by every location."
          onSave={() =>
            startSaveEfd(async () => {
              const ok = await saveBusinessSettings(efdDraft);
              if (ok) {
                setEfdDraft({});
                toast({ variant: "success", title: "EFD settings updated." });
              }
            })
          }
          isPending={isSavingEfd}
          isDirty={efdDirty}
        >
          {!businessSettings ? (
            <p className="text-xs text-muted-foreground">
              Business settings unavailable.
            </p>
          ) : (
            <>
              <SettingsSwitchRow
                label="Enable Virtual EFD"
                description={
                  registration
                    ? "On — this location is registered with TRA."
                    : "Request virtual EFD registration for this business."
                }
                checked={enableVirtualEfd}
                // Once a registration exists the flag is derived from it,
                // not chosen — leaving it editable is what let the two
                // disagree in the first place.
                disabled={isSavingEfd || Boolean(registration)}
                onChange={(v) =>
                  setEfdDraft((prev) => ({ ...prev, enableVirtualEfd: v }))
                }
              />

              <div className="max-w-sm pt-2">
                <SettingsField
                  label="EFD serial number"
                  hint="Physical EFD serial, where one is in use alongside the virtual device."
                >
                  <Input
                    value={efdSerial}
                    onChange={(e) =>
                      setEfdDraft((prev) => ({
                        ...prev,
                        efdSerialNumber: e.target.value,
                      }))
                    }
                    placeholder="EFD serial"
                    disabled={isSavingEfd}
                  />
                </SettingsField>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">EFD status:</span>
                <EfdStatusPill status={businessSettings.efdStatus} />
              </div>
            </>
          )}
        </SettingsSection>
      )}
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
