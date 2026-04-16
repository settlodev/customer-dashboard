import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getConsumptionRule } from "@/lib/actions/consumption-rule-actions";
import ConsumptionRuleForm from "@/components/forms/consumption_rule_form";

type Params = Promise<{ id: string }>;

export default async function ConsumptionRulePage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item = null;

  if (!isNewItem) {
    try {
      item = await getConsumptionRule(resolvedParams.id);
      if (!item) notFound();
    } catch {
      notFound();
    }
  }

  const breadcrumbItems = [
    { title: "Consumption Rules", link: "/consumption-rules" },
    { title: isNewItem ? "New" : item?.name || "Edit", link: "" },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isNewItem ? "Create Consumption Rule" : "Edit Consumption Rule"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Define ingredients and quantities for this rule"
              : "Update rule details and ingredients"}
          </p>
        </div>

        <ConsumptionRuleForm item={item} />
      </div>
    </div>
  );
}
