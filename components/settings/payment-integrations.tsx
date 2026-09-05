"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  fetchProviders,
  fetchProvider,
  fetchBusinessProviderConfigs,
  configureBusinessProvider,
  updateBusinessProvider,
  removeBusinessProvider,
} from "@/lib/actions/payment-method-actions";
import {
  Provider,
  BusinessProviderConfig,
  CredentialField,
} from "@/types/payments/type";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ControlInput, StandaloneField as Field } from "@/components/ui/field";
import {
  AlertCircle,
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Settings2,
  Trash2,
  TriangleAlert,
  Webhook,
} from "lucide-react";

import { PanelHeader } from "./shared/panel-header";
import { SettingsSection } from "./shared/settings-section";

type View = "list" | "setup" | "manage";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const e = err as Record<string, unknown>;
  // API returns { success: false, message: "..." }
  if (e.success === false && typeof e.message === "string") return e.message;
  // Error object with message string
  if (typeof e.message === "string") return e.message;
  // Error object with nested message
  if (typeof e.message === "object" && e.message !== null) {
    const nested = e.message as Record<string, unknown>;
    if (typeof nested.message === "string") return nested.message;
  }
  return fallback;
}

/** Inline failure notice — the shared destructive banner used across settings. */
function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <p className="min-w-0 flex-1 font-medium">{message}</p>
    </div>
  );
}

const providerLogos: Record<string, { src: string; bg?: string }> = {
  SELCOM: { src: "/images/integrators/selcom-logo.png", bg: "rgb(232, 0, 50)" },
  PESAPAL: { src: "/images/integrators/pesapal-logo.png" },
  TEMBO: { src: "/images/integrators/temboplus-logo.png" },
};

const comingSoonProviders = new Set(["PESAPAL", "TEMBO"]);

function getProviderLogo(slug: string, name: string) {
  const logo = providerLogos[slug];
  if (logo) {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
        style={logo.bg ? { backgroundColor: logo.bg } : undefined}
      >
        <img src={logo.src} alt={name} className="w-5 h-5 object-contain" />
      </div>
    );
  }
  return (
    <svg viewBox="0 0 512 512" className="w-8 h-8" fill="none">
      <rect width="512" height="512" rx="96" fill="#6366F1" />
      <path d="M256 150 L310 230 L256 310 L202 230 Z" fill="white" />
    </svg>
  );
}

