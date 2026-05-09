import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { getStockUsage } from "@/lib/actions/stock-usage-actions";
import StockUsageForm from "@/components/forms/stock_usage_form";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { Money } from "@/components/widgets/money";
import {
  STOCK_USAGE_TYPE_OPTIONS,
} from "@/types/stock-usage/type";
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
    const usageTypeLabel =
      STOCK_USAGE_TYPE_OPTIONS.find((o) => o.value === item.usageType)?.label ??
      item.usageType;

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
          subtitle={`${usageTypeLabel}${item.variantName ? ` — ${item.variantName}` : ""}`}
          actions={
            <span className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                Settlement currency:{" "}
                <span className="rounded bg-canvas px-2 py-0.5 font-semibold text-ink">
                  {currency}
                </span>
              </span>
            </span>
          }
        />
        <PageBody>
          <Card>
            <CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Meta label="Date" value={formatDate(item.usageDate) ?? "—"} />
              <Meta label="Recorded by" value={item.recordedByName || "—"} />
              <Meta label="Department" value={item.departmentName || "—"} />
              <Meta
                label="Quantity"
                value={`−${Number(item.quantity).toLocaleString()}`}
                tone="negative"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <h3 className="text-lg font-medium mb-4">Item</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Stock variant
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                        Unit cost
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                        Total cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.variantName || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-amber-700">
                        −{Number(item.quantity).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.unitCost != null ? (
                          <Money amount={item.unitCost} currency={currency} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.unitCost != null ? (
                          <Money
                            amount={Number(item.unitCost) * Number(item.quantity)}
                            currency={currency}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

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
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className={`font-medium ${toneClass}`}>{value}</span>
    </div>
  );
}
