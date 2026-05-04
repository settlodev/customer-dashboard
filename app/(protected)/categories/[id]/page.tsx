import { notFound } from "next/navigation";
import { Category } from "@/types/category/type";
import { getCategory } from "@/lib/actions/category-actions";
import { fetchDepartmentsForCurrentLocation } from "@/lib/actions/department-actions";
import type { Department } from "@/types/department/type";
import CategoryForm from "@/components/forms/category_form";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";

type Params = Promise<{ id: string }>;

export default async function CategoryPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: Category | null = null;

  if (!isNewItem) {
    try {
      item = await getCategory(resolvedParams.id);
    } catch {
      notFound();
    }
  }

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
          { title: isNewItem ? "New" : item?.name || "Edit" },
        ]}
      />
      <PageHeader
        title={isNewItem ? "Add Category" : "Edit Category"}
        subtitle={
          isNewItem
            ? "Create a new category for your business"
            : "Update category details and settings"
        }
      />

      <PageBody>
        <CategoryForm
          item={item}
          departments={departments}
          defaultDepartmentId={defaultDepartmentId}
        />
      </PageBody>
    </PageShell>
  );
}
