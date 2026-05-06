import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import SpaceForm from "@/components/forms/space_form";

export default function NewSpacePage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Tables & Spaces", href: "/spaces" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add table or space"
        subtitle="Create a table, seat, section, or other area. Capacity and reservation rules can be refined later."
      />
      <PageBody>
        <SpaceForm item={null} />
      </PageBody>
    </PageShell>
  );
}
