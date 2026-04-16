import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/consumption-rule/column";
import { getConsumptionRules } from "@/lib/actions/consumption-rule-actions";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { Features } from "@/lib/features";
import { Plus } from "lucide-react";

const breadCrumbItems = [{ title: "Consumption Rules", link: "/consumption-rules" }];

export default async function Page() {
  const data = await getConsumptionRules();
  const total = data.length;

  return (
    <SubscriptionGuard featureKey={Features.STOCK_CONSUMPTION_RULES}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <BreadcrumbsNav items={breadCrumbItems} />
          <Button asChild>
            <Link href="/consumption-rules/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Rule
            </Link>
          </Button>
        </div>

        {total > 0 ? (
          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <DataTable
                columns={columns}
                data={data}
                searchKey="name"
                pageNo={0}
                total={total}
                pageCount={1}
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems newItemUrl="/consumption-rules/new" itemName="consumption rules" />
        )}
      </div>
    </SubscriptionGuard>
  );
}
