/**
 * Half a ULP of the finest quantity the backend writes, in base units — the
 * mirror of `SellableUnits.QUANTISATION_SLACK` on the inventory service.
 *
 * A quantity arrives here already rounded to its column's scale, so a value
 * that is truly 23/24 of a crate reads back as 0.958333 and multiplies out to
 * 22.999992 bottles. Flooring that reports 22, losing a bottle that is
 * physically on the shelf. The gap is never larger than half a ULP, so
 * forgiving exactly that much before splitting recovers the true count while
 * still refusing to round up anything genuinely short: it is worth about one
 * hundred-thousandth of a bottle.
 */
const QUANTISATION_SLACK = 5e-7;

/**
 * Splits a base-unit quantity into whole + sub-unit counts using a
 * divisible-unit ratio (sub-units per 1 base unit). Floors both parts —
 * matches the backend's RoundingMode.DOWN convention (BomYieldService) and
 * never overstates what's actually countable — after forgiving the stored
 * value's own quantisation (see `QUANTISATION_SLACK`).
 *
 * The remainder is rounded to 6dp before flooring to neutralize float noise
 * (e.g. 8.999999999997 incorrectly flooring to 8 instead of 9). That rounding
 * step, and the slack above it, can each push a remainder that's within 6dp of
 * a full `ratio` up to `ratio` itself (e.g. quantity `4.1 - 0.1` ===
 * `3.9999999999999996` at ratio 30 would otherwise yield `{ whole: 3, sub: 30 }`),
 * so a rollover guard carries the overflow into `whole` to preserve the
 * `sub < ratio` invariant.
 *
 * Expects a non-negative `quantity`; negative inputs floor toward -Infinity
 * rather than mirroring the sign (e.g. `-1.0666666667` at ratio 30 yields
 * `{ whole: -2, sub: 28 }`, not the `{ whole: -1, sub: 2 }` magnitude split
 * that `formatDivisibleQuantity` displays as "-1 Bottle, 2 Tots" for that
 * same value). Callers needing signed/negative handling should go through
 * `formatDivisibleQuantity`, which applies `Math.abs()` before calling this
 * function.
 */
export function splitDivisibleQuantity(
  quantity: number,
  ratio: number,
): { whole: number; sub: number } {
  const forgiving = quantity + QUANTISATION_SLACK;
  let whole = Math.floor(forgiving);
  const remainder = Math.round((forgiving - whole) * ratio * 1e6) / 1e6;
  let sub = Math.floor(remainder);
  if (sub >= ratio) {
    whole += 1;
    sub -= ratio;
  }
  return { whole, sub };
}

/**
 * Formats a quantity for display: thousands separators always, and at least
 * two decimals whenever the value actually has a fractional part, so a weight
 * reads "1,000.50" rather than "1000.5". Whole counts stay clean ("9", not
 * "9.00"), and genuinely fine-grained values keep a third digit rather than
 * being rounded away.
 */
export function formatQuantityNumber(quantity: number): string {
  const hasFraction = Math.abs(quantity % 1) > 1e-9;
  return quantity.toLocaleString(undefined, {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 3,
  });
}

/**
 * Naive English pluralisation of a unit name. Units are stored singular
 * ("Bottle", "Soda Crate", "Kilogram"), so appending "s" covers almost
 * everything; the sibilant rule keeps "Box" from becoming "Boxs".
 */
function plural(label: string): string {
  return /(s|x|z|ch|sh)$/i.test(label) ? `${label}es` : `${label}s`;
}

function pluralize(label: string, count: number): string {
  const name = count === 1 ? label : plural(label);
  return `${formatQuantityNumber(count)} ${name}`;
}

export interface DivisibleUnitInfo {
  baseUnitName: string;
  divisibleUnitRatio?: number | null;
  divisibleUnitName?: string | null;
  /**
   * Name the unit even when the stock has no divisible unit, so an
   * indivisible quantity reads "1,000.50 Kilograms" instead of a bare number.
   *
   * Off by default: several callers render the unit themselves alongside the
   * figure (the stock detail KPI tiles pass it to `KpiCard`'s own `unit`
   * slot), and turning this on for them would print the unit twice.
   */
  alwaysShowUnit?: boolean;
}

/**
 * Formats a base-unit quantity as "2 Bottles, 29 Tots" when the stock has a
 * divisible unit configured.
 *
 * Without one the quantity can't be split into whole things, so it renders as
 * a single figure — bare by default, or named ("1,000.50 Kilograms") when
 * {@link DivisibleUnitInfo.alwaysShowUnit} is set. Either way it goes through
 * {@link formatQuantityNumber}, so thousands separators are never missing.
 *
 * Negative values (e.g. a stock-take variance) are formatted from the
 * absolute magnitude with a single leading "-" on the whole string, not a
 * sign on each part (so "-1 Bottle, 2 Tots" means "short by 1 bottle and 2
 * tots", not "-1 Bottle, -2 Tots").
 */
export function formatDivisibleQuantity(
  quantity: number,
  {
    baseUnitName,
    divisibleUnitRatio,
    divisibleUnitName,
    alwaysShowUnit = false,
  }: DivisibleUnitInfo,
): string {
  if (!divisibleUnitRatio || !divisibleUnitName) {
    // Indivisible stock. The quantity keeps its fractional tail here rather
    // than being split into whole + sub units, so it is formatted directly
    // instead of going through `pluralize`, which counts whole things.
    if (!alwaysShowUnit || !baseUnitName) return formatQuantityNumber(quantity);
    const name = Math.abs(quantity) === 1 ? baseUnitName : plural(baseUnitName);
    return `${formatQuantityNumber(quantity)} ${name}`;
  }

  const isNegative = quantity < 0;
  const { whole, sub } = splitDivisibleQuantity(
    Math.abs(quantity),
    divisibleUnitRatio,
  );

  const parts: string[] = [];
  if (whole > 0 || sub === 0) parts.push(pluralize(baseUnitName, whole));
  if (sub > 0) parts.push(pluralize(divisibleUnitName, sub));

  return (isNegative ? "-" : "") + parts.join(", ");
}
