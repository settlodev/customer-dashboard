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

export default async function EditCategoryPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  let item: Category | null = null;
  try {
    item = await getCategory(id);
  } catch {
    notFound();
  }

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
          { title: item?.name ?? "Category", href: `/categories/${id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title="Edit Category"
        subtitle="Update category details and settings"
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
