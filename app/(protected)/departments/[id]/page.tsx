import { notFound } from "next/navigation";
import { Department } from "@/types/department/type";
import { getDepartment } from "@/lib/actions/department-actions";
import DepartmentForm from "@/components/forms/department_form";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";

type Params = Promise<{ id: string }>;

export default async function DepartmentPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: Department | null = null;

  if (!isNewItem) {
    try {
      item = await getDepartment(resolvedParams.id);
      if (!item) notFound();
    } catch {
      throw new Error("Failed to load department data");
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Departments", href: "/departments" },
          { title: isNewItem ? "New" : item?.name || "Edit" },
        ]}
      />
      <PageHeader
        title={isNewItem ? "Add Department" : "Edit Department"}
        subtitle={
          isNewItem
            ? "Create a new department for your business"
            : "Update department details"
        }
      />

      <PageBody>
        <DepartmentForm item={isNewItem ? null : item} />
      </PageBody>
    </PageShell>
  );
}
