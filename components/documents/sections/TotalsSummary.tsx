import { DocumentTotals } from "../types";
import { formatCurrency, formatLongDate } from "../utils/format";

interface TotalsSummaryProps {
  totals: DocumentTotals;
  currency: string;
}

export function TotalsSummary({ totals, currency }: TotalsSummaryProps) {
  return (
    <section className="flex justify-end px-10 py-6">
      <div className="w-full max-w-sm text-xs">
        <Row label="Subtotal:" value={formatCurrency(totals.subtotal, currency)} />

        {totals.discount && (
          <Row
            label={totals.discount.label}
            value={`-${formatCurrency(totals.discount.amount, currency)}`}
          />
        )}

        {totals.taxes?.map((tax, idx) => (
          <Row
            key={idx}
            label={`${tax.label} ${tax.rate}%:`}
            value={formatCurrency(tax.amount, currency)}
          />
        ))}

        {typeof totals.shipping === "number" && totals.shipping > 0 && (
          <Row
            label="Shipping:"
            value={formatCurrency(totals.shipping, currency)}
          />
        )}

        <div className="mt-2 border-t border-slate-200 pt-2">
          <Row
            label="Total:"
            value={formatCurrency(totals.total, currency)}
            bold
          />
        </div>

        {totals.payments?.map((payment, idx) => (
          <div key={idx} className="text-slate-600">
            <Row
              label={`Payment on ${formatLongDate(payment.date)} using ${payment.method}:`}
              value={formatCurrency(payment.amount, currency)}
            />
          </div>
        ))}

        <div className="mt-2 border-t border-slate-200 pt-3">
          <Row
            label={`Amount Due (${currency}):`}
            value={formatCurrency(totals.amountDue, currency)}
            bold
            large
          />
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  bold,
  large,
}: {
  label: string;
  value: string;
  bold?: boolean;
  large?: boolean;
}) {
  const baseSize = large ? "text-sm" : "text-xs";
  const weight = bold ? "font-medium text-slate-900" : "text-slate-700";
  return (
    <div className={`flex items-center justify-between py-1 ${baseSize} ${weight}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
