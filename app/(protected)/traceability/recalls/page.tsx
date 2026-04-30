import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { RecallRegister } from "@/components/widgets/traceability/recall-register";

export default function RecallRegisterPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Traceability", href: "/traceability" },
          { title: "Recall register" },
        ]}
      />
      <PageHeader
        title="Recall register"
        subtitle="Every batch that has been recalled across the business. Reverted recalls stay on the register — the audit trail shows the full round-trip. Export as CSV for compliance."
      />
      <PageBody>
        <RecallRegister />
      </PageBody>
    </PageShell>
  );
}
