import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Role } from "@/types/roles/type";
import { ApiResponse } from "@/types/types";
import { getRole } from "@/lib/actions/role-actions";
import RoleForm from "@/components/forms/role_form";

type Params = Promise<{ id: string }>;
export default async function RolesPage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: ApiResponse<Role> | null = null;

  if (!isNewItem) {
    try {
      item = await getRole(resolvedParams.id as UUID);
      if (item.totalElements == 0) notFound();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to load role data");
    }
  }

  const breadcrumbItems = [
    { title: "Roles", link: "/roles" },
    {
      title: isNewItem ? "New" : item?.content[0]?.name || "Edit",
      link: "",
    },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isNewItem ? "Add Role" : "Edit Role"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Create a new role and assign permissions"
              : "Update role details and permissions"}
          </p>
        </div>

        <RoleForm item={isNewItem ? null : item?.content[0]} />
      </div>
    </div>
  );
}
