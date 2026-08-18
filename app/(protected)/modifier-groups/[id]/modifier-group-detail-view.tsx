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
import type { ModifierGroup, ModifierOption } from "@/types/product/type";
import { Money } from "@/components/widgets/money";

interface Props {
  group: ModifierGroup;
  /** Location currency — labels every priceAdjustment display. */
  currency: string;
}

function selectionLabel(group: ModifierGroup): string {
  if (group.selectionType === "SINGLE") {
    return group.minSelections >= 1 ? "Single — required" : "Single — optional";
  }
  const min = group.minSelections;
  const max = group.maxSelections;
  if (min === 0) return `Multi — up to ${max}`;
  if (min === max) return `Multi — exactly ${min}`;
  return `Multi — ${min}–${max}`;
}

function sellabilityBadge(option: ModifierOption) {
  switch (option.sellabilityMode) {
    case "DIRECT":
      return <Badge variant="soft">Direct stock</Badge>;
    case "RECIPE":
      return <Badge variant="soft">Recipe / BOM</Badge>;
    default:
      return <Badge variant="soft">Unlimited</Badge>;
  }
}

export function ModifierGroupDetailView({ group, currency }: Props) {
  const options = [...(group.options ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const liveOptions = options.filter((o) => o.archivedAt == null);
  const defaultsCount = liveOptions.filter((o) => o.isDefault).length;
  const attachedCount = group.attachedProductCount;

  return (
    <div className="space-y-4">
      <KpiStrip cols={4}>
        <KpiCard
          icon={<ListChecks className="h-3.5 w-3.5" />}
          label="Options"
          value={liveOptions.length}
          delta={
            options.length > liveOptions.length
              ? `${options.length - liveOptions.length} archived`
              : undefined
          }
        />
        <KpiCard
          icon={<Settings2 className="h-3.5 w-3.5" />}
          label="Selection"
          value={group.selectionType === "SINGLE" ? "Single" : "Multi"}
          delta={`min ${group.minSelections} · max ${group.maxSelections}`}
        />
        <KpiCard
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label="Defaults"
          value={defaultsCount}
          delta={
            group.selectionType === "SINGLE" && group.minSelections >= 1
              ? "single-required"
              : undefined
          }
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

      {/* ── Options ────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 px-5 pt-5 sm:px-6">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-ink">Options</h3>
            <Badge variant="soft" className="ml-1">
              {liveOptions.length}
            </Badge>
          </div>

          {options.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Boxes className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-ink">No options yet</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Add options like sizes, milk types, or spice levels to this
                group from the Edit screen.
              </p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Tracking
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Stock variant
                    </TableHead>
                    <TableHead className="text-right">Price adj.</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">
                      Default
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.map((option) => {
                    const archived = option.archivedAt != null;
                    return (
                      <TableRow key={option.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-ink">
                              {option.name}
                            </span>
                            {option.sellabilityMode === "DIRECT" &&
                            option.directQuantity != null ? (
                              <span className="text-[11px] text-muted-foreground">
                                Uses {option.directQuantity} per selection
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {sellabilityBadge(option)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-[12px] text-muted-foreground">
                            {option.stockVariantName ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {option.priceAdjustment === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <Money
                              amount={option.priceAdjustment}
                              currency={currency}
                            />
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          {option.isDefault ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" />
                          ) : (
                            <CircleDashed className="mx-auto h-4 w-4 text-muted-foreground/50" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={archived ? "soft" : "pos"}>
                            {archived
                              ? "Archived"
                              : option.active
                                ? "Active"
                                : "Inactive"}
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
