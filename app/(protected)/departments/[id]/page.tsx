import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import { ApiResponse } from "@/types/types";
import { Department } from "@/types/department/type";
import { getDepartment } from "@/lib/actions/department-actions";
import DepartmentForm from "@/components/forms/department_form";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";

type Params = Promise<{ id: string }>;
export default async function DepartmentPage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: ApiResponse<Department> | null = null;

  if (!isNewItem) {
    try {
      item = await getDepartment(resolvedParams.id as UUID);
      if (item.totalElements == 0) notFound();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to load department data");
    }
  }

  const breadcrumbItems = [
    { title: "Departments", link: "/departments" },
    {
      title: isNewItem ? "New" : item?.content[0]?.name || "Edit",
      link: "",
    },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isNewItem ? "Add Department" : "Edit Department"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Create a new department for your business"
              : "Update department details and settings"}
          </p>
        </div>

        {/* Form */}
        <DepartmentForm item={isNewItem ? null : item?.content[0]} />
      </div>
    </div>
  );
}
