"use client";

import React from "react";
import { AlertTriangle, Check, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWhole } from "./shared";
import type { AddonOption, CapacityLine } from "@/types/billing/types";

/**
 * Capacity for one entity: what it is using against each limit, and the addons that would lift
 * whichever ones it is running out of.
 *
 * <p>Two ways in, per the brief. A limit that is full or nearly full is surfaced with its
 * options already visible — the owner is on the pay screen anyway, so it is the moment to
 * mention it. Everything else stays collapsed behind "other capacity" for someone who already
 * knows what they want and just wants to buy it.</p>
 *
 * Selections are staged, not attached: they ride along with invoice generation so they land on
 * the invoice being paid rather than raising a separate charge.
 */
export function CapacityPicker({
  lines,
  loading,
  selected,
  currency,
  disabled,
  onToggle,
}: {
  lines: CapacityLine[] | null;
  loading: boolean;
  /** Addon ids staged for this entity. Read-only — toggling goes through onToggle. */
  selected: ReadonlySet<string>;
  currency: string;
  disabled?: boolean;
  onToggle: (addonId: string) => void;
}) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 px-1 py-2 font-mono text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking capacity…
      </p>
    );
  }
  if (!lines || lines.length === 0) return null;

  const flagged = lines.filter(
    (l) => (l.atLimit || l.nearLimit) && l.options.length > 0,
  );
  const rest = lines.filter((l) => !flagged.includes(l) && l.options.length > 0);

  if (flagged.length === 0 && rest.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {flagged.map((line) => (
        <div
          key={line.featureKey}
          className={cn(
            "rounded-lg border px-3 py-2.5",
            line.atLimit
              ? "border-neg/30 bg-neg-tint"
              : "border-warn/30 bg-warn-tint",
          )}
        >
          <p
            className={cn(
              "flex items-center gap-1.5 text-[12.5px] font-semibold",
              line.atLimit ? "text-neg" : "text-warn",
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {line.featureName}: {formatWhole(line.used)} of{" "}
            {formatWhole(line.limit)} used
            {line.atLimit ? " — full" : ""}
          </p>
          <div className="mt-2 space-y-1.5">
            {line.options.map((option) => (
              <AddonRow
                key={option.addonId}
                option={option}
                line={line}
                currency={currency}
                checked={selected.has(option.addonId)}
                disabled={disabled}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      ))}

      {rest.length > 0 && (
        <details className="rounded-lg border border-line bg-surface px-3 py-2">
          <summary className="cursor-pointer text-[12px] font-medium text-ink-3 marker:text-muted-2">
            Other capacity you can add
          </summary>
          <div className="mt-2 space-y-2">
            {rest.map((line) => (
              <div key={line.featureKey}>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {line.featureName} · {formatWhole(line.used)} of{" "}
                  {formatWhole(line.limit)} used
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {line.options.map((option) => (
                    <AddonRow
                      key={option.addonId}
                      option={option}
                      line={line}
                      currency={currency}
                      checked={selected.has(option.addonId)}
                      disabled={disabled}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function AddonRow({
  option,
  line,
  currency,
  checked,
  disabled,
  onToggle,
}: {
  option: AddonOption;
  line: CapacityLine;
  currency: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (addonId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(option.addonId)}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md border bg-card px-2.5 py-2 text-left transition-colors",
        checked
          ? "border-primary ring-[2px] ring-primary/15"
          : "border-line hover:border-line-2",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "grid h-4 w-4 flex-none place-items-center rounded-[4px] border",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-line-2 bg-card",
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-ink">
          {option.name}
        </span>
        <span className="flex items-center gap-1 font-mono text-[10.5px] text-muted-foreground">
          <TrendingUp className="h-2.5 w-2.5" />
          {line.featureName} {formatWhole(line.limit)} → {formatWhole(option.newLimit)}
        </span>
      </span>
      <span className="flex-none font-mono text-[12px] tabular-nums text-ink-2">
        +{formatWhole(option.price)} {currency}
      </span>
    </button>
  );
}
