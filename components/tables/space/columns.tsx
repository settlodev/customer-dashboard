"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { CellAction } from "@/components/tables/space/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StateColumn } from "@/components/tables/state-column";
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

export const columns: ColumnDef<Space>[] = [
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
  },
  {
    accessorKey: "name",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>
        <span className="font-medium">{row.original.name}</span>
        {row.original.code && (
          <span className="text-muted-foreground text-xs ml-2">
            ({row.original.code})
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">
        {TABLE_SPACE_TYPE_LABELS[row.original.type as TableSpaceType] || row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
    cell: ({ row }) => {
      const min = row.original.minCapacity;
      const max = row.original.capacity;
      return min ? `${min}–${max}` : `${max}`;
    },
  },
  {
    accessorKey: "tableStatus",
    header: "Table Status",
    cell: ({ row }) => {
      const status = row.original.tableStatus as TableStatus | null;
      if (!status) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <Badge variant={tableStatusVariant(status)}>
          {TABLE_STATUS_LABELS[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "parentSpaceName",
    header: "Parent",
    cell: ({ row }) => row.original.parentSpaceName || <span className="text-muted-foreground text-xs">—</span>,
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <StateColumn state={row.original.status} />,
    enableHiding: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
