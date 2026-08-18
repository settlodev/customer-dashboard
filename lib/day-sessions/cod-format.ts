/**
 * Close-of-Day dashboard — shared, pure presentation helpers.
 *
 * These are deliberately framework-free (no "use server"/"use client")
 * so both the server page (`day-sessions/[id]/page.tsx`) and the client
 * cash-up card can import the same money/date/staff formatters and the
 * same payment-method colour ramp. Keeping them here avoids a second,
 * subtly-different `fmtVariance` drifting between the two files.
 */

import type { Staff } from "@/types/staff";

// ── Money & numbers ──────────────────────────────────────────────────
// TZS is a zero-decimal currency in practice, so every amount renders as
// a grouped integer. Callers pass raw numbers; formatting lives here.

export const fmt = (n?: number | null): string =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

/** Signed variance with a crisp unicode minus: "+2,000" / "−2,000" / "0". */
export const fmtVariance = (n?: number | null): string => {
  const v = Math.round(n ?? 0);
  if (v === 0) return "0";
  return v > 0 ? `+${fmt(v)}` : `−${fmt(Math.abs(v))}`;
};

/** Two-decimal money, for the formal printed report ("1,240,000.00"). */
export const fmt2 = (n?: number | null): string =>
  (n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Signed two-decimal variance: "+3,000.00" / "−2,000.00" / "0.00". */
export const fmtVariance2 = (n?: number | null): string => {
  const v = n ?? 0;
  if (Math.round(v * 100) === 0) return "0.00";
  return v > 0 ? `+${fmt2(v)}` : `−${fmt2(Math.abs(v))}`;
};

/** Compact millions form used by a couple of KPI tiles ("3.71M"). */
export const fmtCompact = (n?: number | null): string => {
  const v = n ?? 0;
  if (Math.abs(v) >= 1_000_000)
    return `${(v / 1_000_000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}M`;
  return fmt(v);
};

/** Gross-profit margin as a whole percent; null when net sales is zero. */
export const marginPct = (
  grossProfit?: number | null,
  net?: number | null,
): number | null => {
  if (!net || net <= 0) return null;
  return Math.round(((grossProfit ?? 0) / net) * 100);
};

// ── Dates & durations ────────────────────────────────────────────────

/** "Jul 09 · 23:06" — the session-meta strip format (24h clock). */
export const fmtDateTimeDot = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} · ${time}`;
};

/** "July 10, 2026" from a full ISO timestamp (used on the printed report). */
export const fmtLongDate = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * "July 10, 2026" from a bare business-date string ("2026-07-10").
 * Parsed as a local date (noon) so a negative UTC offset can't roll it
 * back a day.
 */
export const fmtBusinessDate = (ymd?: string | null): string => {
  if (!ymd) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return fmtLongDate(ymd);
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/** "Jul 10, 2026 · 23:14" — the report's "generated at" stamp. */
export const fmtDateTimeShort = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} · ${time}`;
};

/** "07:58:12" — 24h clock with seconds for the audit-trail cells. */
export const fmtClock = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

/** "23:14" — bare 24h time for record rows. */
export const fmtTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/** "13h 4m" between open and (close ?? now); "—" when never opened. */
export const fmtDuration = (
  openedAt?: string | null,
  closedAt?: string | null,
  now: number = Date.now(),
): string => {
  if (!openedAt) return "—";
  const open = new Date(openedAt).getTime();
  if (Number.isNaN(open)) return "—";
  const close = closedAt ? new Date(closedAt).getTime() : now;
  const minutes = Math.max(0, Math.floor((close - open) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// ── Ids & staff ──────────────────────────────────────────────────────

/** Shorten a UUID for display when no human-readable label exists. */
export const shortId = (id?: string | null): string =>
  id ? `${id.slice(0, 8)}…` : "—";

/** Two-letter initials from a full name ("Neema Mushi" → "NM"). */
export const initialsOf = (name?: string | null): string => {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Avatar colour ramp for staff without a stored `color`. Deterministic
 * from the id so the same person keeps the same swatch across renders.
 */
const AVATAR_RAMP = [
  "#EB7F44",
  "#0E8B5F",
  "#2563EB",
  "#7C3AED",
  "#C4892B",
  "#C8442A",
];

export interface StaffChip {
  name: string;
  initials: string;
  /** Solid avatar background. */
  color: string;
  /** Job title / role label, e.g. "Shift cashier". Null when unknown. */
  title: string | null;
}

/**
 * Resolve a raw staff id (as returned on void / refund / approval rows)
 * to a display chip. Returns null for a missing id so callers can render
 * an em-dash. Falls back to a shortened id name + ramp colour when the
 * roster lookup misses — never blocks rendering.
 */
export const staffChip = (
  id: string | null | undefined,
  roster: Map<string, Staff>,
  fallbackName?: string | null,
): StaffChip | null => {
  if (!id) return null;
  const s = roster.get(id);
  // Prefer the local roster record; else a server-resolved name (the actor
  // may live outside the location-scoped roster — e.g. an owner); else a
  // shortened id. Initials + avatar tone track whichever real name we have.
  const resolvedName = s?.fullName ?? fallbackName ?? null;
  const name = resolvedName ?? shortId(id);
  const idx =
    Math.abs(
      [...id].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 7),
    ) % AVATAR_RAMP.length;
  return {
    name,
    initials: resolvedName ? initialsOf(resolvedName) : id.slice(0, 2).toUpperCase(),
    color: s?.color || AVATAR_RAMP[idx],
    title: s?.jobTitle ?? s?.roles?.[0]?.name ?? null,
  };
};

/**
 * Plain display name for a raw staff id, or an em-dash. Falls back to a
 * server-resolved name when the id isn't in the (location-scoped) roster,
 * then to a shortened id.
 */
export const staffName = (
  id: string | null | undefined,
  roster: Map<string, Staff>,
  fallbackName?: string | null,
): string =>
  id ? (roster.get(id)?.fullName ?? fallbackName ?? shortId(id)) : "—";

// ── Payment methods ──────────────────────────────────────────────────
// The dashboard shows a payment id in several places (prepayment method,
// cash-drawer cash detection). The report + reconciliation rows both
// carry `paymentMethodId` + name, so we fold them into one lookup.

export interface MethodRef {
  paymentMethodId?: string | null;
  paymentMethodName?: string | null;
  paymentMethodCode?: string | null;
}

/** id → best available payment-method name, from any rows that carry it. */
export const methodNameIndex = (...rows: MethodRef[][]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const list of rows) {
    for (const r of list) {
      const id = r.paymentMethodId;
      const name = r.paymentMethodName ?? r.paymentMethodCode;
      if (id && name && !map.has(id)) map.set(id, name);
    }
  }
  return map;
};

/** True when a code/name looks like physical cash. */
export const isCashMethod = (label?: string | null): boolean =>
  !!label && /\bcash\b/i.test(label);

/** Ordered decorative palette for the payment-mix bars / dots. */
export const PM_PALETTE = [
  "#0E8B5F",
  "#EB7F44",
  "#2563EB",
  "#7C3AED",
  "#C4892B",
  "#B5B5B0",
];

export const pmColor = (index: number): string =>
  PM_PALETTE[index % PM_PALETTE.length];

/** Resolve a display currency from whichever CoD source carries one. */
export const resolveCurrency = (
  ...candidates: (string | null | undefined)[]
): string => candidates.find((c) => !!c) ?? "TZS";
