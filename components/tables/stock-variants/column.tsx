"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreVertical, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StockVariant } from "@/types/stockVariant/type";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function CellAction({ data }: { data: StockVariant }) {
  const router = useRouter();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/stocks/${data.stock}`)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<StockVariant>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="w-4">
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
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
    accessorKey: "stockAndStockVariantName",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0 font-semibold"
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Stock Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.original.stockAndStockVariantName;
      const unit = row.original.unitName;
      return (
        <div className="min-w-0">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">
            {name}
          </span>
          {unit && (
            <span className="text-xs text-muted-foreground block truncate">
              {unit}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "currentAvailable",
    header: () => <div className="text-center">Available</div>,
    enableHiding: true,
    cell: ({ row }) => {
      const current = row.original.currentAvailable;
      const alert = row.original.alertLevel;
      const isLow = alert > 0 && current <= alert;
      return (
        <div className="text-center">
          <span className={`text-sm ${isLow ? "text-red-600 font-semibold" : "text-gray-900 dark:text-gray-100"}`}>
            {Intl.NumberFormat("en-US").format(current)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "currentTotalValue",
    header: () => (
      <div className="hidden md:block">Total Value</div>
    ),
    enableHiding: true,
    cell: ({ row }) => {
      const value = row.original.currentTotalValue;
      return (
        <div className="hidden md:block">
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {Intl.NumberFormat("en-US").format(value)} <span className="text-xs text-muted-foreground">TZS</span>
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "lastStockIntakeTime",
    header: () => (
      <div className="hidden lg:block">Last Intake</div>
    ),
    enableHiding: true,
    cell: ({ row }) => {
      const time = row.original.lastStockIntakeTime;
      if (!time) return <div className="hidden lg:block"><span className="text-sm text-muted-foreground">—</span></div>;
      const formatted = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(time));
      return (
        <div className="hidden lg:block">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatted}
          </span>
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isArchived = row.original.isArchived;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isArchived
              ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
          }`}
        >
          {isArchived ? "Archived" : "Active"}
        </span>
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
        <CellAction data={row.original} />
      </div>
    ),
  },
];
