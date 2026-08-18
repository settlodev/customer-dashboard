import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import SpaceForm from "@/components/forms/space_form";

export default function NewTablePage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Tables", href: "/tables" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add table"
        subtitle="Create a table or seat. Capacity and reservation rules can be refined later."
      />
      <PageBody>
        <SpaceForm item={null} mode="table" />
      </PageBody>
    </PageShell>
  );
}
