/**
 * Merchant-facing date/time formatting.
 *
 * Backend timestamps are true UTC instants (verified against the orders
 * store). Formatting them with the runtime's ambient timezone is what broke
 * the orders list: on Vercel the server renders UTC wall times into the
 * initial HTML, production hydration never re-checks text content, so the
 * viewer keeps seeing UTC. Pinning the business timezone makes the server
 * and the client render the identical string, and makes the viewer's OS
 * timezone irrelevant.
 *
 * Tanzania is fixed UTC+3 with no DST, so a constant is safe. If Settlo
 * ever runs locations outside EAT, thread `location.timezone` through the
 * `timeZone` option instead of widening this constant.
 */

export const BUSINESS_TIMEZONE = "Africa/Dar_es_Salaam";

const DATE_FMT = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: BUSINESS_TIMEZONE,
});

const TIME_FMT = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: BUSINESS_TIMEZONE,
});

const TIME_SECONDS_FMT = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: BUSINESS_TIMEZONE,
});

const parse = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "Aug 29, 2026" — also safe for date-only strings like a businessDate. */
export const formatDate = (
  value: string | Date | null | undefined,
): string | null => {
  const d = parse(value);
  return d ? DATE_FMT.format(d) : null;
};

/** "13:05" (or "13:05:12" with seconds), in the business timezone. */
export const formatTime = (
  value: string | Date | null | undefined,
  opts?: { seconds?: boolean },
): string | null => {
  const d = parse(value);
  return d ? (opts?.seconds ? TIME_SECONDS_FMT : TIME_FMT).format(d) : null;
};

/** "Aug 29, 2026, 13:05" (seconds opt-in), in the business timezone. */
export const formatDateTime = (
  value: string | Date | null | undefined,
  opts?: { seconds?: boolean },
): string | null => {
  const d = parse(value);
  if (!d) return null;
  return `${DATE_FMT.format(d)}, ${(opts?.seconds ? TIME_SECONDS_FMT : TIME_FMT).format(d)}`;
};

/**
 * Start/end of a `YYYY-MM-DD` calendar day in the business timezone, as an
 * OffsetDateTime-compatible ISO string (e.g. "2026-08-29T00:00:00+03:00").
 * Hardcoding the +03:00 offset is safe because BUSINESS_TIMEZONE is fixed
 * UTC+3 with no DST — see the note above.
 */
export const startOfBusinessDayIso = (dateOnly: string): string =>
  `${dateOnly}T00:00:00+03:00`;

export const endOfBusinessDayIso = (dateOnly: string): string =>
  `${dateOnly}T23:59:59+03:00`;
