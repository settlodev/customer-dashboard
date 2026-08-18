import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import DepartmentForm from "@/components/forms/department_form";

export default function NewDepartmentPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Departments", href: "/departments" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add Department"
        subtitle="Create a new department for your business"
      />

      <PageBody>
        <DepartmentForm item={null} />
      </PageBody>
    </PageShell>
  );
}
