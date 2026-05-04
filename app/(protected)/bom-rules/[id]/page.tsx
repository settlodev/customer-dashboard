import { notFound } from "next/navigation";
import { History } from "lucide-react";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import BomRuleForm from "@/components/forms/bom_rule_form";
import RecipeForm from "@/components/forms/recipe-form";
import BomRevisionsDialog from "@/components/widgets/bom/bom-revisions-dialog";
import { getBomRule } from "@/lib/actions/bom-rule-actions";

type Params = Promise<{ id: string }>;

/**
 * /bom-rules/[id]
 *
 * Mirrors the create-side split: LOCATION-typed rules render the slim
 * recipe form (no scrap, no operations, no outputs, STOCK/SUB_RULE only,
 * AVAILABILITY-only substitution); WAREHOUSE-typed rules keep the full
 * authoring surface for batch yields, routings, and by-products.
 *
 * Revisions & diff sit in the header's right-rail action slot for a
 * less-cluttered authoring view; the where-used / cost / metadata side
 * panel is gone — cost is computed live by the backend, where-used was
 * rarely consulted, and metadata duplicates the header subtitle.
 */
export default async function BomRulePage({ params }: { params: Params }) {
  const resolved = await params;
  const isNew = resolved.id === "new";
  let rule = null;
  if (!isNew) {
    rule = await getBomRule(resolved.id);
    if (!rule) notFound();
  }

  const isWarehouse = rule?.locationType === "WAREHOUSE";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Consumption rules", href: "/bom-rules" },
          { title: isNew ? "New" : (rule?.name ?? "Edit") },
        ]}
      />
      <PageHeader
        title={isNew ? "Create consumption rule" : (rule?.name ?? "")}
        subtitle={
          isNew
            ? "Define the items, outputs, and routing operations that drive deduction on every sale and production run."
            : `Revision ${rule?.revisionNumber} · ${rule?.lifecycleStatus}`
        }
        actions={
          rule ? (
            <BomRevisionsDialog
              rule={rule}
              trigger={
                <Button variant="outline" size="sm">
                  <History className="mr-1.5 h-4 w-4" />
                  Revisions & diff
                </Button>
              }
            />
          ) : undefined
        }
      />
      <PageBody>
        {isWarehouse ? (
          <BomRuleForm rule={rule} locationType={rule?.locationType ?? null} />
        ) : (
          <RecipeForm rule={rule} />
        )}
      </PageBody>
    </PageShell>
  );
}
