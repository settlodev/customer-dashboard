import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StockCategoryForm from "@/components/forms/stock_category_form";

export default function Page() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Categories", href: "/stock-categories" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="New Stock Category"
        subtitle="Group your stock items for filtering and reporting"
      />
      <PageBody>
        <StockCategoryForm />
      </PageBody>
    </PageShell>
  );
}
