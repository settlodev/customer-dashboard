"use client";

import {
  AlertCircle,
  Banknote,
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  HandCoins,
  Loader2,
  RotateCcw,
  Search,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

import {
  fetchLocationPaymentMethods,
  initializeLocationPaymentMethods,
  toggleLocationPaymentMethod,
} from "@/lib/actions/payment-method-actions";

import { PanelHeader } from "../shared/panel-header";
import { SettingsSection } from "../shared/settings-section";
import type { Location } from "@/types/location/type";
import type {
  PaymentMethod,
  PaymentMethodChild,
} from "@/types/payments/type";

interface Props {
  location: Location | null;
  onNavigateToIntegrations?: () => void;
}

export function PaymentMethodsPanel({ location, onNavigateToIntegrations }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [resetPending, startResetTransition] = useTransition();
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLocationPaymentMethods();
      setMethods(data);
    } catch (err) {
      setError(extractMessage(err, "Failed to load payment methods"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = useCallback(
    async (methodId: string, enabled: boolean) => {
      setToggling(methodId);
      try {
        await toggleLocationPaymentMethod(methodId, enabled);
        // Refetch — the backend applies mutual-exclusion (enabling a child
        // disables the parent and vice versa), and an optimistic shape would
        // need to mirror that logic. A single GET keeps the UI honest.
        const fresh = await fetchLocationPaymentMethods();
        setMethods(fresh);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Couldn't update method",
          description: extractMessage(err, "Please try again."),
        });
      } finally {
        setToggling(null);
      }
    },
    [toast],
  );

  const handleReset = useCallback(() => {
    if (
      !confirm(
        "Reset to the default set of accepted payment methods? Your current selections will be replaced.",
      )
    ) {
      return;
    }
    startResetTransition(async () => {
      try {
        await initializeLocationPaymentMethods();
        const fresh = await fetchLocationPaymentMethods();
        setMethods(fresh);
        toast({
          title: "Defaults restored",
          description: "Default payment methods are now enabled for this location.",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Couldn't reset defaults",
          description: extractMessage(err, "Please try again."),
        });
      }
    });
  }, [toast]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filtered = useMemo(() => filterTree(methods, search), [methods, search]);
  const counts = useMemo(() => countEnabled(methods), [methods]);

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Payment methods"
        description="Choose what cashiers can accept at this location. Changes take effect immediately on the POS."
        meta={
          location ? (
            <Badge variant="soft" className="font-normal">
              <Wallet className="h-3 w-3" />
              {location.name}
              {location.identifier ? (
                <span className="text-muted-foreground/80">
                  · {location.identifier}
                </span>
              ) : null}
            </Badge>
          ) : null
        }
      />

      <SettingsSection
        title="Accepted methods"
        description={
          loading
            ? "Loading…"
            : `${counts.enabledLeaves} of ${counts.totalLeaves} payment methods enabled`
        }
      >
        <div className="flex items-center justify-between gap-3 -mt-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search methods (e.g. Cash, CRDB, M-Pesa)…"
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetPending || loading}
          >
            {resetPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            )}
            Reset to defaults
          </Button>
        </div>

        {loading ? (
          <PanelSkeleton />
        ) : error ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-1 underline text-xs hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground italic">
            No payment methods match &ldquo;{search}&rdquo;.
          </p>
        ) : (
          <div className="divide-y">
            {filtered.map((method) => (
              <ParentRow
                key={method.id}
                method={method}
                toggling={toggling}
                expanded={expanded.has(method.id)}
                onToggle={handleToggle}
                onToggleExpanded={toggleExpanded}
                onNavigateToIntegrations={onNavigateToIntegrations}
                searchActive={search.length > 0}
              />
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}

// ── Rows ──────────────────────────────────────────────────────────────

function ParentRow({
  method,
  toggling,
  expanded,
  onToggle,
  onToggleExpanded,
  onNavigateToIntegrations,
  searchActive,
}: {
  method: PaymentMethod;
  toggling: string | null;
  expanded: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onToggleExpanded: (id: string) => void;
  onNavigateToIntegrations?: () => void;
  searchActive: boolean;
}) {
  const hasChildren = !!method.children && method.children.length > 0;
  const enabledChildren = hasChildren
    ? method.children!.filter((c) => c.enabled)
    : [];
  const totalChildren = method.children?.length ?? 0;
  const isToggling = toggling === method.id;
  const isOpen = expanded || searchActive;

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => hasChildren && onToggleExpanded(method.id)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          disabled={!hasChildren}
        >
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-muted">
            <MethodIcon code={method.code} className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {method.displayName}
              </span>
              <ClassificationBadges
                cash={method.cashEquivalent}
                comp={method.complimentaryEquivalent}
                signedBill={method.signedBillEquivalent}
                instant={method.alwaysInstant}
              />
              {method.integrationCapable && (
                <ProviderBadge
                  providerName={method.providerName}
                  connected={method.providerConnected}
                />
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {parentSubtitle(method, enabledChildren.length, totalChildren)}
            </p>
          </div>
        </button>

        <div className="flex flex-shrink-0 items-center gap-2">
          {hasChildren && (
            <button
              type="button"
              onClick={() => onToggleExpanded(method.id)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={method.enabled}
              onCheckedChange={(checked) => onToggle(method.id, checked)}
            />
          )}
        </div>
      </div>

      {hasChildren && isOpen && (
        <ChildrenGrid
          parent={method}
          toggling={toggling}
          onToggle={onToggle}
          onNavigateToIntegrations={onNavigateToIntegrations}
        />
      )}
    </div>
  );
}

function ChildrenGrid({
  parent,
  toggling,
  onToggle,
  onNavigateToIntegrations,
}: {
  parent: PaymentMethod;
  toggling: string | null;
  onToggle: (id: string, enabled: boolean) => void;
  onNavigateToIntegrations?: () => void;
}) {
  const children = parent.children ?? [];
  const parentEnabled = parent.enabled;

  return (
    <div className="mt-3 ml-10 space-y-2">
      <p className="text-[11px] text-muted-foreground">
        {parentEnabled
          ? `Toggle individual ${parent.displayName.toLowerCase()} types to be more specific. Currently all are accepted.`
          : "Pick the specific types you accept, or enable the parent to accept all."}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[...children]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((child) => (
            <ChildRow
              key={child.id}
              child={child}
              parentEnabled={parentEnabled}
              toggling={toggling}
              onToggle={onToggle}
              onNavigateToIntegrations={onNavigateToIntegrations}
            />
          ))}
      </div>
    </div>
  );
}

function ChildRow({
  child,
  parentEnabled,
  toggling,
  onToggle,
  onNavigateToIntegrations,
}: {
  child: PaymentMethodChild;
  parentEnabled: boolean;
  toggling: string | null;
  onToggle: (id: string, enabled: boolean) => void;
  onNavigateToIntegrations?: () => void;
}) {
  const childToggling = toggling === child.id;
  const needsConnect =
    child.integrationCapable && !child.providerConnected && !!onNavigateToIntegrations;

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-md border bg-card px-3 py-2.5 ${
        parentEnabled ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm text-foreground" title={child.displayName}>
          {child.displayName}
        </span>
        {parentEnabled ? (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Included
          </span>
        ) : childToggling ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={child.enabled}
            onCheckedChange={(checked) => onToggle(child.id, checked)}
          />
        )}
      </div>
      {(child.integrationCapable ||
        child.cashEquivalent ||
        child.complimentaryEquivalent ||
        child.signedBillEquivalent ||
        child.alwaysInstant) && (
        <div className="flex flex-wrap items-center gap-1">
          <ClassificationBadges
            cash={child.cashEquivalent}
            comp={child.complimentaryEquivalent}
            signedBill={child.signedBillEquivalent}
            instant={child.alwaysInstant}
          />
          {child.integrationCapable && (
            <ProviderBadge
              providerName={child.providerName}
              connected={child.providerConnected}
            />
          )}
        </div>
      )}
      {needsConnect && (
        <button
          type="button"
          onClick={onNavigateToIntegrations}
          className="inline-flex items-center gap-1 self-start text-[11px] font-medium text-primary hover:underline"
        >
          Connect {child.providerName ?? "provider"}
          <ExternalLink className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ── Badges ────────────────────────────────────────────────────────────

function ClassificationBadges({
  cash,
  comp,
  signedBill,
  instant,
}: {
  cash: boolean;
  comp: boolean;
  signedBill: boolean;
  instant: boolean;
}) {
  return (
    <>
      {cash && (
        <Badge variant="soft" title="Counted as physical cash">
          <Banknote className="h-2.5 w-2.5" />
          Cash
        </Badge>
      )}
      {comp && (
        <Badge variant="warn" title="No-charge write-off — posts to marketing expense">
          <Sparkles className="h-2.5 w-2.5" />
          Comp
        </Badge>
      )}
      {signedBill && (
        <Badge variant="warn" title="Deferred payment — posts to A/R">
          <HandCoins className="h-2.5 w-2.5" />
          Signed bill
        </Badge>
      )}
      {instant && (
        <Badge variant="soft" title="Confirmed without a provider round-trip">
          <Zap className="h-2.5 w-2.5" />
          Instant
        </Badge>
      )}
    </>
  );
}

function ProviderBadge({
  providerName,
  connected,
}: {
  providerName: string | null;
  connected: boolean;
}) {
  if (!providerName) {
    return (
      <Badge variant={connected ? "pos" : "outline"}>
        {connected ? "Connected" : "Not connected"}
      </Badge>
    );
  }
  return (
    <Badge variant={connected ? "pos" : "outline"} title={providerName}>
      {providerName} · {connected ? "Connected" : "Not connected"}
    </Badge>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function parentSubtitle(
  method: PaymentMethod,
  enabledChildCount: number,
  totalChildCount: number,
) {
  if (totalChildCount === 0) {
    return method.enabled ? "Enabled" : "Disabled";
  }
  if (method.enabled) {
    return `All ${totalChildCount} ${pluralize(method.displayName, totalChildCount)} accepted`;
  }
  if (enabledChildCount > 0) {
    return `${enabledChildCount} of ${totalChildCount} ${pluralize(method.displayName, totalChildCount)} accepted`;
  }
  return "Disabled";
}

function pluralize(parentName: string, count: number) {
  const lower = parentName.toLowerCase();
  if (count === 1) return lower;
  if (lower.endsWith("y")) return lower.slice(0, -1) + "ies";
  if (lower.endsWith("s")) return lower;
  return lower + "s";
}

function countEnabled(methods: PaymentMethod[]) {
  let totalLeaves = 0;
  let enabledLeaves = 0;
  for (const m of methods) {
    const children = m.children ?? [];
    if (children.length === 0) {
      totalLeaves += 1;
      if (m.enabled) enabledLeaves += 1;
      continue;
    }
    totalLeaves += children.length;
    if (m.enabled) {
      enabledLeaves += children.length;
    } else {
      enabledLeaves += children.filter((c) => c.enabled).length;
    }
  }
  return { totalLeaves, enabledLeaves };
}

function filterTree(methods: PaymentMethod[], search: string): PaymentMethod[] {
  const sorted = [...methods].sort((a, b) => a.sortOrder - b.sortOrder);
  if (!search.trim()) return sorted;
  const q = search.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(q);
  return sorted.flatMap((m) => {
    const parentHit = matches(m.displayName) || matches(m.code);
    const matchedChildren =
      m.children?.filter((c) => matches(c.displayName) || matches(c.code)) ?? [];
    if (parentHit) {
      // Show full subtree when parent matches
      return [m];
    }
    if (matchedChildren.length > 0) {
      return [{ ...m, children: matchedChildren }];
    }
    return [];
  });
}

function extractMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const e = err as Record<string, unknown>;
  if (e.success === false && typeof e.message === "string") return e.message;
  if (typeof e.message === "string") return e.message;
  return fallback;
}

function MethodIcon({ code, className }: { code: string; className?: string }) {
  switch (code) {
    case "CASH":
      return <Banknote className={className} />;
    case "BANK":
      return <Building2 className={className} />;
    case "CARD":
      return <CreditCard className={className} />;
    case "MOBILE_MONEY":
      return <Smartphone className={className} />;
    case "PAYMENT_AGGREGATORS":
      return <Zap className={className} />;
    case "NO_CHARGE":
      return <HandCoins className={className} />;
    case "GIFT_CARD":
      return <Sparkles className={className} />;
    default:
      return <CreditCard className={className} />;
  }
}

function PanelSkeleton() {
  return (
    <div className="divide-y">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="py-3 flex items-start gap-3">
          <Skeleton className="h-7 w-7 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      ))}
    </div>
  );
}
