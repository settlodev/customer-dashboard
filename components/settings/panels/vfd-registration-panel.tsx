"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  Hash,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Stamp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ControlInput,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import { SettingsSection } from "../shared/settings-section";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSaveBar } from "../shared/settings-save-bar";
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

const EFD_STATUS_PILL: Record<EfdStatus, { label: string; variant: "warn" | "soft" | "pos" }> = {
  REQUESTED: { label: "Requested", variant: "warn" },
  AWAITING_CONFIRMATION: { label: "Awaiting confirmation", variant: "soft" },
  ACTIVE: { label: "Active", variant: "pos" },
};

const EfdStatusPill = ({ status }: { status: EfdStatus | null }) => {
  if (!status) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not requested
      </Badge>
    );
  }
  const { label, variant } = EFD_STATUS_PILL[status];
  return <Badge variant={variant}>{label}</Badge>;
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
          <CardContent className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !registration ? (
        <SettingsSection
          icon={<Stamp className="h-4 w-4" />}
          title="Register with TRA"
          description="Register this location with TRA through the DIRM virtual fiscal device service."
          footer={
            <Button onClick={submit} disabled={isSubmitting || !canSubmit}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? "Registering…" : "Register"}
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
            <Field
              label="TIN number"
              hint={
                tinHasError
                  ? "TIN must be exactly 9 digits and not all the same digit."
                  : "Nine digits, as issued by TRA."
              }
            >
              {(id) => (
                <ControlInput
                  id={id}
                  mono
                  inputMode="numeric"
                  maxLength={9}
                  prefix={<Hash className="h-3.5 w-3.5" />}
                  value={form.tin}
                  onChange={(e) => setField("tin", e.target.value.replace(/\D/g, ""))}
                  placeholder="123456789"
                  disabled={isSubmitting}
                  aria-invalid={tinHasError}
                />
              )}
            </Field>
            <Field label="Business name" hint="Exactly as registered with TRA.">
              {(id) => (
                <ControlInput
                  id={id}
                  prefix={<Building2 className="h-3.5 w-3.5" />}
                  value={form.businessName}
                  onChange={(e) => setField("businessName", e.target.value)}
                  disabled={isSubmitting}
                />
              )}
            </Field>
            <Field label="Email address">
              {(id) => (
                <ControlInput
                  id={id}
                  type="email"
                  inputMode="email"
                  prefix={<Mail className="h-3.5 w-3.5" />}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  disabled={isSubmitting}
                />
              )}
            </Field>
            <Field label="Phone number">
              {(id) => (
                <ControlInput
                  id={id}
                  type="tel"
                  inputMode="tel"
                  prefix={<Phone className="h-3.5 w-3.5" />}
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="+255 712 345 678"
                  disabled={isSubmitting}
                />
              )}
            </Field>
          </div>
        </SettingsSection>
      ) : (
        <SettingsSection
          icon={<ShieldCheck className="h-4 w-4" />}
          title="TRA fiscal device status"
          description="Receipts fiscalise only once this location's VFD account is verified."
          aside={
            registration.verified ? (
              <Badge variant="pos">Verified</Badge>
            ) : (
              <Badge variant="warn">Awaiting activation</Badge>
            )
          }
          footer={
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={checkStatus}
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {isChecking ? "Checking…" : "Check status"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Verification completes after DIRM/TRA activates the account — use
                Check status once you&apos;ve been notified.
              </p>
            </div>
          }
        >
          <div className="overflow-hidden rounded-lg border border-line">
            <Row label="TIN" value={registration.tin != null ? String(registration.tin) : "—"} mono />
            <Row label="VRN" value={registration.vrn || "Not registered"} mono />
            <Row label="UIN" value={registration.uin || "—"} mono />
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
            <p className="text-[12px] italic text-muted-foreground">
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
          icon={<Stamp className="h-4 w-4" />}
          title="Virtual EFD"
          description="Business-wide fiscal-device flags shared by every location."
          aside={<EfdStatusPill status={businessSettings?.efdStatus ?? null} />}
        >
          {!businessSettings ? (
            <p className="text-[12px] text-muted-foreground">
              Business settings unavailable.
            </p>
          ) : (
            <>
              <ToggleRow
                label="Enable Virtual EFD"
                hint={
                  registration
                    ? "On — this location is registered with TRA, so the flag follows the registration."
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="EFD serial number"
                  hint="Physical EFD serial, where one runs alongside the virtual device."
                  optional
                >
                  {(id) => (
                    <ControlInput
                      id={id}
                      mono
                      prefix={<Hash className="h-3.5 w-3.5" />}
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
                  )}
                </Field>
              </div>
            </>
          )}
        </SettingsSection>
      )}

      {!loading && businessSettings && (
        <SettingsSaveBar
          dirtyCount={Object.keys(efdDraft).length}
          isPending={isSavingEfd}
          onSave={() =>
            startSaveEfd(async () => {
              const ok = await saveBusinessSettings(efdDraft);
              if (ok) {
                setEfdDraft({});
                toast({ variant: "success", title: "EFD settings updated." });
              }
            })
          }
          onDiscard={() => setEfdDraft({})}
        />
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line px-3.5 py-2.5 last:border-b-0">
      <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
      <span
        className={`text-right text-[13px] font-medium text-ink${mono ? " font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
