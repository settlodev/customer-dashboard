"use client";

import { EyeIcon, MoreHorizontal} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
// import { useDisclosure } from "@nextui-org/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Invoice } from "@/types/invoice/type";

interface CellActionProps {
  data: Invoice;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {

  const router = useRouter();
  

  return (
    <>
      <div className="relative flex items-center gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <span className="sr-only">Actions</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/invoices/${data.id}`)}
            >
              <EyeIcon className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
           
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
