"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  MoreVertical,
  Eye as EyeIcon,
  Pencil as EditIcon,
  Archive as ArchiveIcon,
  ArchiveRestore,
} from "lucide-react";

import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import {
  deactivateDepartment,
  reactivateDepartment,
} from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CellActionProps {
  data: Department;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const result = await deactivateDepartment(data.id);
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Archived",
          description: `${data.name} has been archived.`,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to archive department",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as Error).message || "Failed to archive department",
      });
    } finally {
      setIsArchiving(false);
      setArchiveModalOpen(false);
    }
  };

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      const result = await reactivateDepartment(data.id);
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Restored",
          description: `${data.name} has been restored.`,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to restore department",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as Error).message || "Failed to restore department",
      });
    } finally {
      setIsUnarchiving(false);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/departments/reports/${data.id}`)}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            View Report
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/departments/${data.id}`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {data.active ? (
            <DropdownMenuItem
              onClick={() => setArchiveModalOpen(true)}
              className="text-red-600 focus:text-red-600"
            >
              <ArchiveIcon className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={handleUnarchive}
              disabled={isUnarchiving}
              className="text-green-600 focus:text-green-600"
            >
              <ArchiveRestore className="mr-2 h-4 w-4" />
              {isUnarchiving ? "Restoring..." : "Unarchive"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive confirmation (for active items) */}
      <DeleteModal
        isOpen={isArchiveModalOpen}
        itemName={data.name}
        onDelete={handleArchive}
        onOpenChange={() => setArchiveModalOpen(false)}
        isLoading={isArchiving}
      />

    </>
  );
};
