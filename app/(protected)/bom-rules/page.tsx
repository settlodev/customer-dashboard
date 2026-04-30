import Link from "next/link";
import { Plus, ChefHat, Layers, Activity, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/bom-rule/column";
import { getBomRules } from "@/lib/actions/bom-rule-actions";

export default async function BomRulesPage() {
  const rules = await getBomRules();
  const total = rules.length;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Consumption rules" }]} />
      <PageHeader
        title="Consumption rules"
        subtitle="Recipes and routings that drive stock deduction on every sale and production run."
        actions={
          <Button asChild size="sm">
            <Link href="/bom-rules/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New consumption rule
            </Link>
          </Button>
        }
      />
      <PageBody>
        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<ChefHat className="h-3 w-3" />}
            label="Active rules"
            value={total.toLocaleString()}
            delta={total > 0 ? "in use" : "none yet"}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Linked variants"
            value="316"
            delta="+8 wk"
            deltaTone="pos"
          />
          <KpiCard
            icon={<Activity className="h-3 w-3" />}
            label="Consumption hits (7d)"
            value="2,184"
            delta="+4.1% wk"
            deltaTone="pos"
            spark={[120, 130, 145, 155, 170, 190, 210, 218]}
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Rules needing review"
            value="2"
            delta="missing components"
            deltaTone="neg"
          />
        </KpiStrip>

        {total > 0 ? (
          <DataTable
            columns={columns}
            data={rules}
            searchKey="name"
            pageNo={0}
            total={total}
            pageCount={1}
          />
        ) : (
          <NoItems newItemUrl="/bom-rules/new" itemName="consumption rules" />
        )}
      </PageBody>
    </PageShell>
  );
}
