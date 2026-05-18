import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { getStockUsage } from "@/lib/actions/stock-usage-actions";
import StockUsageForm from "@/components/forms/stock_usage_form";
import ReverseStockUsageDialog from "@/components/widgets/stock-usage/reverse-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { Money } from "@/components/widgets/money";
import { USAGE_CATEGORY_OPTIONS } from "@/types/stock-usage/type";
import { AttachmentsPanel } from "@/components/widgets/attachments-panel";
import { fetchDepartmentsForCurrentLocation } from "@/lib/actions/department-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getEntityEntitlements } from "@/lib/actions/entitlement-actions";
import type { Department } from "@/types/department/type";

type Params = Promise<{ id: string }>;

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default async function StockUsagePage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (!isNewItem) {
    const item = await getStockUsage(resolvedParams.id);
    if (!item) notFound();

    const currency = item.currency || DEFAULT_CURRENCY;
    const categoryLabel =
      USAGE_CATEGORY_OPTIONS.find((o) => o.value === item.category)?.label ??
      item.category;
    const hasForeignLine = item.items?.some(
      (line) =>
        line.originalCurrency && line.originalCurrency !== (line.currency || currency),
    );
    const totalQty =
      item.items?.reduce((sum, line) => sum + Number(line.quantity), 0) ?? 0;
    const totalCost = item.items?.reduce((sum, line) => {
      if (line.unitCost == null) return sum;
      return sum + Number(line.unitCost) * Number(line.quantity);
    }, 0) ?? 0;
    const isReversed = item.status === "REVERSED";

    return (
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Stock Usage", href: "/stock-usages" },
            { title: item.usageNumber },
          ]}
        />
        <PageHeader
          title={item.usageNumber}
          subtitle={`${categoryLabel} — ${item.purpose}`}
          actions={
            <span className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isReversed
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isReversed ? "Reversed" : "Active"}
              </span>
              <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                Settlement currency:{" "}
                <span className="rounded bg-canvas px-2 py-0.5 font-semibold text-ink">
                  {currency}
                </span>
              </span>
              {!isReversed && (
                <ReverseStockUsageDialog
                  usageId={item.id}
                  usageNumber={item.usageNumber}
                />
              )}
            </span>
          }
        />
        <PageBody>
          <Card>
            <CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Meta label="Date" value={formatDate(item.usageDate) ?? "—"} />
              <Meta
                label="Recipient"
                value={item.recipientName || "—"}
              />
              <Meta
                label="Recorded by"
                value={item.performedByName || "—"}
              />
              <Meta label="Department" value={item.departmentName || "—"} />
              <Meta label="Location" value={item.locationName || "—"} />
              <Meta
                label="Total quantity"
                value={`−${totalQty.toLocaleString()}`}
                tone="negative"
              />
              <Meta
                label="Total cost"
                value={totalCost > 0 ? "" : "—"}
                tone="neutral"
                rich={
                  totalCost > 0 ? (
                    <Money amount={totalCost} currency={currency} />
                  ) : undefined
                }
              />
              <Meta label="Items" value={String(item.items?.length ?? 0)} />
            </CardContent>
          </Card>

          {isReversed && (
            <Card>
              <CardContent className="pt-4 pb-3 space-y-1">
                <p className="text-xs font-medium text-rose-500 uppercase">
                  Reversal
                </p>
                <p className="text-sm">
                  Reversed by{" "}
                  <span className="font-medium">
                    {item.reversedByName || "—"}
                  </span>{" "}
                  on {formatDate(item.reversedAt) ?? "—"}
                </p>
                {item.reversalReason && (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {item.reversalReason}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {item.items && item.items.length > 0 && (
            <Card>
              <CardContent className="px-2 sm:px-6 pt-6">
                <h3 className="text-lg font-medium mb-4">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                          Previous
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                          Used
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                          New qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                          Unit cost
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                          Total
                        </th>
                        {hasForeignLine && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                            Originally
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {item.items.map((line) => {
                        const lineCurrency = line.currency || currency;
                        const isForeign =
                          line.originalCurrency &&
                          line.originalCurrency !== lineCurrency;
                        const lineTotal =
                          line.unitCost != null
                            ? Number(line.unitCost) * Number(line.quantity)
                            : null;
                        return (
                          <tr key={line.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {line.variantName}
                              {line.batchNumber && (
                                <span className="ml-2 text-[11px] text-muted-foreground font-mono">
                                  {line.batchNumber}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {Number(line.previousQuantity).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-amber-700">
                              −{Number(line.quantity).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {Number(line.newQuantity).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {line.unitCost != null ? (
                                <Money
                                  amount={line.unitCost}
                                  currency={lineCurrency}
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {lineTotal != null ? (
                                <Money
                                  amount={lineTotal}
                                  currency={lineCurrency}
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                            {hasForeignLine && (
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {isForeign ? (
                                  <div className="flex flex-col">
                                    <Money
                                      amount={line.originalUnitCost ?? 0}
                                      currency={line.originalCurrency}
                                    />
                                    {line.rateUsed != null && line.rateUsed !== 1 && (
                                      <span className="text-[10px]">
                                        @{" "}
                                        {line.rateUsed.toLocaleString(undefined, {
                                          maximumFractionDigits: 6,
                                        })}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <AttachmentsPanel
            entityType="STOCK_USAGE"
            entityId={item.id}
            description="Photos, signed acknowledgements, training/event references. Max 10 MB per file."
          />

          {item.notes && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{item.notes}</p>
              </CardContent>
            </Card>
          )}
        </PageBody>
      </PageShell>
    );
  }

  // New record — load departments & entitlements server-side so the form
  // mounts with a valid `departmentId` and the right multi-department UX.
  const [departments, currentLocation] = await Promise.all([
    fetchDepartmentsForCurrentLocation(true).catch(() => [] as Department[]),
    getCurrentLocation(),
  ]);

  let canPickDepartment = true;
  if (currentLocation?.id) {
    const entitlements = await getEntityEntitlements(currentLocation.id);
    if (entitlements) {
      canPickDepartment = entitlements.features["DEPARTMENTS_MODULE"] === true;
    }
  }

  const defaultDepartmentId =
    departments.find((d) => d.isDefault)?.id ??
    (departments.length === 1 ? departments[0].id : undefined);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Usage", href: "/stock-usages" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Record Stock Usage"
        subtitle="Log internal stock consumption — staff meal, training, samples, marketing, or maintenance."
      />
      <PageBody>
        <StockUsageForm
          departments={departments}
          defaultDepartmentId={defaultDepartmentId}
          canPickDepartment={canPickDepartment}
        />
      </PageBody>
    </PageShell>
  );
}

function Meta({
  label,
  value,
  tone = "neutral",
  rich,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
  rich?: React.ReactNode;
}) {
  const toneClass =
    tone === "positive"
      ? "text-green-700"
      : tone === "negative"
        ? "text-red-600"
        : "text-gray-900";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className={`font-medium ${toneClass}`}>{rich ?? value}</span>
    </div>
  );
}
