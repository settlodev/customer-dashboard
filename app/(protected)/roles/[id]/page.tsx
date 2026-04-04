import { UUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Role } from "@/types/roles/type";
import { ApiResponse, PrivilegeActionItem } from "@/types/types";
import { getRole } from "@/lib/actions/role-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Shield,
  CheckCircle2,
  Info,
} from "lucide-react";

type Params = Promise<{ id: string }>;

export default async function RolesPage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;

  if (resolvedParams.id === "new") {
    redirect("/roles/new/edit");
  }

  let item: ApiResponse<Role> | null = null;

  try {
    item = await getRole(resolvedParams.id as UUID);
    if (item.totalElements == 0) notFound();
  } catch (error) {
    console.log(error);
    throw new Error("Failed to load role data");
  }

  const role = item.content[0];

  const breadcrumbItems = [
    { title: "Roles", link: "/roles" },
    { title: role.name, link: "" },
  ];

  // Group permissions by section and sort alphabetically
  const permissionsBySection: Record<string, PrivilegeActionItem[]> = {};
  role.privilegeActions?.forEach((action) => {
    const section = action.privilegeSectionName || "Other";
    if (!permissionsBySection[section]) {
      permissionsBySection[section] = [];
    }
    permissionsBySection[section].push(action);
  });

  // Sort sections alphabetically, and actions within each section
  const sortedSections = Object.keys(permissionsBySection).sort((a, b) =>
    a.localeCompare(b)
  );
  sortedSections.forEach((section) => {
    permissionsBySection[section].sort((a, b) =>
      (a.action || "").localeCompare(b.action || "")
    );
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Breadcrumbs */}
      <BreadcrumbsNav items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {role.name}
            </h1>
            <span
              className={`h-2.5 w-2.5 rounded-full ${role.status ? "bg-green-500" : "bg-red-500"}`}
            />
          </div>
          {role.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {role.description}
            </p>
          )}
        </div>

        <Link href={`/roles/${role.id}/edit`}>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Role
          </Button>
        </Link>
      </div>

      {/* Role Details */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Role Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    role.status
                      ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {role.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">POS Access</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {role.posAccess ? "Yes" : "No"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Dashboard Access</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {role.dashboardAccess ? "Yes" : "No"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Total Permissions</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {role.privilegeActions?.length ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSections.length > 0 ? (
            <div className="space-y-4">
              {sortedSections.map((section) => (
                <div
                  key={section}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {section}
                    </h4>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {permissionsBySection[section].map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs font-medium text-primary">
                          {action.action}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No permissions assigned to this role.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

