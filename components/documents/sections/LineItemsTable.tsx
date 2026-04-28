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
}

export function LineItemsTable({
  items,
  currency,
  headerClassName = "bg-blue-700",
  headerStyle,
}: LineItemsTableProps) {
  // Drop the default Tailwind bg when an inline style is provided so the
  // tenant colour wins; keep text-white for legibility on saturated brands.
  const headerCls = headerStyle ? "" : headerClassName;
  return (
    <section className="px-10">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className={`${headerCls} text-white`} style={headerStyle}>
            <th className="px-4 py-3 text-left font-medium">Items</th>
            <th className="w-24 px-4 py-3 text-right font-medium">Quantity</th>
            <th className="w-28 px-4 py-3 text-right font-medium">Price</th>
            <th className="w-28 px-4 py-3 text-right font-medium">Amount</th>
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
                <td className="px-4 py-3.5 text-right text-slate-700">
                  {formatCurrency(item.unitPrice, currency)}
                </td>
                <td className="px-4 py-3.5 text-right text-slate-900">
                  {formatCurrency(amount, currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
