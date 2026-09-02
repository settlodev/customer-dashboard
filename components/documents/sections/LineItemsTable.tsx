import { LineItem } from "../types";
import { computeLineAmount, formatCurrency } from "../utils/format";

interface LineItemsTableProps {
  items: LineItem[];
  currency: string;
  /**
   * Brand colour for the table header. Defaults to a clean blue matching the
   * reference. Pass a Tailwind background utility to override per-tenant.
   * Ignored when {@link headerStyle} is set.
   */
  headerClassName?: string;
  /**
   * Inline header styles. Use this for dynamic per-tenant hex colours that
   * Tailwind's JIT cannot pre-compile (e.g. {@code { backgroundColor: '#ED7B40' }}).
   * When set, takes precedence over {@link headerClassName}.
   */
  headerStyle?: React.CSSProperties;
  /** Quantities-only documents (delivery notes): drop the Price/Amount columns. */
  hideAmounts?: boolean;
}

export function LineItemsTable({
  items,
  currency,
  headerClassName = "bg-blue-700",
  headerStyle,
  hideAmounts,
}: LineItemsTableProps) {
  // Drop the default Tailwind bg when an inline style is provided so the
  // tenant colour wins; keep text-white for legibility on saturated brands.
  const headerCls = headerStyle ? "" : headerClassName;
  // A Tax column only makes sense once amounts are shown, and only for
  // document types that actually populate per-line tax (GRN/LPO today).
  // Other document types simply never set `taxAmount`, so the column stays
  // hidden for them without any extra wiring.
  const showTax = !hideAmounts && items.some((item) => item.taxAmount != null);
  return (
    <section className="px-4 sm:px-10">
      {/* On narrow viewports (this document is viewed directly on phones via
          share links, not just printed) the fixed-width Qty/Price/Amount/Tax
          columns don't have room to sit next to a wrapping item name — let
          the table scroll horizontally instead of squeezing every column
          into an unreadable sliver. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-xs">
          <thead>
            <tr className={`${headerCls} text-white`} style={headerStyle}>
              <th className="px-4 py-3 text-left font-medium">Items</th>
              <th className="w-24 px-4 py-3 text-right font-medium">Quantity</th>
              {!hideAmounts && (
                <>
                  <th className="w-28 px-4 py-3 text-right font-medium">Price</th>
                  <th className="w-28 px-4 py-3 text-right font-medium">Amount</th>
                  {showTax && (
                    <th className="w-24 px-4 py-3 text-right font-medium">Tax</th>
                  )}
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const amount =
                item.amount ?? computeLineAmount(item.quantity, item.unitPrice);
              return (
                <tr key={idx} className="border-b border-slate-200 align-top">
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    {item.description && (
                      <div className="mt-0.5 whitespace-pre-line text-slate-500">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-700">
                    {item.quantity}
                    {item.unitOfMeasure ? ` ${item.unitOfMeasure}` : ""}
                  </td>
                  {!hideAmounts && (
                    <>
                      <td className="px-4 py-3.5 text-right text-slate-700">
                        {formatCurrency(item.unitPrice, currency)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-900">
                        {formatCurrency(amount, currency)}
                      </td>
                      {showTax && (
                        <td className="px-4 py-3.5 text-right text-slate-700">
                          {formatCurrency(item.taxAmount ?? 0, currency)}
                          {item.taxRatePercent != null && (
                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {item.taxRatePercent}%
                            </div>
                          )}
                        </td>
                      )}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
