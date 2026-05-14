"use client";

import { useState } from "react";
import {
  Activity,
  CornerDownRight,
  LayoutGrid,
  Palette,
  Power,
  PowerOff,
  Sparkles,
  StickyNote,
  Tag,
  Timer,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Space,
  TABLE_SPACE_TYPE_LABELS,
  TABLE_STATUS_LABELS,
  BOOKABLE_TYPES,
} from "@/types/space/type";
import { TableStatus } from "@/types/enums";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "operations", label: "Operations", icon: Activity },
  { key: "layout", label: "Layout", icon: Palette },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function SpaceDetailView({ space }: { space: Space }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const isBookable = BOOKABLE_TYPES.includes(space.type);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-line bg-line">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-5">
          <SummaryTile
            icon={<Tag className="h-3 w-3" />}
            label="Type"
            value={
              TABLE_SPACE_TYPE_LABELS[space.type] ?? String(space.type)
            }
          />
          <SummaryTile
            icon={<Users className="h-3 w-3" />}
            label="Capacity"
            value={
              space.minCapacity != null
                ? `${space.minCapacity}–${space.capacity}`
                : space.capacity.toString()
            }
            unit="seats"
          />
          <SummaryTile
            icon={<Activity className="h-3 w-3" />}
            label="Table status"
            value={
              space.tableStatus
                ? TABLE_STATUS_LABELS[space.tableStatus]
                : "—"
            }
          />
          <SummaryTile
            icon={
              space.reservable ? (
                <Sparkles className="h-3 w-3" />
              ) : (
                <PowerOff className="h-3 w-3" />
              )
            }
            label="Reservable"
            value={space.reservable ? "Yes" : "No"}
            tone={space.reservable ? "pos" : "neutral"}
          />
          <SummaryTile
            icon={
              space.active ? (
                <Power className="h-3 w-3" />
              ) : (
                <PowerOff className="h-3 w-3" />
              )
            }
            label="State"
            value={space.active ? "Active" : "Inactive"}
            tone={space.active ? "pos" : "neutral"}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={isActive}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "border-primary text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink-2"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && <OverviewTab space={space} />}
      {tab === "operations" && (
        <OperationsTab space={space} isBookable={isBookable} />
      )}
      {tab === "layout" && <LayoutTab space={space} />}
    </div>
  );
}

function OverviewTab({ space }: { space: Space }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line"
              style={
                space.color
                  ? { backgroundColor: `${space.color}1A`, color: space.color }
                  : undefined
              }
            >
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {space.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {space.code || "—"}
              </p>
            </div>
          </div>

          {space.parentSpaceName && (
            <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2">
              <CornerDownRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-[12px] font-medium text-ink">
                {space.parentSpaceName}
              </span>
            </div>
          )}

          {space.floorPlanName && (
            <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2">
              <LayoutGrid className="h-3 w-3 text-muted-foreground" />
              <span className="text-[12px] font-medium text-ink">
                Floor plan: {space.floorPlanName}
              </span>
            </div>
          )}

          {space.description && (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <StickyNote className="h-3 w-3" />
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm text-ink-2">
                {space.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            Profile
          </h3>

          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow
                icon={Tag}
                label="Type"
                value={
                  TABLE_SPACE_TYPE_LABELS[space.type] ?? String(space.type)
                }
              />
              <DetailRow icon={Tag} label="Code" value={space.code} />
              <DetailRow
                icon={Users}
                label="Maximum capacity"
                value={`${space.capacity}`}
              />
              <DetailRow
                icon={Users}
                label="Minimum capacity"
                value={
                  space.minCapacity != null ? `${space.minCapacity}` : null
                }
              />
              <DetailRow
                icon={CornerDownRight}
                label="Parent"
                value={space.parentSpaceName}
              />
              <DetailRow
                icon={LayoutGrid}
                label="Floor plan"
                value={space.floorPlanName}
              />
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OperationsTab({
  space,
  isBookable,
}: {
  space: Space;
  isBookable: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Live status
            </h3>
            <Badge
              variant={space.tableStatus ? "soft" : "outline"}
              className="text-[10.5px]"
            >
              {space.tableStatus
                ? TABLE_STATUS_LABELS[space.tableStatus as TableStatus]
                : "Not set"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <DetailRow
              label="Reservable"
              value={
                <Badge
                  variant={space.reservable ? "pos" : "soft"}
                  className="text-[10.5px]"
                >
                  {space.reservable ? "Yes" : "No"}
                </Badge>
              }
            />
            <DetailRow
              label="Active"
              value={
                <Badge
                  variant={space.active ? "pos" : "soft"}
                  className="text-[10.5px]"
                >
                  {space.active ? "Active" : "Inactive"}
                </Badge>
              }
            />
            <DetailRow label="Sort order" value={space.sortOrder?.toString()} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="h-4 w-4 text-muted-foreground" />
            Turnover
          </h3>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-nums">
                {space.turnTimeMinutes ?? "—"}
              </span>
              {space.turnTimeMinutes != null && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  min
                </span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">
              {isBookable
                ? "Average time a party occupies this table before turnover."
                : "Turnover only applies to bookable tables and seats."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LayoutTab({ space }: { space: Space }) {
  const hasPosition = space.posX != null && space.posY != null;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Visual styling
          </h3>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <DetailRow
              label="Color"
              value={
                space.color ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full border border-line"
                      style={{ backgroundColor: space.color }}
                    />
                    <span className="font-mono text-[11.5px]">{space.color}</span>
                  </span>
                ) : null
              }
            />
            <DetailRow label="Floor plan" value={space.floorPlanName} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            Position
          </h3>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <DetailRow
              label="X coordinate"
              value={space.posX != null ? space.posX.toString() : null}
            />
            <DetailRow
              label="Y coordinate"
              value={space.posY != null ? space.posY.toString() : null}
            />
          </div>
          {!hasPosition && (
            <p className="text-[12px] text-muted-foreground">
              Drop this space onto a floor plan to set its position.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: "pos" | "neg" | "neutral";
}) {
  const toneClass =
    tone === "pos"
      ? "text-pos"
      : tone === "neg"
        ? "text-neg"
        : "text-ink";
  return (
    <div className="bg-card px-4 py-4 md:px-5">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        <span className="opacity-70">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div
        className={`flex items-baseline gap-1.5 text-[20px] font-semibold leading-none tracking-[-0.025em] tabular-nums ${toneClass}`}
      >
        <span>{value}</span>
        {unit && (
          <span className="font-mono text-[11px] font-normal tracking-[0.02em] text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const isEmpty =
    value == null || (typeof value === "string" && value.trim() === "");
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink sm:text-right">
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </dd>
    </div>
  );
}
