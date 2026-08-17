/**
 * FactGrid — the `.od-facts` treatment: a hairline-gridded set of
 * label/value pairs where the label is a mono uppercase key and the value is
 * right-aligned. Missing values render as a dimmed em-dash rather than being
 * hidden, so the grid keeps its shape across records.
 *
 * Lifted out of `app/(protected)/orders/[id]/order-detail-view.tsx` so other
 * detail pages (purchase orders, staff) compose from the same system instead
 * of re-implementing it.
 */

import { cn } from "@/lib/utils";

export type Fact = {
  label: string;
  icon?: React.ReactNode;
  value?: React.ReactNode;
  mono?: boolean;
  empty?: boolean;
  /** Renders in place of `value` — use for a `StatusPill`/`Badge` cell. */
  badge?: React.ReactNode;
};

const isBlank = (v: unknown) =>
  v == null || (typeof v === "string" && v.trim() === "");

/** Builds a `Fact`, dimming the row and substituting "—" when `value` is blank. */
export function fact(
  label: string,
  value: React.ReactNode,
  icon?: React.ReactNode,
  opts?: { mono?: boolean },
): Fact {
  const empty = isBlank(value);
  return {
    label,
    icon,
    value: empty ? "—" : value,
    mono: !!opts?.mono && !empty,
    empty,
  };
}

export function FactGrid({ rows, cols }: { rows: Fact[]; cols: 1 | 2 }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line",
        cols === 2 && "sm:grid-cols-2",
      )}
    >
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex min-h-[52px] items-center justify-between gap-3 bg-card px-4 py-3"
        >
          <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {r.icon && <span className="opacity-70">{r.icon}</span>}
            {r.label}
          </span>
          {r.badge ? (
            r.badge
          ) : (
            <span
              className={cn(
                "min-w-0 break-words text-right text-[13px] font-semibold tracking-tight",
                r.mono && "font-mono text-[11.5px] font-medium",
                r.empty ? "font-medium text-muted-2" : "text-ink",
              )}
            >
              {r.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
