import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Discount } from "@/types/discount/type";
import { getDiscount } from "@/lib/actions/discount-actions";
import {
  DISCOUNT_APPLY_MODE_OPTIONS,
  DISCOUNT_CONDITION_TYPE_OPTIONS,
  DISCOUNT_RULE_TYPE_OPTIONS,
  DISCOUNT_TARGET_ENTITY_TYPE_OPTIONS,
  DISCOUNT_TARGET_TYPE_OPTIONS,
} from "@/types/discount/enums";
import {
  Percent,
  Layers,
  Target,
  ListChecks,
} from "lucide-react";

type Params = Promise<{ id: string }>;

function labelFor(
  options: { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export default async function DiscountPage({ params }: { params: Params }) {
  const { id } = await params;

  // Adding a discount is a sibling route now that /discounts/[id] is a
  // detail view; editing lives at /discounts/[id]/edit.
  if (id === "new") redirect("/discounts/new");

  let discount: Discount | null = null;
  try {
    discount = await getDiscount(id);
    if (!discount) notFound();
  } catch {
    notFound();
  }

  const statusLabel = discount.active ? "Active" : "Inactive";
  const statusClass = discount.active
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
    : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Discounts", href: "/discounts" },
          { title: discount.name },
        ]}
      />
      <PageHeader
        title={discount.name}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
          >
            {statusLabel}
          </span>
        }
        subtitle={discount.description ?? undefined}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/discounts/${discount.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <PageBody>
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Percent className="h-4 w-4 text-muted-foreground" />
                Rule & value
              </h3>
              <div className="overflow-hidden rounded-lg border border-line bg-line">
                <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
                  <DetailRow
                    label="Rule type"
                    value={labelFor(DISCOUNT_RULE_TYPE_OPTIONS, discount.ruleType)}
                  />
                  <DetailRow
                    label="Applies to"
                    value={labelFor(DISCOUNT_TARGET_TYPE_OPTIONS, discount.targetType)}
                  />
                  <DetailRow
                    label="Apply mode"
                    value={labelFor(DISCOUNT_APPLY_MODE_OPTIONS, discount.applyMode)}
                  />
                  <DetailRow
                    label="Value"
                    value={
                      discount.ruleType === "PERCENTAGE"
                        ? `${discount.value}%`
                        : String(discount.value)
                    }
                  />
                  <DetailRow
                    label="Max discount amount"
                    value={discount.maxDiscountAmount != null ? String(discount.maxDiscountAmount) : null}
                  />
                  <DetailRow label="Coupon code" value={discount.couponCode} />
                  <DetailRow label="Priority" value={String(discount.priority)} />
                  <DetailRow label="Stackable" value={discount.stackable ? "Yes" : "No"} />
                  <DetailRow
                    label="Requires approval"
                    value={discount.requiresApproval ? "Yes" : "No"}
                  />
                  <DetailRow label="Promotion" value={discount.promotionName ?? discount.promotionId} />
                  {discount.ruleType === "BUY_X_GET_Y" && (
                    <>
                      <DetailRow
                        label="Buy quantity"
                        value={discount.buyQuantity != null ? String(discount.buyQuantity) : null}
                      />
                      <DetailRow
                        label="Get quantity"
                        value={discount.getQuantity != null ? String(discount.getQuantity) : null}
                      />
                      <DetailRow
                        label="Get item discount"
                        value={
                          discount.getDiscountPercentage != null
                            ? `${discount.getDiscountPercentage}%`
                            : null
                        }
                      />
                    </>
                  )}
                </dl>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                Usage limits
              </h3>
              <div className="overflow-hidden rounded-lg border border-line bg-line">
                <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
                  <DetailRow
                    label="Max total uses"
                    value={discount.maxTotalUses != null ? String(discount.maxTotalUses) : "Unlimited"}
                  />
                  <DetailRow
                    label="Max per customer"
                    value={
                      discount.maxUsesPerCustomer != null
                        ? String(discount.maxUsesPerCustomer)
                        : "Unlimited"
                    }
                  />
                  <DetailRow
                    label="Max per day"
                    value={discount.maxUsesPerDay != null ? String(discount.maxUsesPerDay) : "Unlimited"}
                  />
                </dl>
              </div>
            </CardContent>
          </Card>

          {discount.tiers.length > 0 && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  Tiers
                </h3>
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-card text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">Min threshold</th>
                        <th className="px-4 py-2 font-medium">Discount type</th>
                        <th className="px-4 py-2 font-medium">Discount value</th>
                        <th className="px-4 py-2 font-medium">Sort order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {[...discount.tiers]
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((tier) => (
                          <tr key={tier.id}>
                            <td className="px-4 py-2">{tier.minThreshold}</td>
                            <td className="px-4 py-2">{tier.discountType}</td>
                            <td className="px-4 py-2">{tier.discountValue}</td>
                            <td className="px-4 py-2">{tier.sortOrder}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {discount.targets.length > 0 && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Targets
                </h3>
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-card text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">Entity type</th>
                        <th className="px-4 py-2 font-medium">Entity ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {discount.targets.map((target) => (
                        <tr key={target.id}>
                          <td className="px-4 py-2">
                            {labelFor(DISCOUNT_TARGET_ENTITY_TYPE_OPTIONS, target.targetEntityType)}
                          </td>
                          <td className="px-4 py-2 font-mono text-[12px]">
                            {target.targetEntityId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {discount.conditions.length > 0 && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  Conditions
                </h3>
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-card text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">Type</th>
                        <th className="px-4 py-2 font-medium">Operator</th>
                        <th className="px-4 py-2 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {discount.conditions.map((condition) => (
                        <tr key={condition.id}>
                          <td className="px-4 py-2">
                            {labelFor(DISCOUNT_CONDITION_TYPE_OPTIONS, condition.conditionType)}
                          </td>
                          <td className="px-4 py-2">{condition.operator ?? "—"}</td>
                          <td className="px-4 py-2">
                            {condition.valueText ??
                              (condition.valueNumeric != null ? String(condition.valueNumeric) : null) ??
                              (condition.valueTimeFrom && condition.valueTimeTo
                                ? `${condition.valueTimeFrom} – ${condition.valueTimeTo}`
                                : null) ??
                              (condition.valueIds?.length ? condition.valueIds.join(", ") : null) ??
                              "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageBody>
    </PageShell>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  const isEmpty =
    value == null || (typeof value === "string" && value.trim() === "");
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink sm:text-right">
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </dd>
    </div>
  );
}
