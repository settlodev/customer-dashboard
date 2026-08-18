"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Boxes,
  CheckCircle2,
  CircleDashed,
  Layers,
  Link as LinkIcon,
  ListChecks,
  Settings2,
  Sparkles,
} from "lucide-react";
import type { AddonGroup, AddonGroupItem } from "@/types/product/type";
import { Money } from "@/components/widgets/money";

interface Props {
  group: AddonGroup;
  /** Location currency — labels every price/override display. */
  currency: string;
}

function selectionLabel(group: AddonGroup): string {
  const min = group.minSelections;
  const max = group.maxSelections;
  if (min === 0 && max === 1) return "Optional — pick at most 1";
  if (min === 0) return `Optional — up to ${max}`;
  if (min === max) return `Required — exactly ${min}`;
  return `${min}–${max} required`;
}

function effectivePrice(item: AddonGroupItem): number {
  return item.priceOverride != null ? item.priceOverride : item.price;
}

export function AddonGroupDetailView({ group, currency }: Props) {
  const items = [...(group.items ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const liveItems = items.filter((i) => i.active);
  const defaultsCount = liveItems.filter((i) => i.isDefault).length;
  const attachedCount = group.attachedProductCount;

  return (
    <div className="space-y-4">
      <KpiStrip cols={4}>
        <KpiCard
          icon={<ListChecks className="h-3.5 w-3.5" />}
          label="Items"
          value={liveItems.length}
          delta={
            items.length > liveItems.length
              ? `${items.length - liveItems.length} inactive`
              : undefined
          }
        />
        <KpiCard
          icon={<Settings2 className="h-3.5 w-3.5" />}
          label="Selection"
          value={`${group.minSelections}–${group.maxSelections}`}
          delta={group.minSelections >= 1 ? "required" : "optional"}
        />
        <KpiCard
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label="Defaults"
          value={defaultsCount}
        />
        <KpiCard
          icon={<LinkIcon className="h-3.5 w-3.5" />}
          label="Used by"
          value={attachedCount ?? "—"}
          unit={
            attachedCount != null
              ? attachedCount === 1
                ? "product"
                : "products"
              : undefined
          }
        />
      </KpiStrip>

      {/* ── Group settings ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-ink">Group settings</h3>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailRow label="Selection" value={selectionLabel(group)} />
            <DetailRow
              label="Min selections"
              value={String(group.minSelections)}
            />
            <DetailRow
              label="Max selections"
              value={String(group.maxSelections)}
            />
            <DetailRow label="Sort order" value={String(group.sortOrder)} />
            <DetailRow
              label="Status"
              value={
                group.archivedAt
                  ? "Archived"
                  : group.active
                    ? "Active"
                    : "Inactive"
              }
            />
            <DetailRow
              label="Updated"
              value={
                group.updatedAt
                  ? new Date(group.updatedAt).toLocaleString()
                  : "—"
              }
            />
          </dl>
        </CardContent>
      </Card>

      {/* ── Items ──────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 px-5 pt-5 sm:px-6">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-ink">Items</h3>
            <Badge variant="soft" className="ml-1">
              {liveItems.length}
            </Badge>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Boxes className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-ink">No items yet</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Add product variants as add-on items to this group from the
                Edit screen.
              </p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden md:table-cell text-right">
                      Base price
                    </TableHead>
                    <TableHead className="text-right">Effective</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">
                      Default
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const overridden = item.priceOverride != null;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-ink">
                              {item.productVariantDisplayName ||
                                item.productVariantName}
                            </span>
                            {overridden ? (
                              <span className="text-[11px] text-muted-foreground">
                                Override applied
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right tabular-nums">
                          <Money amount={item.price} currency={currency} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Money
                            amount={effectivePrice(item)}
                            currency={currency}
                          />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          {item.isDefault ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" />
                          ) : (
                            <CircleDashed className="mx-auto h-4 w-4 text-muted-foreground/50" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.active ? "pos" : "soft"}>
                            {item.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-[13px] text-ink">{value}</dd>
    </div>
  );
}
