import { notFound } from "next/navigation";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
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
import { RequisitionShareButton } from "@/components/widgets/requisition/share-dialog";
import { FileText, UserCheck, UserX, Boxes, Layers, DollarSign, AlertTriangle } from "lucide-react";

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

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Purchase Requisitions", href: "/purchase-requisitions" },
          { title: requisition.requisitionNumber },
        ]}
      />
      <PageHeader
        title={requisition.requisitionNumber}
        subtitle={
          <>
            Requested by {requisition.requestedByName || "—"} · Needed{" "}
            {formatDate(requisition.requiredByDate)}
            {requisition.convertedLpoId && (
              <>
                {" · "}
                <Link
                  href={`/purchase-orders/${requisition.convertedLpoId}`}
                  className="text-primary hover:underline"
                >
                  View LPO
                </Link>
              </>
            )}
          </>
        }
        titleAccessory={
          <span className="flex items-center gap-2">
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
          </span>
        }
        actions={
          <span className="flex items-center gap-2">
            <RequisitionShareButton requisition={requisition} />
            <RequisitionStatusActions requisition={requisition} />
          </span>
        }
      />
      <PageBody>
        <KpiStrip cols={4}>
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Items"
            value={requisition.items.length.toLocaleString()}
          />
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="Total quantity"
            value={totalQty.toLocaleString()}
          />
          <KpiCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Estimated value"
            value={totalEstimated.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            unit={currency}
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Without supplier"
            value={itemsWithoutSupplier.length.toLocaleString()}
            deltaTone={itemsWithoutSupplier.length > 0 ? "neg" : "pos"}
          />
        </KpiStrip>

        {(requisition.approvedAt || requisition.rejectedAt) && (
          <Card>
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

        <Card>
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
                            : <span className="text-muted-foreground">—</span>}
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
          <Card>
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
      </PageBody>
    </PageShell>
  );
}
