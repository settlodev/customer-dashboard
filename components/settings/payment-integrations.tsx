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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
} from "lucide-react";

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
    // Fetch full provider details for credential fields
    try {
      const full = await fetchProvider(provider.slug);
      setSelectedProvider(full);
      setSelectedConfig(null);
      setView("setup");
    } catch {
      setSelectedProvider(provider);
      setSelectedConfig(null);
      setView("setup");
    }
  };

  const handleManage = async (provider: Provider, config: BusinessProviderConfig) => {
    try {
      const full = await fetchProvider(provider.slug);
      setSelectedProvider(full);
    } catch {
      setSelectedProvider(provider);
    }
    setSelectedConfig(config);
    setView("manage");
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
          <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
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
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
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

        return (
          <div
            key={provider.id}
            className={`border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col justify-between ${
              isComingSoon ? "opacity-50 pointer-events-none select-none" : ""
            }`}
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                {getProviderLogo(provider.slug, provider.name)}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {provider.name}
                </h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Payment aggregator
              </p>
            </div>
            {isComingSoon ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Coming Soon
                </span>
              </div>
            ) : connected ? (
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Connected</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManage(provider, config!)}
                >
                  Manage
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Not set up</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSetup(provider)}
                >
                  Set Up
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
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Set Up {provider.name}
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Enter your {provider.name} credentials to connect.
      </p>

      <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Credential fields — 3 columns */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Credentials</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>

        {/* Config overrides — collapsible, 2 columns */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-300"
          >
            Configuration (optional)
            {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showConfig && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <Label>Webhook URL</Label>
                <Input
                  value={configOverrides.webhook_url || ""}
                  onChange={(e) =>
                    setConfigOverrides((prev) => ({ ...prev, webhook_url: e.target.value.trim() }))
                  }
                  placeholder={`https://yoursite.com/api/v1/payments/callbacks/${provider.slug}`}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label>Redirect URL</Label>
                <Input
                  value={configOverrides.redirect_url || ""}
                  onChange={(e) =>
                    setConfigOverrides((prev) => ({ ...prev, redirect_url: e.target.value.trim() }))
                  }
                  placeholder="https://yoursite.com/payment/complete"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label>Cancel URL</Label>
                <Input
                  value={configOverrides.cancel_url || ""}
                  onChange={(e) =>
                    setConfigOverrides((prev) => ({ ...prev, cancel_url: e.target.value.trim() }))
                  }
                  placeholder="https://yoursite.com/payment/cancelled"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label>Order Expiry (minutes)</Label>
                <Input
                  type="number"
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
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || requiredFieldsMissing}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Connecting...
              </>
            ) : (
              "Save & Connect"
            )}
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

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${provider.name}? Payments will switch to record-only mode.`)) return;
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
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {provider.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Credentials display */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Credentials
        </p>
        {!editing ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
              {provider.credentialFields.map((field) => (
                <div
                  key={field.fieldName}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {field.displayName}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {configuredKeys.has(field.fieldName) ? (
                      field.fieldType === "SECRET" ? "••••••••" : <Check className="w-4 h-4 text-green-500 inline" />
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="mt-3"
            >
              Edit Credentials
            </Button>
          </div>
        ) : (
          <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        ? "••••••••  (leave blank to keep)"
                        : "(leave blank to keep)"
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
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setCredentials({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Config overrides */}
      {config.configOverrides && Object.keys(config.configOverrides).length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Configuration
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(config.configOverrides).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disconnect */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          {disconnecting ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3 mr-1" />
          )}
          Disconnect {provider.name}
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          Payments will switch to record-only mode. The payment method can still be used.
        </p>
      </div>
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
    <div>
      <Label>
        {field.displayName} {field.required && "*"}
      </Label>
      <div className="relative">
        <Input
          type={isSecret && !showSecret ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder={placeholder}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
        />
        {isSecret && (
          <button
            type="button"
            onClick={onToggleSecret}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
