import { notFound } from "next/navigation";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { compareRfqQuotes, getRfq } from "@/lib/actions/rfq-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import {
  RFQ_STATUS_LABELS,
  RFQ_STATUS_TONES,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TONES,
  canSubmitQuote,
} from "@/types/rfq/type";
import { RfqStatusActions } from "@/components/widgets/rfq/status-actions";
import { SubmitQuoteDialog } from "@/components/widgets/rfq/submit-quote-dialog";
import { QuoteComparisonTable } from "@/components/widgets/rfq/comparison-table";
import { FileText, Trophy } from "lucide-react";

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

export default async function RfqDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id === "new") notFound();

  const [rfq, suppliers, comparison] = await Promise.all([
    getRfq(id),
    fetchAllSuppliers(),
    compareRfqQuotes(id),
  ]);
  if (!rfq) notFound();

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));
  const quoteCurrency = rfq.targetCurrency || rfq.currency || DEFAULT_CURRENCY;

  const totalRequestedQty = rfq.items.reduce(
    (sum, item) => sum + Number(item.requestedQuantity || 0),
    0,
  );
  const targetBudget = rfq.items.reduce(
    (sum, item) =>
      sum + Number(item.requestedQuantity || 0) * Number(item.targetUnitPrice || 0),
    0,
  );
  const submittedQuotes = rfq.quotes.filter((q) => q.status !== "PENDING").length;
  const awardedQuote = rfq.quotes.find((q) => q.isAwarded) ?? null;
  const awardedSupplierName = awardedQuote
    ? supplierMap[awardedQuote.supplierId] ?? "—"
    : null;

  const breadcrumbItems = [
    { title: "Requests for Quotation", link: "/rfqs" },
    { title: rfq.rfqNumber, link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{rfq.rfqNumber}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RFQ_STATUS_TONES[rfq.status]}`}
            >
              {RFQ_STATUS_LABELS[rfq.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {rfq.title} · Created {formatDateTime(rfq.createdAt)}
            {rfq.convertedLpoId && (
              <>
                {" · "}
                <Link
                  href={`/purchase-orders/${rfq.convertedLpoId}`}
                  className="text-primary hover:underline"
                >
                  View LPO
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canSubmitQuote(rfq.status) && <SubmitQuoteDialog rfq={rfq} />}
          <RfqStatusActions rfq={rfq} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Meta label="Items" value={String(rfq.items.length)} />
        <Meta label="Requested qty" value={totalRequestedQty.toLocaleString()} />
        <Meta
          label="Quotes"
          value={`${submittedQuotes} / ${rfq.quotes.length}`}
        />
        <Meta
          label="Target budget"
          value={targetBudget.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          trailing={quoteCurrency}
        />
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Field label="Quote currency" value={quoteCurrency} />
          <Field
            label="Submission deadline"
            value={formatDateTime(rfq.submissionDeadline)}
          />
          <Field label="Needed by" value={formatDate(rfq.requiredByDate)} />
          <Field label="Created by" value={rfq.createdByName || "—"} />
          {rfq.sentAt && (
            <Field label="Sent" value={formatDateTime(rfq.sentAt)} />
          )}
          {rfq.evaluatedAt && (
            <Field
              label="Evaluated"
              value={`${rfq.evaluatedByName || "—"} · ${formatDateTime(rfq.evaluatedAt)}`}
            />
          )}
          {rfq.awardedAt && (
            <Field
              label="Awarded"
              value={`${awardedSupplierName || "—"} · ${formatDateTime(rfq.awardedAt)}`}
            />
          )}
        </CardContent>
      </Card>

      {awardedQuote && (
        <Card className="rounded-xl shadow-sm bg-green-50/30 border-green-200">
          <CardContent className="pt-4 pb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-700" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-green-800">
                  Awarded quote
                </p>
                <p className="font-semibold">
                  {awardedSupplierName}
                  {awardedQuote.leadTimeDays != null && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      {awardedQuote.leadTimeDays} day lead time
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="font-mono font-semibold">
                <Money
                  amount={Number(awardedQuote.totalAmount ?? 0)}
                  currency={awardedQuote.currency || quoteCurrency}
                />
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── RFQ line items (what was asked for) ── */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="px-2 sm:px-6 pt-6">
          <h3 className="text-lg font-medium mb-4">Items requested</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Target price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Specifications</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rfq.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {item.stockVariantDisplayName || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(item.requestedQuantity).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.targetUnitPrice != null ? (
                        <Money amount={Number(item.targetUnitPrice)} currency={quoteCurrency} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {item.specifications || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Quotes summary ── */}
      {rfq.quotes.length > 0 && (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="px-2 sm:px-6 pt-6">
            <h3 className="text-lg font-medium mb-4">Supplier quotes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Supplier</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Lead time</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Valid until</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Payment terms</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rfq.quotes.map((quote) => {
                    const lineTotal = quote.items.reduce(
                      (sum, i) =>
                        sum + Number(i.quotedUnitPrice || 0) * Number(i.quotedQuantity || 0),
                      0,
                    );
                    return (
                      <tr key={quote.id} className={quote.isAwarded ? "bg-green-50/30" : undefined}>
                        <td className="px-3 py-2 font-medium">
                          {supplierMap[quote.supplierId] || quote.supplierId.slice(0, 8)}
                          {quote.isAwarded && (
                            <span className="ml-2 inline-flex items-center text-[10px] bg-green-100 text-green-700 rounded px-1 py-0.5">
                              <Trophy className="h-3 w-3 mr-0.5" /> winner
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${QUOTE_STATUS_TONES[quote.status]}`}
                          >
                            {QUOTE_STATUS_LABELS[quote.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                          {quote.leadTimeDays != null
                            ? `${quote.leadTimeDays}d`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {formatDate(quote.validityDate)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {quote.paymentTerms || "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          <Money
                            amount={Number(quote.totalAmount ?? lineTotal)}
                            currency={quote.currency || quoteCurrency}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Comparison ── */}
      <QuoteComparisonTable
        rfq={rfq}
        comparison={comparison}
        supplierMap={supplierMap}
      />

      {rfq.notes && (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{rfq.notes}</p>
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
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="mt-1 text-base font-semibold">
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
