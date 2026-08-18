import { fetchDepartmentsForCurrentLocation } from "@/lib/actions/department-actions";
import type { Department } from "@/types/department/type";
import CategoryForm from "@/components/forms/category_form";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";

export default async function NewCategoryPage() {
  // Departments load server-side so the form mounts with a valid
  // `departmentId` already in defaultValues — without this, a fast submit
  // races the client fetch and Zod rejects the empty UUID.
  const departments: Department[] = await fetchDepartmentsForCurrentLocation(
    true,
  ).catch(() => []);
  const defaultDepartmentId =
    departments.find((d) => d.isDefault)?.id ??
    (departments.length === 1 ? departments[0].id : undefined);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Categories", href: "/categories" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add Category"
        subtitle="Create a new category for your business"
      />

      <PageBody>
        <CategoryForm
          item={null}
          departments={departments}
          defaultDepartmentId={defaultDepartmentId}
        />
      </PageBody>
    </PageShell>
  );
}
