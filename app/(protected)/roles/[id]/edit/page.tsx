import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Role } from "@/types/roles/type";
import { ApiResponse } from "@/types/types";
import { getRole } from "@/lib/actions/role-actions";
import RoleForm from "@/components/forms/role_form";

type Params = Promise<{ id: string }>;

export default async function RoleEditPage({
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

  const role = isNewItem ? null : item?.content[0];

  const breadcrumbItems = isNewItem
    ? [
        { title: "Roles", link: "/roles" },
        { title: "New", link: "" },
      ]
    : [
        { title: "Roles", link: "/roles" },
        { title: role!.name, link: `/roles/${role!.id}` },
        { title: "Edit", link: "" },
      ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {isNewItem ? "Add Role" : "Edit Role"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isNewItem
            ? "Create a new role and assign permissions"
            : `Update details for ${role!.name}`}
        </p>
      </div>

      <RoleForm item={isNewItem ? null : role} />
    </div>
  );
}
