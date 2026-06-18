import { notFound, redirect } from "next/navigation";

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

export default async function EditDepartmentPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  // Creating is a sibling route now that /departments/[id] is a detail view.
  if (id === "new") redirect("/departments/new");

  let item: Department | null = null;
  try {
    item = await getDepartment(id);
    if (!item) notFound();
  } catch {
    notFound();
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Departments", href: "/departments" },
          { title: item?.name ?? "Department", href: `/departments/${id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader title="Edit Department" subtitle="Update department details" />

      <PageBody>
        <DepartmentForm item={item} />
      </PageBody>
    </PageShell>
  );
}
