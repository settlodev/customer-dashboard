import { notFound } from "next/navigation";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { getGrn, getLandedCosts } from "@/lib/actions/grn-actions";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import {
  GRN_STATUS_LABELS,
  GRN_STATUS_TONES,
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_TONES,
} from "@/types/grn/type";
import { GrnStatusActions } from "@/components/widgets/grn/status-actions";
import { InspectionPanel } from "@/components/widgets/grn/inspection-panel";
import { LandedCostsPanel } from "@/components/widgets/grn/landed-costs-panel";
import { AttachmentsPanel } from "@/components/widgets/attachments-panel";
import { FileText } from "lucide-react";

type Params = Promise<{ id: string }>;

const formatDate = (iso: string | null | undefined) => {
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

const formatOnlyDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default async function GrnDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id === "new") notFound();

  const [grn, config] = await Promise.all([getGrn(id), getLocationConfig()]);
  if (!grn) notFound();

  const landedCostsEnabled = config?.landedCostTrackingEnabled ?? false;
  const qualityInspectionEnabled = config?.qualityInspectionEnabled ?? false;

  // Keep already-existing costs visible even if the feature was turned off
  // later; only new-adds are gated by the flag.
  const costs = await getLandedCosts(id);

  const currency = grn.currency || grn.items?.[0]?.currency || DEFAULT_CURRENCY;
  const totalQty = grn.items.reduce(
    (sum, item) => sum + Number(item.receivedQuantity || 0),
    0,
  );
  const itemsTotal = grn.items.reduce(
    (sum, item) =>
      sum + Number(item.receivedQuantity || 0) * Number(item.unitCost || 0),
    0,
  );
  const landedTotal = costs.reduce(
    (sum, cost) => sum + Number(cost.amount || 0),
    0,
  );
  const grandTotal = itemsTotal + landedTotal;
  const hasForeignLine = grn.items.some(
    (item) =>
      item.originalCurrency && item.originalCurrency !== (item.currency || currency),
  );

  const breadcrumbItems = [
    { title: "Goods Received", link: "/goods-received" },
    { title: grn.grnNumber, link: "" },
  ];

  const inspectionActive =
    grn.status === "INSPECTION_HOLD" && qualityInspectionEnabled;
  const landedCostsLocked = grn.status === "CANCELLED" || !landedCostsEnabled;
  const showLandedCostsPanel = landedCostsEnabled || costs.length > 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{grn.grnNumber}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${GRN_STATUS_TONES[grn.status]}`}
            >
              {GRN_STATUS_LABELS[grn.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {grn.supplierName || "Unknown supplier"} · Received{" "}
            {formatOnlyDate(grn.receivedDate)}
            {grn.lpoId && (
              <>
                {" · "}
                <Link
                  href={`/purchase-orders/${grn.lpoId}`}
                  className="text-primary hover:underline"
                >
                  View LPO
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Currency:</span>
            <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">
              {currency}
            </span>
          </div>
          <GrnStatusActions grn={grn} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Meta label="Items" value={String(grn.items.length)} />
        <Meta
          label="Total quantity"
          value={totalQty.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        />
        <Meta
          label="Line value"
          value={itemsTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          trailing={currency}
        />
        <Meta
          label="Landed cost"
          value={landedTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          trailing={currency}
        />
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Field label="Received by" value={grn.receivedByName || "—"} />
          <Field label="Location" value={grn.locationName || "—"} />
          <Field label="Delivery person" value={grn.deliveryPersonName || "—"} />
          <Field
            label="Delivery contact"
            value={
              grn.deliveryPersonPhone || grn.deliveryPersonEmail
                ? [grn.deliveryPersonPhone, grn.deliveryPersonEmail]
                    .filter(Boolean)
                    .join(" · ")
                : "—"
            }
          />
          <Field label="Created" value={formatDate(grn.createdAt)} />
          <Field label="Last updated" value={formatDate(grn.updatedAt)} />
        </CardContent>
      </Card>

      {/* ── Items ── */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="px-2 sm:px-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Items</h3>
            {hasForeignLine && (
              <span className="text-xs text-amber-700">
                Some lines were invoiced in a foreign currency — converted at
                receive time.
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Batch</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Expiry</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Unit Cost</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Line Total</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grn.items.map((item) => {
                  const lineCurrency = item.currency || currency;
                  const isForeign =
                    item.originalCurrency &&
                    item.originalCurrency !== lineCurrency;
                  const total =
                    Number(item.receivedQuantity || 0) * Number(item.unitCost || 0);
                  const status = item.inspectionStatus ?? null;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/40">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {item.variantName}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                          <span className="font-mono">
                            {item.batchNumber || "—"}
                          </span>
                          {item.supplierBatchReference && (
                            <div className="text-[10px]">
                              Supplier ref: {item.supplierBatchReference}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatOnlyDate(item.expiryDate)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {Number(item.receivedQuantity).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Money amount={Number(item.unitCost)} currency={lineCurrency} />
                        {isForeign && item.originalUnitCost != null && (
                          <div className="text-[10px] text-muted-foreground">
                            {Number(item.originalUnitCost).toLocaleString()}{" "}
                            {item.originalCurrency}
                            {item.rateUsed != null &&
                              Number(item.rateUsed) !== 1 && (
                                <> @ {Number(item.rateUsed).toLocaleString(undefined, { maximumFractionDigits: 6 })}</>
                              )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        <Money amount={total} currency={lineCurrency} />
                      </td>
                      <td className="px-3 py-2">
                        {status ? (
                          <>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${INSPECTION_STATUS_TONES[status]}`}
                            >
                              {INSPECTION_STATUS_LABELS[status]}
                            </span>
                            {status === "PARTIAL" && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {Number(item.inspectedQuantity ?? 0).toLocaleString()} inspected
                                {" · "}
                                {Number(item.rejectedQuantity ?? 0).toLocaleString()} rejected
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/60 font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right">
                    Totals
                  </td>
                  <td className="px-3 py-2 text-right">
                    {totalQty.toLocaleString()}
                  </td>
                  <td />
                  <td className="px-3 py-2 text-right">
                    <Money amount={itemsTotal} currency={currency} />
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {inspectionActive && (
        <InspectionPanel grnId={grn.id} items={grn.items} />
      )}

      {showLandedCostsPanel && (
        <LandedCostsPanel
          grnId={grn.id}
          costs={costs}
          currency={currency}
          disabled={landedCostsLocked}
        />
      )}

      {costs.length > 0 && (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Grand total (items + landed)
            </span>
            <span className="font-mono text-base font-semibold">
              <Money amount={grandTotal} currency={currency} />
            </span>
          </CardContent>
        </Card>
      )}

      <AttachmentsPanel
        entityType="GRN"
        entityId={grn.id}
        description="Delivery notes, invoice scans, inspection photos. Max 10 MB per file."
      />

      {grn.notes && (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{grn.notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Meta({
  label,
  value,
  trailing,
}: {
  label: string;
  value: string;
  trailing?: string;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="py-4">
        <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-500">
          {label}
        </p>
        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
          {value}
          {trailing && (
            <span className="ml-1 text-sm text-muted-foreground font-semibold">
              {trailing}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

