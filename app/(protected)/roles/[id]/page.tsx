import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { isProtectedRole, Role } from "@/types/roles/type";
import { getRole } from "@/lib/actions/role-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Shield, CheckCircle2, Info, Lock } from "lucide-react";

type Params = Promise<{ id: string }>;

export default async function RolesPage({ params }: { params: Params }) {
  const resolvedParams = await params;

  if (resolvedParams.id === "new") {
    redirect("/roles/new/edit");
  }

  let role: Role | null = null;

  try {
    role = await getRole(resolvedParams.id);
    if (!role) notFound();
  } catch {
    throw new Error("Failed to load role data");
  }

  const breadcrumbItems = [
    { title: "Roles", link: "/roles" },
    { title: role.name, link: "" },
  ];

  // Group permission keys by category (prefix before ":")
  const permissionsByCategory: Record<string, string[]> = {};
  (role.permissionKeys ?? []).forEach((key) => {
    const [category, action] = key.split(":");
    const cat = category || "other";
    if (!permissionsByCategory[cat]) permissionsByCategory[cat] = [];
    permissionsByCategory[cat].push(action || key);
  });

  const sortedCategories = Object.keys(permissionsByCategory).sort((a, b) => a.localeCompare(b));
  sortedCategories.forEach((cat) => {
    permissionsByCategory[cat].sort((a, b) => a.localeCompare(b));
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <BreadcrumbsNav items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{role.name}</h1>
            {role.system && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                System
              </span>
            )}
            {isProtectedRole(role) && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <Lock className="h-3 w-3" />
                Protected
              </span>
            )}
          </div>
          {role.description && (
            <p className="text-muted-foreground mt-1 text-sm">{role.description}</p>
          )}
        </div>
        {!isProtectedRole(role) && (
          <Link href={`/roles/${role.id}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Role
            </Button>
          </Link>
        )}
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
              <span className="text-xs text-muted-foreground">Scope</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                {role.scope.toLowerCase()}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Type</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {role.system ? "System" : "Custom"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Total Permissions</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {role.permissionCount ?? role.permissionKeys?.length ?? 0}
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
          {sortedCategories.length > 0 ? (
            <div className="space-y-4">
              {sortedCategories.map((category) => (
                <div key={category} className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">{category}</h4>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {permissionsByCategory[category].map((action) => (
                      <div key={action} className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs font-medium text-primary">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No permissions assigned to this role.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
