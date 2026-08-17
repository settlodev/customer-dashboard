import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import {
  PanelCard,
  RailCard,
  StatusPill,
  VList,
  VRow,
  DetailTable,
  DetailTableHead,
  DetailTh,
  DetailTableBody,
  DetailTd,
  DetailTableTotals,
  type Tone,
} from "@/components/layouts/order-detail";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { getLpo } from "@/lib/actions/lpo-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import { effectiveLpoStatus, type Lpo } from "@/types/lpo/type";
import { LpoStatusActions } from "@/components/widgets/lpo/status-actions";
import { LpoShareButton } from "@/components/widgets/lpo/share-dialog";
import { LpoShareAcknowledgement } from "@/components/widgets/lpo/share-acknowledgement";
import { FinancingCard } from "@/components/widgets/lpo/financing-card";
import { FinancingBanner } from "@/components/widgets/lpo/financing-banner";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { getLoanAccess } from "@/lib/loans/access";
import {
  getMyApplication,
  getFinancingTerms,
} from "@/lib/actions/loan-applications-actions";
import type { LoanApplication } from "@/types/loans/applications";
import { AttachmentsPanel } from "@/components/widgets/attachments-panel";
import {
  FileText,
  Layers,
  Boxes,
  PackageCheck,
  AlertCircle,
  Building2,
  Coins,
  Package,
} from "lucide-react";

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

// Maps the LPO's internal status (plus the supplier-acknowledgement override
// `effectiveLpoStatus` already applies for its label) onto the shared
// `StatusPill` tone vocabulary. Kept local — it's LPO-specific, not a
// generic order-detail concern.
function lpoStatusTone(lpo: Lpo): Tone {
  if (lpo.status === "APPROVED" && lpo.supplierAcknowledgement === "PENDING") {
    return "warn";
  }
  if (lpo.status === "CANCELLED" && lpo.supplierAcknowledgement === "REJECTED") {
    return "neg";
  }
  switch (lpo.status) {
    case "DRAFT":
      return "muted";
    case "SUBMITTED":
    case "APPROVED":
      return "info";
    case "PARTIALLY_RECEIVED":
      return "warn";
    case "RECEIVED":
      return "pos";
    case "CANCELLED":
      return "neg";
    default:
      return "muted";
  }
}

