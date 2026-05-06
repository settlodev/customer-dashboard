"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CornerDownRight, LayoutGrid, Users } from "lucide-react";

import { CellAction } from "@/components/tables/space/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Space, TABLE_SPACE_TYPE_LABELS, TABLE_STATUS_LABELS } from "@/types/space/type";
import { TableSpaceType, TableStatus } from "@/types/enums";

const tableStatusVariant = (status: TableStatus | null) => {
  switch (status) {
    case TableStatus.AVAILABLE:
      return "default";
    case TableStatus.RESERVED:
      return "secondary";
    case TableStatus.SEATED:
    case TableStatus.OCCUPIED:
      return "outline";
    case TableStatus.DIRTY:
    case TableStatus.OUT_OF_SERVICE:
      return "destructive";
    default:
      return "outline";
  }
};

const selectColumn: ColumnDef<Space> = {
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
};

const nameColumn = (label: "Table" | "Space"): ColumnDef<Space> => ({
  accessorKey: "name",
  enableHiding: false,
  header: ({ column }) => {
    return (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  },
  cell: ({ row }) => {
    const name = row.original.name;
    const code = row.original.code;
    const parentName = row.original.parentSpaceName;
    const hasParent = !!parentName;

    return (
      <div className={`flex items-center gap-3 ${hasParent ? "pl-6" : ""}`}>
        {hasParent && (
          <CornerDownRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0 -ml-6" />
        )}
        <div className="min-w-0">
          <span className="font-medium text-gray-900 dark:text-gray-100 block truncate">
            {name}
          </span>
          {(hasParent || code) && (
            <span className="text-xs text-muted-foreground block truncate">
              {hasParent ? parentName : ""}{hasParent && code ? " · " : ""}{code || ""}
            </span>
          )}
        </div>
      </div>
    );
  },
});

const typeColumn: ColumnDef<Space> = {
  accessorKey: "type",
  header: "Type",
  cell: ({ row }) => (
    <Badge variant="outline">
      {TABLE_SPACE_TYPE_LABELS[row.original.type as TableSpaceType] || row.original.type}
    </Badge>
  ),
};

const capacityColumn: ColumnDef<Space> = {
  accessorKey: "capacity",
  header: "Capacity",
  cell: ({ row }) => {
    const min = row.original.minCapacity;
    const max = row.original.capacity;
    return (
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-gray-900 dark:text-gray-100">
          {min ? `${min}–${max}` : max}
        </span>
      </div>
    );
  },
};

const tableStatusColumn: ColumnDef<Space> = {
  accessorKey: "tableStatus",
  header: () => <div className="hidden md:block">Status</div>,
  cell: ({ row }) => {
    const status = row.original.tableStatus as TableStatus | null;
    if (!status)
      return (
        <div className="hidden md:block">
          <span className="text-muted-foreground text-xs">—</span>
        </div>
      );
    return (
      <div className="hidden md:block">
        <Badge variant={tableStatusVariant(status)}>
          {TABLE_STATUS_LABELS[status]}
        </Badge>
      </div>
    );
  },
};

const floorPlanColumn: ColumnDef<Space> = {
  accessorKey: "floorPlanName",
  header: () => <div className="hidden md:block">Floor plan</div>,
  cell: ({ row }) => {
    const name = row.original.floorPlanName;
    return (
      <div className="hidden md:block">
        {name ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
            <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
            {name}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </div>
    );
  },
};

const activeColumn: ColumnDef<Space> = {
  id: "active",
  accessorKey: "active",
  header: "Active",
  enableHiding: true,
  cell: ({ row }) => {
    const isActive = row.original.active;
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          isActive
            ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  },
};

const actionsColumn = (basePath: "/tables" | "/spaces"): ColumnDef<Space> => ({
  id: "actions",
  enableHiding: false,
  header: () => null,
  cell: ({ row }) => (
    <div className="flex justify-end">
      <CellAction data={row.original} basePath={basePath} />
    </div>
  ),
});

export const tableColumns: ColumnDef<Space>[] = [
  selectColumn,
  nameColumn("Table"),
  typeColumn,
  capacityColumn,
  tableStatusColumn,
  activeColumn,
  actionsColumn("/tables"),
];

export const spaceColumns: ColumnDef<Space>[] = [
  selectColumn,
  nameColumn("Space"),
  typeColumn,
  capacityColumn,
  floorPlanColumn,
  activeColumn,
  actionsColumn("/spaces"),
];
