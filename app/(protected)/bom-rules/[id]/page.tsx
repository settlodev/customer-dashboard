import { notFound } from "next/navigation";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
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
      />
      <PageBody>
        <BomRuleForm rule={rule} locationType={rule?.locationType ?? null} />
        {rule && (
          <aside>
            <BomRuleSidePanel rule={rule} />
          </aside>
        )}
      </PageBody>
    </PageShell>
  );
}
