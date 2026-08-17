/**
 * HeroCard — the permanently dark accent card that heads a detail page's
 * left rail. Fixed colours in both themes (like the marketing footer), so the
 * record's headline number always pops off the canvas.
 *
 * Lifted out of the sales-order detail page's `MoneyHero` so other detail
 * pages can lead with the same treatment.
 */

import { cn } from "@/lib/utils";
import type { Tone } from "./primitives";

/**
 * The hero's tone vocabulary — `StatusPill`'s five tones plus `brand`, which
 * only exists here: the dark card is the one surface where the Settlo orange
 * reads as an accent rather than as a call to action.
 */
export type HeroTone = Tone | "brand";

/**
 * Fixed hues for chips rendered ON the hero, where the translucent tint
 * classes used by `StatusPill`/`StatusTag` would wash out against the dark
 * gradient. `brand` is `--primary` (21 81% 59%) resolved to hex — the card's
 * own radial highlight is the same orange.
 */
export const HERO_TONE_HEX: Record<HeroTone, string> = {
  pos: "#12B981",
  warn: "#E0A43B",
  neg: "#EF7457",
  info: "#5B9BFF",
  muted: "rgba(255,255,255,0.5)",
  brand: "#EB7D42",
};

export function HeroCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[#0C2523] p-5 text-white shadow-sm",
        className,
      )}
      style={{
        background: "radial-gradient(120% 140% at 85% 0%, #173B39, #0C2523)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 80% at 92% -5%, rgba(235,127,68,0.16), transparent 60%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** The hero's mono uppercase eyebrow label. */
export function HeroLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/60">
      {children}
    </div>
  );
}

/**
 * A translucent pill sized for the hero's header row. Leads with a tone dot
 * by default; pass `icon` to lead with a glyph instead (tinted by `tone`),
 * which reads better when the chip's text alone doesn't say what it measures.
 */
export function HeroChip({
  tone,
  icon,
  children,
}: {
  tone?: HeroTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
      {icon ? (
        <span
          className="shrink-0"
          style={tone ? { color: HERO_TONE_HEX[tone] } : undefined}
        >
          {icon}
        </span>
      ) : (
        tone && (
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: HERO_TONE_HEX[tone] }}
          />
        )
      )}
      {children}
    </span>
  );
}

/** The hero's headline figure, with a small mono unit riding the baseline. */
export function HeroValue({
  value,
  unit,
}: {
  value: React.ReactNode;
  unit?: React.ReactNode;
}) {
  return (
    <div className="mt-2 flex items-baseline gap-2 text-[40px] font-bold leading-none tracking-[-0.035em]">
      {value}
      {unit && (
        <span className="font-mono text-[15px] font-semibold tracking-[0.02em] text-white/60">
          {unit}
        </span>
      )}
    </div>
  );
}

/** Progress meter + its two mono captions, as used under the headline figure. */
export function HeroMeter({
  pct,
  color,
  left,
  right,
}: {
  pct: number;
  color: string;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
        />
      </div>
      <div className="mt-2 flex justify-between gap-3 font-mono text-[10.5px] text-white/70">
        <span className="font-semibold text-white">{left}</span>
        <span className="font-semibold text-white">{right}</span>
      </div>
    </>
  );
}
