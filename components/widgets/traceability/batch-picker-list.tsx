import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
  StockBatchSummary,
} from "@/types/traceability/type";

/**
 * Shown when a URL-typed batch number matches more than one row — typically
 * the same number held at multiple locations. Lets the user pick which one
 * they wanted without us guessing.
 */
export function BatchPickerList({
  batchNumber,
  batches,
  totalElements,
}: {
  batchNumber: string;
  batches: StockBatchSummary[];
  totalElements: number;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-3">
        <div>
          <h3 className="text-lg font-medium">
            {batches.length} batch row{batches.length === 1 ? "" : "s"}
            {totalElements > batches.length ? ` of ${totalElements}` : ""} matching
            &ldquo;<span className="font-mono">{batchNumber}</span>&rdquo;
          </h3>
          <p className="text-xs text-muted-foreground">
            A batch number can exist at more than one location. Pick the
            specific row you need.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/60">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                  Batch
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                  Variant
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                  Location
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                  On hand
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                  Unit cost
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                  Expiry
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/60">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link
                      href={`/stock-batches/${b.id}`}
                      className="hover:underline"
                    >
                      {b.batchNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {b.stockVariantDisplayName || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <Link
                      href={`/locations/${b.locationId}`}
                      className="font-mono text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {b.locationId.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(b.quantityOnHand ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {b.unitCost != null ? (
                      <Money
                        amount={Number(b.unitCost)}
                        currency={b.currency || DEFAULT_CURRENCY}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {b.expiryDate
                      ? new Date(b.expiryDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BATCH_STATUS_TONES[b.status]}`}
                    >
                      {BATCH_STATUS_LABELS[b.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
