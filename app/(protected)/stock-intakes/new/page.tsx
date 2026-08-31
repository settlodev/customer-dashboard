import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StockIntakeForm from "@/components/forms/stock_intake_form";
import { SectionTutorialDialog } from "@/components/widgets/help/section-tutorial-dialog";
import { TutorialSection } from "@/lib/tutorials";

export default function NewStockIntakePage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Intakes", href: "/stock-intakes" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Record stock intake"
        subtitle="Capture stock quantities, costs, and batches. Intakes are created as a draft — confirm to post movements and update inventory."
        actions={<SectionTutorialDialog section={TutorialSection.STOCK_INTAKE} />}
      />
      <PageBody>
        <StockIntakeForm />
      </PageBody>
    </PageShell>
  );
}
