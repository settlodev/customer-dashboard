import { notFound } from "next/navigation";

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import BomRuleForm from "@/components/forms/bom_rule_form";
import BomRuleSidePanel from "@/components/widgets/bom/bom-rule-side-panel";
import { getBomRule } from "@/lib/actions/bom-rule-actions";

type Params = Promise<{ id: string }>;

export default async function BomRulePage({ params }: { params: Params }) {
  const resolved = await params;
  const isNew = resolved.id === "new";
  let rule = null;
  if (!isNew) {
    rule = await getBomRule(resolved.id);
    if (!rule) notFound();
  }

  const breadcrumbItems = [
    { title: "Consumption rules", link: "/bom-rules" },
    { title: isNew ? "New" : rule?.name ?? "Edit", link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {isNew ? "Create consumption rule" : rule?.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isNew
                ? "Define the items, outputs, and routing operations that drive deduction on every sale and production run."
                : `Revision ${rule?.revisionNumber} · ${rule?.lifecycleStatus}`}
            </p>
          </div>
        </div>
      </div>

      <BomRuleForm rule={rule} locationType={rule?.locationType ?? null} />
      {rule && (
        <aside>
          <BomRuleSidePanel rule={rule} />
        </aside>
      )}
    </div>
  );
}
