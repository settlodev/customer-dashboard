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
          { title: "Spaces", href: "/spaces" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add space"
        subtitle="Create a section, hall, room, terrace, bar, or counter to group your tables."
      />
      <PageBody>
        <SpaceForm item={null} mode="space" />
      </PageBody>
    </PageShell>
  );
}
