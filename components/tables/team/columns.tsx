"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "@/components/tables/team/cell-action";
import { AccountMember } from "@/lib/actions/account-member-actions";
import { Location } from "@/types/location/type";

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Humanize a non-location scope type ("STORE" → "Store") for the rare member
// whose access isn't a plain location.
const titleCaseScope = (s: string) =>
  s ? s.charAt(0) + s.slice(1).toLowerCase() : s;

interface ColumnOptions {
  /** Accessible locations, used to resolve a member's scopeId → location name. */
  locations: Location[];
  /** Reload the members list after an inline edit or removal. */
  onChanged: () => void;
}

export const getColumns = ({
  locations,
  onChanged,
}: ColumnOptions): ColumnDef<AccountMember>[] => {
  const locationNames = new Map(locations.map((l) => [l.id, l.name]));

  const scopeLabel = (scopeType: string, scopeId: string) => {
    if (scopeType === "ACCOUNT") return "Account-wide";
    return locationNames.get(scopeId) ?? titleCaseScope(scopeType);
  };

  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="w-4">
          <Checkbox
            aria-label="Select all"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="w-4">
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "firstName",
      enableHiding: false,
      header: ({ column }) => (
        <Button
          className="text-left p-0 font-semibold"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Member
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const { firstName, lastName, email } = row.original;
        return (
          <div className="min-w-0">
            <span className="font-medium text-gray-900 dark:text-gray-100 block truncate">
              {firstName} {lastName}
            </span>
            <span className="text-xs text-muted-foreground block truncate">{email}</span>
          </div>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      enableHiding: true,
      cell: ({ row }) => {
        const scopes = row.original.scopes;
        if (!scopes?.length) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {scopes.map((s, i) => (
              <span
                key={`${s.scopeType}-${s.scopeId}-${i}`}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 whitespace-nowrap"
              >
                {scopeLabel(s.scopeType, s.scopeId)}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "roles",
      header: "Roles",
      enableHiding: true,
      cell: ({ row }) => {
        const roles = row.original.roles;
        if (!roles?.length) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <span key={r.id} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                {r.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      enableHiding: true,
      cell: ({ row }) => {
        const { pending, active } = row.original;
        if (pending) {
          return (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              Pending
            </span>
          );
        }
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            active
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}>
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      id: "invitedAt",
      header: "Invited",
      enableHiding: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.invitedAt)}
        </span>
      ),
    },
    {
      id: "joinedAt",
      header: "Joined",
      enableHiding: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.acceptedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <CellAction data={row.original} locations={locations} onChanged={onChanged} />
        </div>
      ),
    },
  ];
};
