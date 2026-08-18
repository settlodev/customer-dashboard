import type { NormalBalance } from "@/types/accounting-mapping/type";

export interface OpeningBalancePreviewLine {
  normalBalance: NormalBalance;
  amount: number;
}

export interface OpeningBalanceResidual {
  amount: number; // positive magnitude of the equity plug
  side: "DEBIT" | "CREDIT";
}

/**
 * Mirrors the backend residual logic. Each line posts on its natural side
 * (debit for a DEBIT-normal account, credit for a CREDIT-normal one) when the
 * amount is >= 0, and flips when the amount is negative (contra balance). The
 * Opening Balance Equity plug closes the debit/credit gap. Returns null when
 * the entered lines already balance (no plug needed). Zero / non-finite
 * amounts are ignored.
 */
export function computeOpeningBalanceResidual(
  lines: OpeningBalancePreviewLine[],
): OpeningBalanceResidual | null {
  let debits = 0;
  let credits = 0;
  for (const line of lines) {
    if (!Number.isFinite(line.amount) || line.amount === 0) continue;
    const debitNormal = line.normalBalance === "DEBIT";
    const postDebit = debitNormal === (line.amount >= 0);
    const magnitude = Math.abs(line.amount);
    if (postDebit) debits += magnitude;
    else credits += magnitude;
  }
  const residual = debits - credits;
  // Money tolerance: floating-point sums can leave a sub-cent residual on
  // inputs that balance exactly in decimal (e.g. 0.10 + 0.20), so treat
  // anything under half a cent as balanced. The backend uses exact BigDecimal
  // and stays authoritative; this only drives the client-side preview.
  if (Math.abs(residual) < 0.005) return null;
  const magnitude = Math.round(Math.abs(residual) * 100) / 100;
  return residual > 0
    ? { amount: magnitude, side: "CREDIT" }
    : { amount: magnitude, side: "DEBIT" };
}
