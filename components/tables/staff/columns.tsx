"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { CellAction } from "@/components/tables/staff/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StateColumn } from "@/components/tables/state-column";
import { Staff } from "@/types/staff";
// import { useState } from "react";
// const PassCodeCell = ({ passCode }: { passCode: number }) => {
//   const [isVisible, setIsVisible] = useState(false); 

//   return (
//     <span onClick={() => setIsVisible(!isVisible)} className="cursor-pointer">
//       {isVisible ? String(passCode) : "*****"} 
//     </span>
//   );
// }

export const columns: ColumnDef<Staff>[] = [
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
  },
  {
    accessorKey: "roleName",
    enableHiding: true,
    header: "Role",
  },
  {
    accessorKey: "departmentName",
    enableHiding: true,
    header: "Department",
  },
  {
    accessorKey: "phone",
    enableHiding: true,
    header: "Phone Number",
  },
  // {
  //   accessorKey: "passCode",
  //   enableHiding: true,
  //   header: "Passcode",
  //   cell: ({ row }) => {
  //     const passCode = row.getValue("passCode") as number;
  //     return <PassCodeCell passCode={passCode} />; 
  //   },
  // },
  {
    accessorKey: "posAccess",
    enableHiding: true,
    header: "POS Access",
    cell: ({ row }) => {
      const posAccess = row.getValue("posAccess");
      return (
        <span className={posAccess ? "text-white bg-green-500 p-1 rounded-sm" : "text-white bg-red-500 p-1 rounded-sm"}>
          {posAccess ? "Yes" : "No"}
        </span>
      );
    },
  },
  {
    accessorKey: "dashboardAccess",
    enableHiding: true,
    header: "Dashboard Access",
    cell: ({ row }) => (
      <span className={row.getValue("dashboardAccess") ? "text-white bg-green-500 p-1 rounded-sm" : "text-white bg-red-500 p-1 rounded-sm"}>
        {row.getValue("dashboardAccess") ? "Yes" : "No"}
      </span>
    ),
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