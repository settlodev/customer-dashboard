import { notFound } from "next/navigation";
import {
  ArrowLeftRight,
  Calendar,
  Hash,
  Layers,
  Lock,
  ShieldCheck,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { Card, CardContent } from "@/components/ui/card";
import {
  getConversionsForUnit,
  getUnit,
  getUnits,
} from "@/lib/actions/unit-actions";
import { UNIT_TYPE_OPTIONS } from "@/types/catalogue/enums";
import { UnitStatusActions } from "@/components/widgets/unit/unit-status-actions";
import { ConversionsPanel } from "@/components/widgets/unit/conversions-panel";
import { ConvertCalculator } from "@/components/widgets/unit/convert-calculator";
import { UnitEditTrigger } from "./unit-edit-trigger";

type Params = Promise<{ id: string }>;

const UNIT_TYPE_LABELS = Object.fromEntries(
  UNIT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<string, string>;

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

export default async function UnitDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const [unit, allUnits, conversions] = await Promise.all([
    getUnit(id),
    getUnits(),
    getConversionsForUnit(id),
  ]);

  if (!unit) notFound();

  const typeLabel = UNIT_TYPE_LABELS[unit.unitType] ?? unit.unitType;

  const compatibleCount = allUnits.filter(
    (u) => u.unitType === unit.unitType && u.id !== unit.id && !u.archivedAt,
  ).length;

  const customConversions = conversions.filter((c) => !c.systemGenerated).length;
  const systemConversions = conversions.filter((c) => c.systemGenerated).length;

  const statusBadge = unit.systemGenerated ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <ShieldCheck className="h-3.5 w-3.5" />
      System
    </span>
  ) : unit.archivedAt ? (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      Archived
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
      Active
    </span>
  );

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Units of measure", href: "/units" },
          { title: unit.name },
        ]}
      />
      <PageHeader
        title={unit.name}
        titleAccessory={statusBadge}
        subtitle={
          <>
            {typeLabel} · <span className="font-medium">{unit.abbreviation}</span>
          </>
        }
        actions={
          <span className="flex items-center gap-2">
            {!unit.systemGenerated && <UnitEditTrigger unit={unit} />}
            <UnitStatusActions unit={unit} />
          </span>
        }
      />
      <PageBody>
        <KpiStrip cols={4}>
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Unit type"
            value={typeLabel}
            delta={`compatible with ${compatibleCount.toLocaleString()} ${compatibleCount === 1 ? "unit" : "units"}`}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<Hash className="h-3 w-3" />}
            label="Abbreviation"
            value={unit.abbreviation}
            delta={unit.systemGenerated ? "platform-seeded" : "custom"}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<ArrowLeftRight className="h-3 w-3" />}
            label="Conversions"
            value={conversions.length.toLocaleString()}
            delta={
              customConversions > 0
                ? `${customConversions} custom · ${systemConversions} system`
                : systemConversions > 0
                  ? `${systemConversions} system only`
                  : "none defined"
            }
            deltaTone="neutral"
          />
          <KpiCard
            icon={<Calendar className="h-3 w-3" />}
            label="Created"
            value={formatDate(unit.createdAt)}
            delta={unit.updatedAt ? `updated ${formatDate(unit.updatedAt)}` : undefined}
            deltaTone="neutral"
          />
        </KpiStrip>

        {unit.systemGenerated && (
          <Card className="border-dashed">
            <CardContent className="flex items-start gap-3 py-4">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">System-managed unit</p>
                <p className="text-xs text-muted-foreground">
                  This is a platform-seeded unit. It&apos;s available to all
                  businesses and can&apos;t be edited or archived. You can still
                  add custom conversions that go through it.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <ConversionsPanel
          unit={unit}
          allUnits={allUnits}
          conversions={conversions}
        />

        <ConvertCalculator anchor={unit} allUnits={allUnits} />
      </PageBody>
    </PageShell>
  );
}
