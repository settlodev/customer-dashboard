import { notFound } from "next/navigation";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { getSupplierReturn } from "@/lib/actions/supplier-return-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import {
  SUPPLIER_RETURN_STATUS_LABELS,
  SUPPLIER_RETURN_STATUS_TONES,
} from "@/types/supplier-return/type";
import { SupplierReturnStatusActions } from "@/components/widgets/supplier-return/status-actions";
import { AttachmentsPanel } from "@/components/widgets/attachments-panel";
import { FileText } from "lucide-react";

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

export default async function SupplierReturnDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  if (id === "new") notFound();

  const [supplierReturn, suppliers] = await Promise.all([
    getSupplierReturn(id),
    fetchAllSuppliers(),
  ]);
  if (!supplierReturn) notFound();

  const supplier = suppliers.find((s) => s.id === supplierReturn.supplierId) ?? null;

  const currency = supplierReturn.currency || DEFAULT_CURRENCY;
  const totalQty = supplierReturn.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const totalRefund = supplierReturn.items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.unitCost || 0),
    0,
  );
  const hasForeignLine = supplierReturn.items.some(
    (item) =>
      item.originalCurrency && item.originalCurrency !== (item.currency || currency),
  );

  const breadcrumbItems = [
    { title: "Supplier Returns", link: "/supplier-returns" },
    { title: supplierReturn.returnNumber, link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{supplierReturn.returnNumber}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SUPPLIER_RETURN_STATUS_TONES[supplierReturn.status]}`}
            >
              {SUPPLIER_RETURN_STATUS_LABELS[supplierReturn.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {supplier?.name || "Unknown supplier"}
            {supplierReturn.grnId && (
              <>
                {" · "}
                <Link
                  href={`/goods-received/${supplierReturn.grnId}`}
                  className="text-primary hover:underline"
                >
                  Linked GRN
                </Link>
              </>
            )}
          </p>
        </div>
        <SupplierReturnStatusActions supplierReturn={supplierReturn} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Meta label="Items" value={String(supplierReturn.items.length)} />
        <Meta label="Total quantity" value={totalQty.toLocaleString()} />
        <Meta
          label="Refund value"
          value={totalRefund.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          trailing={currency}
        />
        <Meta
          label="Dispatched"
          value={supplierReturn.returnDate ? formatDateTime(supplierReturn.returnDate) : "—"}
        />
      </div>

      {supplierReturn.reason && (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-400 uppercase">Reason</p>
            <p className="text-sm mt-1">{supplierReturn.reason}</p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl shadow-sm">
        <CardContent className="px-2 sm:px-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Items</h3>
            {hasForeignLine && (
              <span className="text-xs text-amber-700">
                Some lines were refunded in a foreign currency — converted at dispatch.
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Unit Cost</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Line Total</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {supplierReturn.items.map((item) => {
                  const lineCurrency = item.currency || currency;
                  const isForeign =
                    item.originalCurrency &&
                    item.originalCurrency !== lineCurrency;
                  const total =
                    Number(item.quantity || 0) * Number(item.unitCost || 0);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/40">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {item.stockVariantDisplayName || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {Number(item.quantity).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.unitCost != null ? (
                          <Money amount={Number(item.unitCost)} currency={lineCurrency} />
                        ) : (
                          "—"
                        )}
                        {isForeign && item.originalUnitCost != null && (
                          <div className="text-[10px] text-muted-foreground">
                            {Number(item.originalUnitCost).toLocaleString()}{" "}
                            {item.originalCurrency}
                            {item.rateUsed != null &&
                              Number(item.rateUsed) !== 1 && (
                                <>
                                  {" "}
                                  @ {Number(item.rateUsed).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                </>
                              )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {item.unitCost != null ? (
                          <Money amount={total} currency={lineCurrency} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {item.reason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AttachmentsPanel
        entityType="SUPPLIER_RETURN"
        entityId={supplierReturn.id}
        description="Credit notes, dispatch photos, damage evidence. Max 10 MB per file."
      />

      {supplierReturn.notes && (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{supplierReturn.notes}</p>
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
