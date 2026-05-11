"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/staff/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { StaffListEnriched } from "@/types/staff";

export const columns: ColumnDef<StaffListEnriched>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
  },
  {
    accessorKey: "firstName",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="xs"
        className="-ml-2 h-auto px-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-ink"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Staff member
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const staff = row.original.staff;
      const fullName = `${staff.firstName} ${staff.lastName}`;
      return (
        <div className="flex min-w-[240px] items-center gap-3">
          <TableAvatar
            name={fullName}
            seed={staff.id}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-[13px] font-medium text-ink">
                {fullName}
              </div>
              {staff.owner && (
                <Badge variant="warn" className="text-[9.5px]">
                  Owner
                </Badge>
              )}
            </div>
            {(staff.jobTitle || staff.identifier) && (
              <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                {staff.jobTitle}
                {staff.jobTitle && staff.identifier && (
                  <span className="mx-1.5 text-muted-2">·</span>
                )}
                {staff.identifier && (
                  <span className="font-mono tracking-[0.02em]">
                    {staff.identifier}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "department",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Department</span>,
    cell: ({ row }) => {
      const staff = row.original.staff;
      const primary = staff.departmentName;
      const extras = staff.departments?.filter((d) => d.id !== staff.departmentId) ?? [];
      if (!primary) {
        return (
          <span className="hidden text-muted-foreground md:inline">—</span>
        );
      }
      return (
        <div className="hidden items-center gap-1.5 md:flex">
          <Badge variant="soft">{primary}</Badge>
          {extras.length > 0 && (
            <span className="font-mono text-[10.5px] text-muted-foreground">
              +{extras.length}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "roles",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Roles</span>,
    cell: ({ row }) => {
      const roles = row.original.staff.roles ?? [];
      if (roles.length === 0) {
        return (
          <span className="hidden text-muted-foreground lg:inline">—</span>
        );
      }
      const visible = roles.slice(0, 2);
      const overflow = roles.length - visible.length;
      return (
        <div className="hidden flex-wrap items-center gap-1 lg:flex">
          {visible.map((r) => (
            <Badge key={r.id} variant="soft" className="text-[10.5px]">
              {r.name}
            </Badge>
          ))}
          {overflow > 0 && (
            <span className="font-mono text-[10.5px] text-muted-foreground">
              +{overflow}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "phone",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Contact</span>,
    cell: ({ row }) => {
      const { phoneNumber, email } = row.original.staff;
      if (!phoneNumber && !email) {
        return (
          <span className="hidden text-muted-foreground md:inline">—</span>
        );
      }
      return (
        <div className="hidden flex-col md:flex">
          {phoneNumber && (
            <span className="font-mono text-[12px] tabular-nums text-ink">
              {phoneNumber}
            </span>
          )}
          {email && (
            <span className="truncate text-[11px] text-muted-foreground">
              {email}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "access",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Access</span>,
    cell: ({ row }) => {
      const { posAccess, dashboardAccess, hasPin } = row.original.staff;
      if (!posAccess && !dashboardAccess) {
        return (
          <span className="hidden text-muted-foreground lg:inline">None</span>
        );
      }
      return (
        <div className="hidden flex-wrap items-center gap-1 lg:flex">
          {posAccess && (
            <Badge variant={hasPin ? "pos" : "warn"} className="text-[10.5px]">
              POS
              {!hasPin && <span className="ml-1 opacity-80">no PIN</span>}
            </Badge>
          )}
          {dashboardAccess && (
            <Badge variant="soft" className="text-[10.5px]">
              Dashboard
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isActive = row.original.staff.active;
      return (
        <Badge variant={isActive ? "pos" : "soft"}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => null,
    size: 40,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <CellAction data={row.original.staff} />
      </div>
    ),
  },
];