export default async function LpoDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id === "new") notFound();

  const [lpo, suppliers] = await Promise.all([getLpo(id), fetchAllSuppliers()]);
  if (!lpo) notFound();

  const supplier = suppliers.find((s) => s.id === lpo.supplierId) ?? null;

  // ── Financing gating + context (spec §7) ─────────────────────────
  // Banner + modal render only for viewers with the loans module enabled
  // AND loans:read. The application (when one exists) is read here so the
  // banner renders in-progress / offer-ready / declined states without a
  // client round-trip; a transient LMS failure degrades to null (the banner
  // then shows honest in-progress off financingStatus alone).
  const loanAccess = LOANS_ENABLED ? await getLoanAccess() : null;
  const showFinancing = Boolean(LOANS_ENABLED && loanAccess?.canRead);
  const application: LoanApplication | null =
    showFinancing && lpo.loanApplicationId
      ? await getMyApplication(lpo.loanApplicationId).catch(() => null)
      : null;
  // Terms acceptance drives the "Terms accepted" tracker stage on the
  // financing card; only worth a call once the LPO is actually financed.
  // Best-effort like `application` above — financing is secondary content on
  // this page and a transient LMS failure here must never take down the
  // primary purchase-order view.
  const financingTerms =
    showFinancing && lpo.paymentMethod === "SETTLO_FINANCING"
      ? await getFinancingTerms().catch(() => null)
      : null;

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
  const itemsTotal = lpo.items.reduce(
    (sum, item) => sum + Number(item.orderedQuantity || 0) * Number(item.unitCost || 0),
    0,
  );

  // Server-authoritative tax breakdown, same approach as the GRN detail
  // page. `lpo.netAmount`/`totalAmount` are trusted as-is; `itemsTotal`
  // above is kept only as a defensive fallback for an LPO payload that
  // predates these fields. Deliberately NOT reading `lpo.taxAmount` for
  // display: it sums recoverable lines only, so it is always 0 for a
  // non-VAT-registered business — the per-line sum below is the full tax
  // regardless of recoverability, which is what the memo figure needs.
  const netAmount = lpo.netAmount ?? itemsTotal;
  const totalAmount = lpo.totalAmount ?? netAmount;
  const lineTaxTotal = lpo.items.reduce(
    (sum, item) => sum + Number(item.taxAmount || 0),
    0,
  );
  // Recoverable is uniform across a document (it's the business's VAT
  // status at write time, not a per-line choice) — any line answers for all.
  const taxRecoverable = lpo.items.some((item) => item.taxRecoverable === true);
  const subtotal = taxRecoverable ? netAmount : totalAmount;

  const statusInfo = effectiveLpoStatus(lpo.status, lpo.supplierAcknowledgement);

  // KpiStrip's "Order value" tile — a single figure in the common case, or
  // every currency's subtotal stacked when the LPO's lines are mixed (same
  // per-currency data the items table's totals row uses).
  const orderValueNode = hasMixedCurrency ? (
    <span className="inline-flex flex-col items-end gap-0.5 text-[15px] leading-tight">
      {Array.from(totalsByCurrency.entries()).map(([cur, amt]) => (
        <span key={cur}>
          {amt.toLocaleString()}{" "}
          <span className="font-mono text-[10px] font-normal text-muted-foreground">
            {cur}
          </span>
        </span>
      ))}
    </span>
  ) : (
    (Array.from(totalsByCurrency.values())[0] ?? 0).toLocaleString()
  );

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Purchase Orders", href: "/purchase-orders" },
          { title: lpo.lpoNumber },
        ]}
      />
      <PageHeader
        title={lpo.lpoNumber}
        subtitle={`${supplier?.name || "Unknown supplier"} · Created ${formatDateTime(lpo.createdAt)} · ${lpoCurrency}`}
        titleAccessory={
          <span className="flex items-center gap-2">
            <StatusPill tone={lpoStatusTone(lpo)} dot>
              {statusInfo.label}
            </StatusPill>
            {lpo.paymentMethod === "SETTLO_FINANCING" && (
              <StatusPill tone="info">Settlo financed</StatusPill>
            )}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LpoShareButton lpo={lpo} />
            <LpoStatusActions lpo={lpo} />
          </div>
        }
      />
      <PageBody>
        {showFinancing && (
          <FinancingBanner
            lpo={lpo}
            application={application}
            canApply={loanAccess?.canApply ?? false}
          />
        )}

        <KpiStrip cols={5}>
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Items"
            value={lpo.items.length.toLocaleString()}
          />
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="Ordered"
            value={totalOrdered.toLocaleString()}
          />
          <KpiCard
            icon={<PackageCheck className="h-3 w-3" />}
            label="Received"
            value={`${totalReceived.toLocaleString()} (${
              totalOrdered > 0
                ? Math.round((totalReceived / totalOrdered) * 100)
                : 0
            }%)`}
          />
          <KpiCard
            icon={<AlertCircle className="h-3 w-3" />}
            label="Outstanding"
            value={totalOutstanding.toLocaleString()}
            deltaTone={totalOutstanding === 0 ? "pos" : "neutral"}
          />
          <KpiCard
            icon={<Coins className="h-3 w-3" />}
            label="Order value"
            value={orderValueNode}
            unit={!hasMixedCurrency ? lpoCurrency : undefined}
          />
        </KpiStrip>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
            <RailCard icon={<Building2 className="h-3.5 w-3.5" />} title="Supplier">
              <VList>
                <VRow label="Supplier" value={supplier?.name || "—"} />
                <VRow
                  label="Contact"
                  value={
                    supplier
                      ? [supplier.phone, supplier.email].filter(Boolean).join(" · ") ||
                        "—"
                      : "—"
                  }
                />
                <VRow label="Location type" value={lpo.locationType} />
                <VRow label="Last updated" value={formatDateTime(lpo.updatedAt)} />
              </VList>
            </RailCard>

            <LpoShareAcknowledgement lpo={lpo} supplier={supplier} />

            <FinancingCard
              lpo={lpo}
              termsAcceptedAt={financingTerms?.acceptedAt ?? null}
              applicationStatus={application?.status ?? null}
            />
          </aside>

          <main className="flex min-w-0 flex-col gap-3.5">
            <PanelCard
              icon={<Package className="h-3.5 w-3.5" />}
              title="Items"
              count={lpo.items.length}
              pad0
            >
              {hasMixedCurrency && (
                <div className="border-b border-line bg-warn-tint px-5 py-2 text-[11.5px] font-medium text-warn">
                  Lines span multiple currencies — conversion happens at GRN receive.
                </div>
              )}
              <DetailTable>
                <DetailTableHead>
                  <DetailTh>Item</DetailTh>
                  <DetailTh align="right">Ordered</DetailTh>
                  <DetailTh align="right">Received</DetailTh>
                  <DetailTh align="right">Outstanding</DetailTh>
                  <DetailTh align="right">Unit cost</DetailTh>
                  <DetailTh align="right">Line total</DetailTh>
                </DetailTableHead>
                <DetailTableBody>
                  {lpo.items.map((item) => {
                    const lineCurrency = item.currency || lpoCurrency;
                    const ordered = Number(item.orderedQuantity || 0);
                    const received = Number(item.receivedQuantity || 0);
                    const outstanding = Math.max(0, ordered - received);
                    const lineTotal = ordered * Number(item.unitCost || 0);
                    const pct =
                      ordered > 0 ? Math.round((received / ordered) * 100) : 0;
                    const offCurrency =
                      Boolean(item.currency) &&
                      lineCurrency.toUpperCase() !== lpoCurrency.toUpperCase();
                    return (
                      <tr key={item.id}>
                        <DetailTd>
                          <div className="text-[13.5px] font-semibold tracking-tight text-ink">
                            {item.variantName || "—"}
                          </div>
                          {offCurrency && (
                            <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                              Billed in {lineCurrency.toUpperCase()}
                            </div>
                          )}
                        </DetailTd>
                        <DetailTd align="right">{ordered.toLocaleString()}</DetailTd>
                        <DetailTd align="right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold tabular-nums text-ink">
                              {received.toLocaleString()}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {pct}%
                            </span>
                          </div>
                        </DetailTd>
                        <DetailTd
                          align="right"
                          className={
                            outstanding === 0
                              ? "font-semibold text-pos"
                              : outstanding === ordered
                                ? "font-medium text-muted-2"
                                : "font-semibold text-warn"
                          }
                        >
                          {outstanding.toLocaleString()}
                        </DetailTd>
                        <DetailTd align="right">
                          <Money amount={Number(item.unitCost)} currency={lineCurrency} />
                        </DetailTd>
                        <DetailTd align="right" strong>
                          <Money amount={lineTotal} currency={lineCurrency} />
                        </DetailTd>
                      </tr>
                    );
                  })}
                </DetailTableBody>
                <DetailTableTotals>
                  <DetailTd align="right" strong>
                    Totals
                  </DetailTd>
                  <DetailTd align="right" strong>
                    {totalOrdered.toLocaleString()}
                  </DetailTd>
                  <DetailTd align="right" strong>
                    {totalReceived.toLocaleString()}
                  </DetailTd>
                  <DetailTd align="right" strong>
                    {totalOutstanding.toLocaleString()}
                  </DetailTd>
                  <DetailTd />
                  <DetailTd align="right" strong>
                    <div className="flex flex-col items-end gap-0.5">
                      {Array.from(totalsByCurrency.entries()).map(([cur, amt]) => (
                        <Money key={cur} amount={amt} currency={cur} />
                      ))}
                    </div>
                  </DetailTd>
                </DetailTableTotals>
              </DetailTable>

              {!hasMixedCurrency && (
                <div className="flex flex-col items-end gap-1 border-t border-line px-5 py-4 text-[13px]">
                  <div className="flex w-64 justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <Money amount={subtotal} currency={lpoCurrency} />
                  </div>
                  <div className="flex w-64 justify-between">
                    <span className="text-muted-foreground">
                      {taxRecoverable ? "Tax" : "Tax (included in cost)"}
                    </span>
                    <Money amount={lineTaxTotal} currency={lpoCurrency} />
                  </div>
                  <div className="flex w-64 justify-between border-t border-line pt-1 font-semibold">
                    <span>Total</span>
                    <Money amount={totalAmount} currency={lpoCurrency} />
                  </div>
                </div>
              )}
            </PanelCard>

            <AttachmentsPanel
              entityType="LPO"
              entityId={lpo.id}
              description="Quotations, approval letters, supplier correspondence. Max 10 MB per file."
            />

            {lpo.notes && (
              <PanelCard icon={<FileText className="h-3.5 w-3.5" />} title="Notes">
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
                  {lpo.notes}
                </p>
              </PanelCard>
            )}
          </main>
        </div>
      </PageBody>
    </PageShell>
  );
}
