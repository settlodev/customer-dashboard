"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, MoreHorizontal, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

import { RoleFormDialog } from "@/components/admin/role-form-dialog";
import { deactivateInternalRole } from "@/lib/actions/admin/internal-roles";
import { InternalRoleResponse } from "@/types/admin/internal-role";

interface RolesViewProps {
  roles: InternalRoleResponse[];
  permissionCatalog: string[];
  canManage: boolean;
}

function assignableBadge(value: string | null) {
  if (value === "SALES") return "Sales";
  if (value === "SUPPORT") return "Support";
  return "—";
}

export function RolesView({
  roles,
  permissionCatalog,
  canManage,
}: RolesViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InternalRoleResponse | null>(
    null,
  );

  const handleSaved = () => router.refresh();

  const handleDeactivate = async (role: InternalRoleResponse) => {
    const result = await deactivateInternalRole(role.id);
    toast({
      title:
        result.responseType === "error" ? "Failed" : "Role deactivated",
      description: result.responseType === "error" ? result.message : role.name,
    });
    if (result.responseType !== "error") router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          Roles control portal permissions and whether a holder can be assigned
          as an account&apos;s sales or support person.
        </p>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New role
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Assignable as</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium text-ink">
                    <div className="flex items-center gap-1.5">
                      {role.name}
                      {role.systemRole && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">
                    {role.code}
                  </TableCell>
                  <TableCell>{assignableBadge(role.assignableAs)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.permissions.length}
                  </TableCell>
                  <TableCell>
                    {role.active ? (
                      <Badge variant="outline">Active</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground"
                      >
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && !role.systemRole ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${role.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditTarget(role)}>
                            Edit
                          </DropdownMenuItem>
                          {role.active && (
                            <DropdownMenuItem
                              onSelect={() => handleDeactivate(role)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {canManage && (
        <RoleFormDialog
          role={null}
          permissionCatalog={permissionCatalog}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSaved={handleSaved}
        />
      )}
      {canManage && editTarget && (
        <RoleFormDialog
          role={editTarget}
          permissionCatalog={permissionCatalog}
          open={!!editTarget}
          onOpenChange={(o) => {
            if (!o) setEditTarget(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
