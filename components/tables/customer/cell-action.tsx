"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  ArchiveRestore,
  Eye,
  MoreVertical,
  Pencil as EditIcon,
  UserMinus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import { Customer } from "@/types/customer/type";
import {
  deactivateCustomer,
  reactivateCustomer,
  restoreCustomer,
} from "@/lib/actions/customer-actions";

interface CellActionProps {
  data: Customer;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isDeactivateOpen, setDeactivateOpen] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fullName = `${data.firstName} ${data.lastName}`;

  const handleDeactivate = async () => {
    try {
      await deactivateCustomer(data.id);
      toast({
        title: "Deactivated",
        description: `${fullName} has been deactivated.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't deactivate",
        description:
          (error as Error).message ||
          "There was an issue with your request, please try again later.",
      });
    } finally {
      setDeactivateOpen(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      await reactivateCustomer(data.id);
      toast({
        title: "Reactivated",
        description: `${fullName} is back to active.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't reactivate",
        description:
          (error as Error).message ||
          "There was an issue with your request, please try again later.",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreCustomer(data.id);
      toast({
        title: "Restored",
        description: `${fullName} has been restored.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't restore",
        description:
          (error as Error).message ||
          "There was an issue with your request, please try again later.",
      });
    } finally {
      setIsRestoring(false);
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
          <DropdownMenuItem onClick={() => router.push(`/customers/${data.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/customers/${data.id}/edit`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {data.isArchived ? (
            <DropdownMenuItem
              onClick={handleRestore}
              disabled={isRestoring}
              className="text-emerald-600 focus:text-emerald-600"
            >
              <ArchiveRestore className="mr-2 h-4 w-4" />
              {isRestoring ? "Restoring…" : "Restore"}
            </DropdownMenuItem>
          ) : data.active ? (
            <DropdownMenuItem
              onClick={() => setDeactivateOpen(true)}
              className="text-amber-600 focus:text-amber-600"
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={handleReactivate}
              disabled={isReactivating}
              className="text-emerald-600 focus:text-emerald-600"
            >
              <ArchiveRestore className="mr-2 h-4 w-4" />
              {isReactivating ? "Reactivating…" : "Reactivate"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal
        isOpen={isDeactivateOpen}
        itemName={fullName}
        onDelete={handleDeactivate}
        onOpenChange={() => setDeactivateOpen(false)}
      />
    </>
  );
};
