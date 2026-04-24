import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { RecallRegister } from "@/components/widgets/traceability/recall-register";

const breadcrumbItems = [
  { title: "Traceability", link: "/traceability" },
  { title: "Recall register", link: "/traceability/recalls" },
];

export default function RecallRegisterPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <BreadcrumbsNav items={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-bold">Recall register</h1>
        <p className="text-sm text-muted-foreground">
          Every batch that has been recalled across the business. Reverted
          recalls stay on the register — the audit trail shows the full
          round-trip. Export as CSV for compliance.
        </p>
      </div>

      <RecallRegister />
    </div>
  );
}
