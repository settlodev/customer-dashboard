import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { isProtectedRole, Role } from "@/types/roles/type";
import { Permission } from "@/types/permissions/type";
import { getRole } from "@/lib/actions/role-actions";
import { fetchAllPermissions } from "@/lib/actions/permissions-actions";
import { groupByDomain, resolveKeys } from "@/lib/permissions/grouping";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Shield,
  CheckCircle2,
  Info,
  Lock,
  ChevronRight,
} from "lucide-react";

type Params = Promise<{ id: string }>;

export default async function RolesPage({ params }: { params: Params }) {
  const resolvedParams = await params;

  if (resolvedParams.id === "new") {
    redirect("/roles/new/edit");
  }

  let role: Role | null = null;
  let catalog: Permission[] = [];

  try {
    // The role only carries permission *keys*; fetch the account catalog in
    // parallel so we can resolve each key to its human-readable name, domain,
    // and description. The catalog is best-effort — if it fails we still render
    // the keys (humanized) rather than break the page.
    const [loadedRole, list] = await Promise.all([
      getRole(resolvedParams.id),
      fetchAllPermissions().catch(() => null),
    ]);
    role = loadedRole;
    catalog = list?.all ?? [];
  } catch {
    throw new Error("Failed to load role data");
  }

  if (!role) notFound();

  const domains = groupByDomain(resolveKeys(role.permissionKeys ?? [], catalog));
  const totalPermissions =
    role.permissionCount ?? role.permissionKeys?.length ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Roles", href: "/roles" }, { title: role.name }]}
      />
      <PageHeader
        title={role.name}
        titleAccessory={
          <span className="inline-flex items-center gap-1.5">
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
          </span>
        }
        subtitle={role.description ?? undefined}
        actions={
          !isProtectedRole(role) ? (
            <Button asChild size="sm">
              <Link href={`/roles/${role.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Role
              </Link>
            </Button>
          ) : undefined
        }
      />

      <PageBody>
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
                <span className="text-xs text-muted-foreground">
                  Total Permissions
                </span>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {totalPermissions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Permissions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Grouped by area. Hover any permission to see what it allows.
            </p>
          </CardHeader>
          <CardContent>
            {domains.length > 0 ? (
              <div className="space-y-3">
                {domains.map((domain) => (
                  <details
                    key={domain.domain}
                    open
                    className="group rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                  >
                    <summary className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {domain.domain}
                        </span>
                      </span>
                      <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5">
                        {domain.count}
                      </span>
                    </summary>
                    <div className="divide-y divide-border border-t border-border">
                      {domain.resources.map((resource) => (
                        <div
                          key={resource.category}
                          className="px-4 py-3 sm:flex sm:gap-4"
                        >
                          <div className="text-xs font-medium text-muted-foreground mb-2 sm:mb-0 sm:w-40 sm:shrink-0 sm:pt-1">
                            {resource.label}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {resource.permissions.map((perm) => (
                              <span
                                key={perm.key}
                                title={perm.description ?? undefined}
                                className="inline-flex items-center gap-1.5 rounded-md bg-primary/5 border border-primary/15 px-2 py-1 text-xs font-medium text-foreground"
                              >
                                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                                {perm.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No permissions assigned to this role.
              </p>
            )}
          </CardContent>
        </Card>
      </PageBody>
    </PageShell>
  );
}
