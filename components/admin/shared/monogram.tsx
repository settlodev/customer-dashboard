import { cn } from "@/lib/utils";
import { initials } from "@/components/admin/shared/format";

/**
 * Monogram — a colored rounded square (or circle) with up-to-two-letter
 * initials. Used for account/business/location/staff avatars across the
 * admin screens. The colour is either passed explicitly or derived
 * deterministically from a seed string, so the same entity always gets
 * the same swatch.
 */

// Saturated, white-text-friendly swatches lifted from the design mock's
// avatar palette. Hashing keeps a given seed on a stable colour.
const PALETTE = [
  "#2563EB", // blue
  "#7C3AED", // purple
  "#0E8B5F", // green
  "#C25E26", // orange-deep
  "#1E3A8A", // indigo
  "#B07A1E", // amber
  "#0E7C7B", // teal
  "#6B2D5C", // plum
  "#C8442A", // red
  "#3B4CCC", // royal
] as const;

export function monogramColor(seed: string | null | undefined): string {
  const s = seed ?? "";
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

const SIZE_MAP = {
  sm: "h-[30px] w-[30px] rounded-lg text-[11px]",
  md: "h-9 w-9 rounded-[10px] text-[12px]",
  lg: "h-[38px] w-[38px] rounded-[10px] text-[13px]",
  xl: "h-[60px] w-[60px] rounded-2xl text-[21px]",
} as const;

interface MonogramProps {
  /** The label to derive initials from (name, business, etc.). */
  name?: string | null;
  /** Explicit initials override (skips derivation). */
  label?: string;
  /** Explicit background colour; otherwise hashed from `seed ?? name`. */
  color?: string;
  /** Seed for deterministic colour (defaults to `name`). */
  seed?: string;
  size?: keyof typeof SIZE_MAP;
  /** Circle instead of rounded square (used for inline avatars). */
  round?: boolean;
  className?: string;
}

export function Monogram({
  name,
  label,
  color,
  seed,
  size = "md",
  round = false,
  className,
}: MonogramProps) {
  const bg = color ?? monogramColor(seed ?? name ?? label ?? "");
  return (
    <span
      className={cn(
        "inline-grid flex-shrink-0 place-items-center font-mono font-semibold leading-none text-white",
        SIZE_MAP[size],
        round && "!rounded-full",
        className,
      )}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {label ?? initials(name)}
    </span>
  );
}
