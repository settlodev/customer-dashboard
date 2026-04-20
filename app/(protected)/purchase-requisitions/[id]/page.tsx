import { notFound } from "next/navigation";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { getRequisition } from "@/lib/actions/requisition-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import {
  REQUISITION_STATUS_LABELS,
  REQUISITION_STATUS_TONES,
  PRIORITY_LABELS,
  PRIORITY_TONES,
} from "@/types/requisition/type";
import { RequisitionStatusActions } from "@/components/widgets/requisition/status-actions";
import { FileText, UserCheck, UserX } from "lucide-react";

type Params = Promise<{ id: string }>;

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default async function RequisitionDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id === "new") notFound();

  const [requisition, suppliers] = await Promise.all([
    getRequisition(id),
    fetchAllSuppliers(),
  ]);
  if (!requisition) notFound();

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));
  const currency = requisition.currency || DEFAULT_CURRENCY;

  const totalQty = requisition.items.reduce(
    (sum, item) => sum + Number(item.requestedQuantity || 0),
    0,
  );
  const totalEstimated = requisition.items.reduce(
    (sum, item) =>
      sum + Number(item.requestedQuantity || 0) * Number(item.estimatedUnitCost || 0),
    0,
  );
  const itemsWithoutSupplier = requisition.items.filter(
    (i) => !i.preferredSupplierId,
  );

  const breadcrumbItems = [
    { title: "Purchase Requisitions", link: "/purchase-requisitions" },
    { title: requisition.requisitionNumber, link: "" },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <BreadcrumbsNav items={breadcrumbItems} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{requisition.requisitionNumber}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${REQUISITION_STATUS_TONES[requisition.status]}`}
              >
                {REQUISITION_STATUS_LABELS[requisition.status]}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_TONES[requisition.priority]}`}
              >
                {PRIORITY_LABELS[requisition.priority]} priority
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Requested by {requisition.requestedByName || "—"} ·{" "}
              Needed {formatDate(requisition.requiredByDate)}
              {requisition.convertedLpoId && (
                <>
                  {" · "}
                  <Link
                    href={`/stock-purchases/${requisition.convertedLpoId}`}
                    className="text-primary hover:underline"
                  >
                    View LPO
                  </Link>
                </>
              )}
            </p>
          </div>
          <RequisitionStatusActions requisition={requisition} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Meta label="Items" value={String(requisition.items.length)} />
          <Meta label="Total quantity" value={totalQty.toLocaleString()} />
          <Meta
            label="Estimated value"
            value={totalEstimated.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            trailing={currency}
          />
          <Meta
            label="Without supplier"
            value={String(itemsWithoutSupplier.length)}
            tone={itemsWithoutSupplier.length > 0 ? "warn" : "good"}
          />
        </div>

        {(requisition.approvedAt || requisition.rejectedAt) && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="pt-4 pb-4 flex flex-wrap items-start gap-6 text-sm">
              {requisition.approvedAt && (
                <div className="flex items-start gap-2">
                  <UserCheck className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">Approved</p>
                    <p className="font-medium">
                      {requisition.approvedByName || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(requisition.approvedAt)}
                    </p>
                  </div>
                </div>
              )}
              {requisition.rejectedAt && (
                <div className="flex items-start gap-2">
                  <UserX className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">Rejected</p>
                    <p className="font-medium">
                      {requisition.rejectedByName || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(requisition.rejectedAt)}
                    </p>
                    {requisition.rejectionReason && (
                      <p className="text-xs mt-1 text-red-700">
                        &ldquo;{requisition.rejectionReason}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-xl shadow-sm">
          <CardContent className="px-2 sm:px-6 pt-6">
            <h3 className="text-lg font-medium mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Est. Cost</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Est. Line Total</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Preferred supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requisition.items.map((item) => {
                    const lineCurrency = item.currency || currency;
                    const lineTotal =
                      Number(item.requestedQuantity || 0) *
                      Number(item.estimatedUnitCost || 0);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/40">
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {item.stockVariantDisplayName || "—"}
                          {item.notes && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(item.requestedQuantity).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {item.estimatedUnitCost != null ? (
                            <Money
                              amount={Number(item.estimatedUnitCost)}
                              currency={lineCurrency}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {item.estimatedUnitCost != null ? (
                            <Money amount={lineTotal} currency={lineCurrency} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {item.preferredSupplierId
                            ? supplierMap[item.preferredSupplierId] || "Unknown"
                            : (
                                <span className="text-amber-700">
                                  Unassigned (won&apos;t convert)
                                </span>
                              )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {requisition.notes && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{requisition.notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  trailing,
  tone = "neutral",
}: {
  label: string;
  value: string;
  trailing?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-green-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-gray-900";
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="py-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className={`mt-1 text-base font-semibold ${toneClass}`}>
          {value}
          {trailing && (
            <span className="ml-1 text-xs text-muted-foreground font-medium">
              {trailing}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
