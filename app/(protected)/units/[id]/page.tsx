import { notFound } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
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

  const breadcrumbItems = [
    { title: "Units", link: "/units" },
    { title: unit.name, link: "" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <BreadcrumbsNav items={breadcrumbItems} />
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {unit.name}
            </h1>
            {unit.systemGenerated ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                System
              </span>
            ) : unit.archivedAt ? (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Archived
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {UNIT_TYPE_LABELS[unit.unitType] ?? unit.unitType} · {unit.abbreviation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!unit.systemGenerated && <UnitEditTrigger unit={unit} />}
          <UnitStatusActions unit={unit} />
        </div>
      </div>

      {unit.systemGenerated && (
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 py-4">
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tile label="Name" value={unit.name} />
        <Tile label="Abbreviation" value={unit.abbreviation} />
        <Tile
          label="Unit type"
          value={UNIT_TYPE_LABELS[unit.unitType] ?? unit.unitType}
        />
      </div>

      <ConversionsPanel
        unit={unit}
        allUnits={allUnits}
        conversions={conversions}
      />

      <ConvertCalculator anchor={unit} allUnits={allUnits} />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}

