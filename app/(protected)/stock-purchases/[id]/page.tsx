import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { getLpo } from "@/lib/actions/lpo-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import {
  LPO_STATUS_LABELS,
  LPO_STATUS_TONES,
} from "@/types/lpo/type";
import { LpoStatusActions } from "@/components/widgets/lpo/status-actions";
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

export default async function LpoDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id === "new") notFound();

  const [lpo, suppliers] = await Promise.all([getLpo(id), fetchAllSuppliers()]);
  if (!lpo) notFound();

  const supplier = suppliers.find((s) => s.id === lpo.supplierId) ?? null;

  const lpoCurrency = lpo.currency || lpo.items[0]?.currency || DEFAULT_CURRENCY;
  const totalOrdered = lpo.items.reduce(
    (sum, item) => sum + Number(item.orderedQuantity || 0),
    0,
  );
  const totalReceived = lpo.items.reduce(
    (sum, item) => sum + Number(item.receivedQuantity || 0),
    0,
  );
  const totalOutstanding = Math.max(0, totalOrdered - totalReceived);
  const totalsByCurrency = lpo.items.reduce<Map<string, number>>((acc, item) => {
    const cur = (item.currency || lpoCurrency).toUpperCase();
    const line = Number(item.orderedQuantity || 0) * Number(item.unitCost || 0);
    acc.set(cur, (acc.get(cur) ?? 0) + line);
    return acc;
  }, new Map<string, number>());
  const hasMixedCurrency = totalsByCurrency.size > 1;

  const breadcrumbItems = [
    { title: "Purchase Orders", link: "/stock-purchases" },
    { title: lpo.lpoNumber, link: "" },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <BreadcrumbsNav items={breadcrumbItems} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{lpo.lpoNumber}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LPO_STATUS_TONES[lpo.status]}`}
              >
                {LPO_STATUS_LABELS[lpo.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {supplier?.name || "Unknown supplier"} · Created{" "}
              {formatDateTime(lpo.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Primary currency:</span>
              <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">
                {lpoCurrency}
              </span>
            </div>
            <LpoStatusActions lpo={lpo} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Meta label="Items" value={String(lpo.items.length)} />
          <Meta label="Ordered" value={totalOrdered.toLocaleString()} />
          <Meta
            label="Received"
            value={`${totalReceived.toLocaleString()} (${
              totalOrdered > 0
                ? Math.round((totalReceived / totalOrdered) * 100)
                : 0
            }%)`}
          />
          <Meta
            label="Outstanding"
            value={totalOutstanding.toLocaleString()}
            tone={totalOutstanding === 0 ? "positive" : "neutral"}
          />
        </div>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field
              label="Supplier"
              value={supplier?.name || "—"}
            />
            <Field
              label="Supplier contact"
              value={
                supplier
                  ? [supplier.phone, supplier.email]
                      .filter(Boolean)
                      .join(" · ") || "—"
                  : "—"
              }
            />
            <Field label="Location type" value={lpo.locationType} />
            <Field label="Last updated" value={formatDateTime(lpo.updatedAt)} />
          </CardContent>
        </Card>

        {/* ── Items ── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="px-2 sm:px-6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Items</h3>
              {hasMixedCurrency && (
                <span className="text-xs text-amber-700">
                  Lines span multiple currencies — conversion happens at GRN receive.
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Ordered</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Received</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Outstanding</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Unit Cost</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lpo.items.map((item) => {
                    const lineCurrency = item.currency || lpoCurrency;
                    const ordered = Number(item.orderedQuantity || 0);
                    const received = Number(item.receivedQuantity || 0);
                    const outstanding = Math.max(0, ordered - received);
                    const lineTotal = ordered * Number(item.unitCost || 0);
                    const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/40">
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {item.variantName || "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {ordered.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex flex-col items-end">
                            <span>{received.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground">{pct}%</span>
                          </div>
                        </td>
                        <td
                          className={`px-3 py-2 text-right ${
                            outstanding === 0
                              ? "text-green-700"
                              : outstanding === ordered
                                ? "text-muted-foreground"
                                : "text-amber-700"
                          }`}
                        >
                          {outstanding.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Money amount={Number(item.unitCost)} currency={lineCurrency} />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          <Money amount={lineTotal} currency={lineCurrency} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50/60 font-semibold">
                    <td className="px-3 py-2 text-right">Totals</td>
                    <td className="px-3 py-2 text-right">{totalOrdered.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{totalReceived.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{totalOutstanding.toLocaleString()}</td>
                    <td />
                    <td className="px-3 py-2 text-right">
                      {Array.from(totalsByCurrency.entries()).map(([cur, amt]) => (
                        <div key={cur} className="leading-tight">
                          <Money amount={amt} currency={cur} />
                        </div>
                      ))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <AttachmentsPanel
          entityType="LPO"
          entityId={lpo.id}
          description="Quotations, approval letters, supplier correspondence. Max 10 MB per file."
        />

        {lpo.notes && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{lpo.notes}</p>
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
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-green-700"
      : tone === "negative"
        ? "text-red-600"
        : "text-gray-900";
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="py-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className={`mt-1 text-base font-semibold ${toneClass}`}>{value}</p>
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
