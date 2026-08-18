import { notFound, redirect } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { isProtectedRole, Role } from "@/types/roles/type";
import { getRole } from "@/lib/actions/role-actions";
import RoleForm from "@/components/forms/role_form";

type Params = Promise<{ id: string }>;

export default async function RoleEditPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let role: Role | null = null;

  if (!isNewItem) {
    try {
      role = await getRole(resolvedParams.id);
      if (!role) notFound();
    } catch {
      throw new Error("Failed to load role data");
    }

    if (role && isProtectedRole(role)) {
      redirect(`/roles/${role.id}`);
    }
  }

  const breadcrumbItems = isNewItem
    ? [
        { title: "Roles", href: "/roles" },
        { title: "New" },
      ]
    : [
        { title: "Roles", href: "/roles" },
        { title: role!.name, href: `/roles/${role!.id}` },
        { title: "Edit" },
      ];

  return (
    <PageShell>
      <PageBreadcrumbs items={breadcrumbItems} />
      <PageHeader
        title={isNewItem ? "Add Role" : "Edit Role"}
        subtitle={
          isNewItem
            ? "Create a new role and assign permissions."
            : `Update details for ${role!.name}`
        }
      />
      <PageBody>
        <RoleForm item={isNewItem ? null : role} />
      </PageBody>
    </PageShell>
  );
}
