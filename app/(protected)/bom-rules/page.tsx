import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/bom-rule/column";
import { getBomRules } from "@/lib/actions/bom-rule-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBomRulesKpi } from "@/lib/actions/reports-analytics-actions";
import { BomRulesKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";

export default async function BomRulesPage() {
  const [rules, location] = await Promise.all([getBomRules(), getCurrentLocation()]);
  const total = rules.length;
  const kpi = location?.id ? await getBomRulesKpi(location.id) : null;

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
        {total > 0 ? (
          <>
            <BomRulesKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={rules}
              searchKey="name"
              pageNo={0}
              total={total}
              pageCount={1}
            />
          </>
        ) : (
          <NoItems newItemUrl="/bom-rules/new" itemName="consumption rules" />
        )}
      </PageBody>
    </PageShell>
  );
}
