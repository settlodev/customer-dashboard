import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/bom-rule/column";
import { getBomRules } from "@/lib/actions/bom-rule-actions";

const breadcrumbItems = [{ title: "Consumption rules", link: "/bom-rules" }];

export default async function BomRulesPage() {
  const rules = await getBomRules();
  const total = rules.length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BreadcrumbsNav items={breadcrumbItems} />
          <p className="text-sm text-muted-foreground mt-1">
            Recipes and routings that drive stock deduction on every sale and
            production run.
          </p>
        </div>
        <Button asChild>
          <Link href="/bom-rules/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New consumption rule
          </Link>
        </Button>
      </div>

      {total > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={rules}
              searchKey="name"
              pageNo={0}
              total={total}
              pageCount={1}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/bom-rules/new" itemName="consumption rules" />
      )}
    </div>
  );
}