export default function PaymentIntegrations() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [configs, setConfigs] = useState<BusinessProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  // Detail view state
  const [view, setView] = useState<View>("list");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<BusinessProviderConfig | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [p, c] = await Promise.all([
        fetchProviders(),
        fetchBusinessProviderConfigs(),
      ]);
      setProviders(p);
      setConfigs(c);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to load providers"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetup = async (provider: Provider) => {
    setLoadingSlug(provider.slug);
    try {
      const full = await fetchProvider(provider.slug);
      setSelectedProvider(full);
      setSelectedConfig(null);
      setView("setup");
    } catch {
      setSelectedProvider(provider);
      setSelectedConfig(null);
      setView("setup");
    } finally {
      setLoadingSlug(null);
    }
  };

  const handleManage = async (provider: Provider, config: BusinessProviderConfig) => {
    setLoadingSlug(provider.slug);
    try {
      const full = await fetchProvider(provider.slug);
      setSelectedProvider(full);
    } catch {
      setSelectedProvider(provider);
    }
    setSelectedConfig(config);
    setView("manage");
    setLoadingSlug(null);
  };

  const handleBack = () => {
    setView("list");
    setSelectedProvider(null);
    setSelectedConfig(null);
    load();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[10px] border border-line bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-28 mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorNotice message={error} />;
  }

  if (view === "setup" && selectedProvider) {
    return (
      <ProviderSetupForm
        provider={selectedProvider}
        onBack={handleBack}
        onSuccess={handleBack}
      />
    );
  }

  if (view === "manage" && selectedProvider && selectedConfig) {
    return (
      <ProviderManageView
        provider={selectedProvider}
        config={selectedConfig}
        onBack={handleBack}
        onDisconnect={handleBack}
        onUpdate={handleBack}
      />
    );
  }

  const configMap = new Map(configs.map((c) => [c.providerSlug, c]));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => {
        const config = configMap.get(provider.slug);
        const connected = !!config;
        const isComingSoon = comingSoonProviders.has(provider.slug);
        const busy = loadingSlug === provider.slug;

        return (
          <div
            key={provider.id}
            className={`flex flex-col justify-between rounded-[10px] border border-line bg-card p-5 ${
              isComingSoon ? "opacity-60 pointer-events-none select-none" : ""
            }`}
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                {getProviderLogo(provider.slug, provider.name)}
                <h3 className="text-[13px] font-semibold text-ink">
                  {provider.name}
                </h3>
              </div>
              <p className="text-[12px] text-muted-foreground mb-4">
                Payment aggregator
              </p>
            </div>
            {isComingSoon ? (
              <Badge tone="warn" dot className="w-fit">
                Coming soon
              </Badge>
            ) : connected ? (
              <div className="flex items-center justify-between gap-3">
                <Badge tone="ok" dot className="w-fit">
                  Connected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => handleManage(provider, config!)}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Opening…
                    </>
                  ) : (
                    "Manage"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <Badge tone="muted" dot className="w-fit">
                  Not set up
                </Badge>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => handleSetup(provider)}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Opening…
                    </>
                  ) : (
                    "Set up"
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Setup Form ---

function ProviderSetupForm({
  provider,
  onBack,
  onSuccess,
}: {
  provider: Provider;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [configOverrides, setConfigOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [showConfig, setShowConfig] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await configureBusinessProvider({
        providerSlug: provider.slug,
        enabled: true,
        credentials,
        configOverrides: Object.keys(configOverrides).length > 0 ? configOverrides : undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to save credentials"));
    } finally {
      setSaving(false);
    }
  };

  const requiredFieldsMissing = provider.credentialFields
    .filter((f) => f.required)
    .some((f) => !credentials[f.fieldName]?.trim());

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back
      </Button>

      <PanelHeader
        title={`Set up ${provider.name}`}
        description={`Enter your ${provider.name} credentials to connect.`}
      />

      <form
        autoComplete="off"
        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        className="space-y-5"
      >
        {error && <ErrorNotice message={error} />}

        {/* Credential fields — 3 columns */}
        <SettingsSection
          icon={<KeyRound className="h-4 w-4" />}
          title="Credentials"
          description={`API keys and secrets issued by ${provider.name}.`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3.5">
            {provider.credentialFields.map((field) => (
              <CredentialInput
                key={field.fieldName}
                field={field}
                value={credentials[field.fieldName] || ""}
                onChange={(val) =>
                  setCredentials((prev) => ({ ...prev, [field.fieldName]: val }))
                }
                showSecret={showSecrets[field.fieldName] || false}
                onToggleSecret={() =>
                  setShowSecrets((prev) => ({
                    ...prev,
                    [field.fieldName]: !prev[field.fieldName],
                  }))
                }
              />
            ))}
          </div>
        </SettingsSection>

        {/* Config overrides — collapsible, 2 columns */}
        <SettingsSection
          icon={<Settings2 className="h-4 w-4" />}
          title="Configuration"
          description="Optional — leave blank to use the provider defaults."
          aside={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-expanded={showConfig}
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? "Hide" : "Show"}
              {showConfig ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          }
        >
          {showConfig && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
              <Field label="Webhook URL">
                {(id) => (
                  <ControlInput
                    id={id}
                    mono
                    prefix={<Webhook className="h-3.5 w-3.5" />}
                    value={configOverrides.webhook_url || ""}
                    onChange={(e) =>
                      setConfigOverrides((prev) => ({ ...prev, webhook_url: e.target.value.trim() }))
                    }
                    placeholder={`https://yoursite.com/api/v1/payments/callbacks/${provider.slug}`}
                    autoComplete="off"
                  />
                )}
              </Field>
              <Field label="Redirect URL">
                {(id) => (
                  <ControlInput
                    id={id}
                    mono
                    prefix={<ExternalLink className="h-3.5 w-3.5" />}
                    value={configOverrides.redirect_url || ""}
                    onChange={(e) =>
                      setConfigOverrides((prev) => ({ ...prev, redirect_url: e.target.value.trim() }))
                    }
                    placeholder="https://yoursite.com/payment/complete"
                    autoComplete="off"
                  />
                )}
              </Field>
              <Field label="Cancel URL">
                {(id) => (
                  <ControlInput
                    id={id}
                    mono
                    prefix={<Ban className="h-3.5 w-3.5" />}
                    value={configOverrides.cancel_url || ""}
                    onChange={(e) =>
                      setConfigOverrides((prev) => ({ ...prev, cancel_url: e.target.value.trim() }))
                    }
                    placeholder="https://yoursite.com/payment/cancelled"
                    autoComplete="off"
                  />
                )}
              </Field>
              <Field label="Order expiry" hint="How long an unpaid order stays open.">
                {(id) => (
                  <ControlInput
                    id={id}
                    type="number"
                    inputMode="numeric"
                    mono
                    suffix="min"
                    prefix={<Clock className="h-3.5 w-3.5" />}
                    value={configOverrides.order_expiry_minutes || ""}
                    onChange={(e) =>
                      setConfigOverrides((prev) => ({
                        ...prev,
                        order_expiry_minutes: e.target.value.trim(),
                      }))
                    }
                    placeholder="60"
                    autoComplete="off"
                  />
                )}
              </Field>
            </div>
          )}
        </SettingsSection>

        <div className="flex flex-wrap gap-2.5">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || requiredFieldsMissing}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Connecting…" : "Save & connect"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// --- Manage View ---

function ProviderManageView({
  provider,
  config,
  onBack,
  onDisconnect,
  onUpdate,
}: {
  provider: Provider;
  config: BusinessProviderConfig;
  onBack: () => void;
  onDisconnect: () => void;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const configuredKeys = new Set(config.configuredCredentialKeys || []);

  const handleUpdate = async () => {
    setSaving(true);
    setError(null);
    try {
      // Only send fields that have new values
      const filteredCreds: Record<string, string> = {};
      for (const [k, v] of Object.entries(credentials)) {
        if (v.trim()) filteredCreds[k] = v;
      }
      await updateBusinessProvider(provider.slug, {
        providerSlug: provider.slug,
        enabled: config.enabled,
        credentials: filteredCreds,
      });
      onUpdate();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to update credentials"));
    } finally {
      setSaving(false);
    }
  };

  // Confirmation lives in the AlertDialog that triggers this — see the
  // "Disconnect" button in the danger zone below.
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await removeBusinessProvider(provider.slug);
      onDisconnect();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to disconnect provider"));
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to integrations
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        {getProviderLogo(provider.slug, provider.name)}
        <div className="min-w-0 flex-1">
          <PanelHeader title={provider.name} />
        </div>
        <Badge tone="ok" dot>
          Connected
        </Badge>
      </div>

      {error && <ErrorNotice message={error} />}

      {/* Credentials section */}
      <SettingsSection
        icon={<KeyRound className="h-4 w-4" />}
        title="Credentials"
        description={`API keys and secrets for ${provider.name}`}
        aside={
          !editing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          ) : null
        }
      >
        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {provider.credentialFields.map((field) => (
              <div key={field.fieldName} className="min-w-0">
                <p className="text-[12px] text-muted-foreground mb-1">
                  {field.displayName}
                </p>
                <p className="text-[13px] text-ink font-mono">
                  {configuredKeys.has(field.fieldName) ? (
                    field.fieldType === "SECRET" ? (
                      "••••••••••••"
                    ) : (
                      <span className="flex items-center gap-1.5 text-pos">
                        <Check className="h-3.5 w-3.5" />
                        Configured
                      </span>
                    )
                  ) : (
                    <span className="text-muted-2">Not set</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3.5">
              {provider.credentialFields.map((field) => (
                <CredentialInput
                  key={field.fieldName}
                  field={field}
                  value={credentials[field.fieldName] || ""}
                  onChange={(val) =>
                    setCredentials((prev) => ({ ...prev, [field.fieldName]: val }))
                  }
                  placeholder={
                    configuredKeys.has(field.fieldName)
                      ? field.fieldType === "SECRET"
                        ? "Leave blank to keep current"
                        : "Leave blank to keep current"
                      : undefined
                  }
                  showSecret={showSecrets[field.fieldName] || false}
                  onToggleSecret={() =>
                    setShowSecrets((prev) => ({
                      ...prev,
                      [field.fieldName]: !prev[field.fieldName],
                    }))
                  }
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setCredentials({});
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </SettingsSection>

      {/* Configuration section */}
      {config.configOverrides && Object.keys(config.configOverrides).length > 0 && (
        <SettingsSection
          icon={<Settings2 className="h-4 w-4" />}
          title="Configuration"
          description="Webhook URLs and other settings"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(config.configOverrides).map(([key, value]) => (
              <div key={key} className="min-w-0">
                <p className="text-[12px] text-muted-foreground mb-1">
                  {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="text-[13px] text-ink font-mono truncate" title={value}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </SettingsSection>
      )}

      {/* Danger zone */}
      <SettingsSection
        icon={<TriangleAlert className="h-4 w-4" />}
        tone="danger"
        title="Danger zone"
        description="Destructive actions. Take them only when you really mean to."
      >
        <div className="flex flex-col gap-3 rounded-lg border border-neg/30 bg-neg-tint p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">
              Disconnect {provider.name}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              Payments will switch to record-only mode. The payment method can still be used.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={disconnecting}
                className="w-full shrink-0 sm:w-auto"
              >
                {disconnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <Trash2 className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect {provider.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Stored credentials are removed and payments switch to
                  record-only mode. The payment method stays available on the
                  POS, and you can reconnect by entering the credentials again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep connected</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsSection>
    </div>
  );
}

// --- Credential Input ---

function CredentialInput({
  field,
  value,
  onChange,
  placeholder,
  showSecret,
  onToggleSecret,
}: {
  field: CredentialField;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  showSecret: boolean;
  onToggleSecret: () => void;
}) {
  const isSecret = field.fieldType === "SECRET";

  return (
    <Field label={field.displayName} required={field.required}>
      {(id) => (
        <ControlInput
          id={id}
          mono
          type={isSecret && !showSecret ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder={placeholder}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          prefix={
            isSecret ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )
          }
          suffix={
            isSecret ? (
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                onClick={onToggleSecret}
                aria-label={
                  showSecret
                    ? `Hide ${field.displayName}`
                    : `Show ${field.displayName}`
                }
                className="-mx-2 text-muted-foreground hover:text-ink"
              >
                {showSecret ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
            ) : undefined
          }
        />
      )}
    </Field>
  );
}
