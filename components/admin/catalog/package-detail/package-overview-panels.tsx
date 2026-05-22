import Link from "next/link";
import { ArrowRight, Coins, Globe, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  PackageFeatureMappingResponse,
  PackageIncludedCreditResponse,
  WhitelabelPackagePriceOverride,
  WhitelabelSummary,
} from "@/types/admin/billing";

interface PanelProps {
  title: string;
  hint: string;
  href?: string;
  hrefLabel?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function PanelShell({ title, hint, href, hrefLabel, icon, children }: PanelProps) {
  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-indigo-50 text-indigo-500 dark:bg-indigo-950/30">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            <p className="font-mono text-[11.5px] text-muted-foreground">
              {hint}
            </p>
          </div>
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-primary"
          >
            {hrefLabel ?? "Manage"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

interface PackageFeaturesPanelProps {
  mappings: PackageFeatureMappingResponse[];
}

export function PackageFeaturesPanel({ mappings }: PackageFeaturesPanelProps) {
  const included = mappings.filter((m) => m.isIncluded !== false);
  const excluded = mappings.filter((m) => m.isIncluded === false);

  return (
    <PanelShell
      title="Entitlements"
      hint={`${included.length} included · ${excluded.length} excluded`}
      href="/features"
      hrefLabel="Edit features"
      icon={<Layers className="h-4 w-4" />}
    >
      {mappings.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-[12.5px] text-muted-foreground">
          No features attached. Head to the Features page to wire up
          entitlements for this package.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {mappings.map((m) => (
            <li
              key={m.feature.id}
              className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-canvas/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">
                  {m.feature.name}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {m.feature.featureKey}
                  {m.featureValue ? ` · ${m.featureValue}` : ""}
                </p>
              </div>
              {m.isIncluded === false ? (
                <Badge
                  variant="outline"
                  className="border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
                >
                  Excluded
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                >
                  Included
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

interface PackageCreditsPanelProps {
  credits: PackageIncludedCreditResponse[];
}

export function PackageCreditsPanel({ credits }: PackageCreditsPanelProps) {
  return (
    <PanelShell
      title="Monthly included credits"
      hint={`${credits.length} allowance${credits.length === 1 ? "" : "s"} every billing cycle`}
      href="/credit-packs"
      hrefLabel="Edit credits"
      icon={<Coins className="h-4 w-4" />}
    >
      {credits.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-[12.5px] text-muted-foreground">
          No credit allowances. Attach one from the Credits page to grant
          monthly top-ups.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {credits.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-canvas/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">
                  {c.creditTypeName ?? "Credit"}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {c.creditTypeCode ?? c.creditTypeId}
                </p>
              </div>
              <p className="font-mono text-[12px] tabular-nums text-ink">
                {c.monthlyAmount.toLocaleString()}
                <span className="ml-1 text-[10px] uppercase tracking-[0.05em] text-muted-foreground">
                  / mo
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

interface PackageWhitelabelPanelProps {
  basePrice: number;
  overrides: { whitelabel: WhitelabelSummary; price: number }[];
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function PackageWhitelabelPanel({
  basePrice,
  overrides,
}: PackageWhitelabelPanelProps) {
  return (
    <PanelShell
      title="Whitelabel pricing"
      hint={`${overrides.length} override${overrides.length === 1 ? "" : "s"} · base ${formatMoney(basePrice)}`}
      href="/whitelabel-pricing"
      hrefLabel="Edit overrides"
      icon={<Globe className="h-4 w-4" />}
    >
      {overrides.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-[12.5px] text-muted-foreground">
          Every whitelabel pays the base price. Override per whitelabel from
          the Whitelabel pricing screen.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {overrides.map(({ whitelabel, price }) => {
            const delta = price - basePrice;
            const deltaPct = basePrice > 0 ? (delta / basePrice) * 100 : 0;
            const tone =
              delta > 0
                ? "text-pos"
                : delta < 0
                  ? "text-neg"
                  : "text-muted-foreground";
            return (
              <li
                key={whitelabel.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-canvas/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {whitelabel.name}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {whitelabel.code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[12.5px] tabular-nums text-ink">
                    {formatMoney(price)}
                  </p>
                  {delta !== 0 && (
                    <p
                      className={`font-mono text-[10.5px] tabular-nums ${tone}`}
                    >
                      {delta > 0 ? "+" : ""}
                      {formatMoney(delta)} ({deltaPct >= 0 ? "+" : ""}
                      {deltaPct.toFixed(1)}%)
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PanelShell>
  );
}
