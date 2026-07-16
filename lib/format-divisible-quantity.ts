/**
 * Splits a base-unit quantity into whole + sub-unit counts using a
 * divisible-unit ratio (sub-units per 1 base unit). Floors both parts —
 * matches the backend's RoundingMode.DOWN convention (BomYieldService) and
 * never overstates what's actually countable.
 *
 * The remainder is rounded to 6dp before flooring to neutralize float noise
 * (e.g. 8.999999999997 incorrectly flooring to 8 instead of 9) — 6dp matches
 * the backend's NUMERIC(19,6) quantity column scale.
 */
export function splitDivisibleQuantity(
  quantity: number,
  ratio: number,
): { whole: number; sub: number } {
  const whole = Math.floor(quantity);
  const remainder = Math.round((quantity - whole) * ratio * 1e6) / 1e6;
  const sub = Math.floor(remainder);
  return { whole, sub };
}

function pluralize(label: string, count: number): string {
  return `${count.toLocaleString()} ${label}${count === 1 ? "" : "s"}`;
}

export interface DivisibleUnitInfo {
  baseUnitName: string;
  divisibleUnitRatio?: number | null;
  divisibleUnitName?: string | null;
}

/**
 * Formats a base-unit quantity as "2 Bottles, 29 Tots" when the stock has a
 * divisible unit configured, falling back to the plain existing
 * `qty.toLocaleString()` behavior otherwise — completely unchanged display
 * for any stock that hasn't opted in.
 *
 * Negative values (e.g. a stock-take variance) are formatted from the
 * absolute magnitude with a single leading "-" on the whole string, not a
 * sign on each part (so "-1 Bottle, 2 Tots" means "short by 1 bottle and 2
 * tots", not "-1 Bottle, -2 Tots").
 */
export function formatDivisibleQuantity(
  quantity: number,
  { baseUnitName, divisibleUnitRatio, divisibleUnitName }: DivisibleUnitInfo,
): string {
  if (!divisibleUnitRatio || !divisibleUnitName) {
    return quantity.toLocaleString();
  }

  const isNegative = quantity < 0;
  const { whole, sub } = splitDivisibleQuantity(Math.abs(quantity), divisibleUnitRatio);

  const parts: string[] = [];
  if (whole > 0 || sub === 0) parts.push(pluralize(baseUnitName, whole));
  if (sub > 0) parts.push(pluralize(divisibleUnitName, sub));

  return (isNegative ? "-" : "") + parts.join(", ");
}
