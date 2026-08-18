"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CreateInternalUserDialog } from "@/components/admin/create-internal-user-dialog";
import { EditInternalUserDialog } from "@/components/admin/edit-internal-user-dialog";
import { EditInternalStaffDetailsDialog } from "@/components/admin/edit-internal-staff-details-dialog";
import { DeactivateInternalUserDialog } from "@/components/admin/deactivate-internal-user-dialog";

import {
  InternalUserResponse,
  InternalUserStatus,
  RolePermissionsResponse,
} from "@/types/admin/internal-user";
import { InternalStaffSummary } from "@/types/admin/internal-staff";

interface InternalUsersViewProps {
  users: InternalUserResponse[];
  roles: RolePermissionsResponse[];
  /**
   * Rich internal-staff profiles (Accounts Service), keyed by authUserId, that
   * carry the name + HRM details overlaid onto the Auth identity list.
   */
  profiles: InternalStaffSummary[];
  canMutate: boolean;
  currentUserId: string | null | undefined;
}

const ROLE_FILTER_ALL = "ALL" as const;
const STATUS_FILTER_ALL = "ALL" as const;

const STATUS_BADGE: Record<
  InternalUserStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  INACTIVE: {
    label: "Inactive",
    className:
      "bg-muted text-muted-foreground border-line dark:bg-muted dark:text-muted-foreground",
  },
  SUSPENDED: {
    label: "Suspended",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  },
  PENDING_VERIFICATION: {
    label: "Pending",
    className:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  },
  LOCKED: {
    label: "Locked",
    className:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
};

function roleLabel(role: string): string {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) =>
    c.toUpperCase(),
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatRelative(value: string | null | undefined): string {
  if (!value) return "Never";
  try {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function InternalUsersView({
  users,
  roles,
  profiles,
  canMutate,
  currentUserId,
}: InternalUsersViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ROLE_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState<
    InternalUserStatus | typeof STATUS_FILTER_ALL
  >(STATUS_FILTER_ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InternalUserResponse | null>(null);
  const [detailsTarget, setDetailsTarget] =
    useState<InternalStaffSummary | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<InternalUserResponse | null>(null);

  // Auth user id == Accounts profile authUserId — the join key.
  const profileByAuthId = useMemo(() => {
    const map = new Map<string, InternalStaffSummary>();
    for (const p of profiles) map.set(p.authUserId, p);
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== ROLE_FILTER_ALL && (u.roleCode ?? "") !== roleFilter) {
        return false;
      }
      if (statusFilter !== STATUS_FILTER_ALL && u.status !== statusFilter) {
        return false;
      }
      if (needle) {
        const name = profileByAuthId.get(u.id)?.fullName ?? "";
        if (
          !u.email.toLowerCase().includes(needle) &&
          !name.toLowerCase().includes(needle)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter, profileByAuthId]);

  const handleMutated = () => {
    // Server actions already revalidate /admin/users — refresh fetches the new data.
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={roleFilter}
            onValueChange={(v) =>
              setRoleFilter(v)
            }
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROLE_FILTER_ALL}>All roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.role} value={r.role}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(
                v === STATUS_FILTER_ALL
                  ? STATUS_FILTER_ALL
                  : (v as InternalUserStatus),
              )
            }
          >
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {(Object.keys(STATUS_BADGE) as InternalUserStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_BADGE[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canMutate && (
          <Button onClick={() => setCreateOpen(true)} className="md:ml-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            New staff user
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-line">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {users.length === 0
                    ? "No internal users yet."
                    : "No users match the current filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const badge = STATUS_BADGE[user.status];
                const isSelf = currentUserId === user.id;
                const profile = profileByAuthId.get(user.id);
                const name = profile?.fullName?.trim();
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-ink">
                      <div className="flex items-center gap-2">
                        {name ? (
                          <span>{name}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {isSelf && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                            you
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.roleName ?? roleLabel(user.roleCode ?? "—")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={badge?.className}
                      >
                        {badge?.label ?? user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-muted-foreground">
                      {formatRelative(user.lastLoginAt)}
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {canMutate ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Actions for ${user.email}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                if (profile) setDetailsTarget(profile);
                              }}
                              disabled={!profile}
                            >
                              Edit details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setEditTarget(user)}
                              disabled={isSelf}
                            >
                              Change role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setDeactivateTarget(user)}
                              disabled={isSelf || user.status === "INACTIVE"}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      {canMutate && (
        <CreateInternalUserDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          roles={roles}
          onCreated={handleMutated}
        />
      )}
      {canMutate && editTarget && (
        <EditInternalUserDialog
          user={editTarget}
          roles={roles}
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          onUpdated={handleMutated}
        />
      )}
      {canMutate && detailsTarget && (
        <EditInternalStaffDetailsDialog
          profile={detailsTarget}
          open={!!detailsTarget}
          onOpenChange={(open) => {
            if (!open) setDetailsTarget(null);
          }}
          onUpdated={handleMutated}
        />
      )}
      {canMutate && deactivateTarget && (
        <DeactivateInternalUserDialog
          user={deactivateTarget}
          open={!!deactivateTarget}
          onOpenChange={(open) => {
            if (!open) setDeactivateTarget(null);
          }}
          onDeactivated={handleMutated}
        />
      )}
    </div>
  );
}
