/**
 * Formatting helpers shared across the admin screens (dashboard, accounts
 * list, account detail). Kept dependency-free so they can be imported from
 * both server and client components.
 */

/**
 * Compact a number into a short human form: 1_500 → "1.5K", 3_640_000 →
 * "3.64M". Used for the dashboard headline metrics where the currency code
 * is rendered separately as a prefix (so this returns just the magnitude).
 */
export function compactNumber(
  value: number | null | undefined,
  fractionDigits = 1,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000)
    return `${trimZero(value / 1_000_000_000, fractionDigits)}B`;
  if (abs >= 1_000_000)
    return `${trimZero(value / 1_000_000, fractionDigits)}M`;
  if (abs >= 1_000) return `${trimZero(value / 1_000, fractionDigits)}K`;
  return value.toLocaleString();
}

function trimZero(value: number, fractionDigits: number): string {
  return value
    .toFixed(fractionDigits)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

/** Plain thousands-separated integer, or an em dash for nullish. */
export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString();
}

/** Percentage from a ratio, e.g. (12, 15) → "80%". */
export function ratioPercent(
  numerator: number,
  denominator: number,
  fractionDigits = 0,
): string {
  if (!denominator) return "—";
  return `${((numerator / denominator) * 100).toFixed(fractionDigits)}%`;
}

/** "Jun 7, 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "Jun 7, 2026 · 10:05 AM" */
export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d
    .toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", " ·");
}

/** Relative "time since" — "5h ago", "4d ago", "16d ago", "2mo ago". */
export function timeSince(value: string | Date | null | undefined): string {
  if (!value) return "";
  const then = (value instanceof Date ? value : new Date(value)).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  if (diff < 0) return "";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Up-to-two-letter monogram from a name or email. */
export function initials(name: string | null | undefined): string {
  if (!name) return "—";
  const trimmed = name.trim();
  if (!trimmed) return "—";
  // Email → take the local part's first letter(s).
  const source = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return source.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
